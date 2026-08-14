import { useEffect, useRef, useState } from 'react'
import { Check, ImagePlus, RotateCcw, Volume2, X } from 'lucide-react'
import { detectObjects, loadModel } from '@/lib/detection'
import type { Prediction } from '@/lib/detection'
import { classifySubject, loadClip } from '@/lib/clip'
import { cutoutSubject } from '@/lib/bgremove'
import { usePinyin } from '@/lib/pinyin'
import {
  captureFromVideo,
  cropCenter,
  cropDetection,
  downscaleFile,
  loadImageEl,
  speak,
} from '@/lib/media'
import { formatDateLabel, t } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import type { Translations } from '@/lib/objects'
import type { WordEntry } from '@/lib/store'
import { toDateISO, uid } from '@/lib/store'

type Phase = 'camera' | 'analyzing' | 'card' | 'leaving'

interface SnapResult {
  cropUrl: string
  /** true when cropUrl is an alpha-masked transparent PNG sticker */
  sticker: boolean
  candidates: Prediction[]
  /** confident top prediction or user-picked chip */
  picked: Prediction | null
  uncertain: boolean
  modelError: boolean
  word: string
  translation: string
}

interface Props {
  lang: Lang
  onSave: (entry: WordEntry) => void
  onClose: () => void
}

const SPARKLES = Array.from({ length: 12 }, (_, i) => ({
  left: `${8 + ((i * 37) % 84)}%`,
  top: `${10 + ((i * 53) % 76)}%`,
  delay: `${(i % 6) * 0.22}s`,
  char: i % 3 === 0 ? '✦' : i % 3 === 1 ? '✧' : '·',
  size: 10 + ((i * 7) % 12),
}))

/** Renders pinyin under Chinese text once the (lazy) dictionary is ready. */
function Py({ text, className }: { text: string; className?: string }) {
  const py = usePinyin(text)
  if (!py) return null
  return <span className={className}>{py}</span>
}

const CONFIDENCE = 0.5
// CLIP softmax over ~300 labels: a clear subject usually lands ≥0.3
const CLIP_CONFIDENCE = 0.3

export default function CaptureFlow({ lang, onSave, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('camera')
  const [camState, setCamState] = useState<'loading' | 'ready' | 'denied'>('loading')
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [photo, setPhoto] = useState<string | null>(null)
  const [result, setResult] = useState<SnapResult | null>(null)
  const [editing, setEditing] = useState(false)
  const [editWord, setEditWord] = useState('')
  const [editTrans, setEditTrans] = useState('')
  const [uploadError, setUploadError] = useState(false)
  /** analyzing sub-step: localization → CLIP classification → subject cutout */
  const [analyzeStep, setAnalyzeStep] = useState<'detect' | 'classify' | 'cutout'>('detect')
  const [clipReady, setClipReady] = useState(false)

  // auto-dismiss the upload error notice
  useEffect(() => {
    if (!uploadError) return
    const id = window.setTimeout(() => setUploadError(false), 4000)
    return () => window.clearTimeout(id)
  }, [uploadError])

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const analyzeToken = useRef(0)

  // camera (graceful fallback to file upload when unavailable)
  useEffect(() => {
    let cancelled = false
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState('denied')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCamState('ready')
      })
      .catch(() => setCamState('denied'))
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((tr) => tr.stop())
      streamRef.current = null
    }
  }, [])

  // preload the AI models lazily in the background (module-level singletons)
  useEffect(() => {
    let alive = true
    loadModel()
      .then(() => alive && setModelStatus('ready'))
      .catch(() => alive && setModelStatus('error'))
    loadClip()
      .then(() => alive && setClipReady(true))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const startAnalysis = (photoUrl: string) => {
    const token = ++analyzeToken.current
    setUploadError(false)
    setAnalyzeStep('detect')
    setPhoto(photoUrl)
    setPhase('analyzing')

    const minDelay = new Promise((r) => setTimeout(r, 1500))
    const work = (async (): Promise<SnapResult> => {
      const t0 = performance.now()
      // may reject on undecodable data → handled by the outer .catch below
      const img = await loadImageEl(photoUrl)

      // ── stage 1: localize subject with COCO-SSD (center-crop fallback) ──
      let cocoCandidates: Prediction[] = []
      let cocoFailed = false
      try {
        cocoCandidates = await detectObjects(img, 3)
      } catch {
        cocoFailed = true
      }
      const tDetect = performance.now()
      const cocoTop = cocoCandidates[0]
      const crop =
        (cocoTop?.bbox ? cropDetection(img, cocoTop.bbox) : null) ??
        cropCenter(img) ??
        photoUrl

      // ── stage 2: CLIP fine-grained classification on the crop ──
      // runs in parallel with background removal
      if (token === analyzeToken.current) setAnalyzeStep('classify')
      const clipP = classifySubject(crop, 3).catch((): Prediction[] | null => null)
      const cutP = cutoutSubject(crop)
      const clipCandidates = await clipP
      const tClip = performance.now()
      if (token === analyzeToken.current) setAnalyzeStep('cutout')
      const sticker = await cutP

      console.debug(
        `[SnapWord] pipeline coco=${JSON.stringify(cocoCandidates.map((c) => [c.label, +c.score.toFixed(3)]))} clip=${JSON.stringify(clipCandidates ? clipCandidates.map((c) => [c.label, +c.score.toFixed(3)]) : null)} sticker=${!!sticker} detect=${Math.round(tDetect - t0)}ms clip=${Math.round(tClip - tDetect)}ms total=${Math.round(performance.now() - t0)}ms`,
      )

      // full degradation chain: CLIP → COCO-only → manual (modelError)
      let candidates: Prediction[]
      let top: Prediction | undefined
      let confident = false
      if (clipCandidates && clipCandidates.length > 0) {
        candidates = clipCandidates.slice()
        // keep the COCO-SSD label as an extra chip when not already present
        if (cocoTop && !candidates.some((c) => c.label === cocoTop.label)) {
          candidates.push(cocoTop)
        }
        top = candidates[0]
        confident = top.score >= CLIP_CONFIDENCE
      } else {
        candidates = cocoCandidates
        top = candidates[0]
        confident = !!top && top.score >= CONFIDENCE
      }
      const modelError = cocoFailed && !clipCandidates

      if (confident && top) {
        return {
          cropUrl: sticker ?? crop,
          sticker: !!sticker,
          candidates,
          picked: top,
          uncertain: false,
          modelError: false,
          word: top.word,
          translation: top.translations[lang],
        }
      }
      // low confidence / nothing found → uncertain card with candidate chips
      return {
        cropUrl: sticker ?? crop,
        sticker: !!sticker,
        candidates,
        picked: null,
        uncertain: true,
        modelError,
        word: '',
        translation: '',
      }
    })()

    void Promise.all([work, minDelay])
      .then(([res]) => {
        if (token !== analyzeToken.current) return // cancelled
        setResult(res)
        if (res.modelError) {
          setEditWord('')
          setEditTrans('')
          setEditing(true)
        }
        setPhase('card')
      })
      .catch(() => {
        // image decode / unexpected failure → never strand the UI on "analyzing"
        if (token !== analyzeToken.current) return
        setPhoto(null)
        setUploadError(true)
        setPhase('camera')
      })
  }

  const cancelAnalysis = () => {
    analyzeToken.current++
    setPhoto(null)
    setPhase('camera')
  }

  const handleShutter = async () => {
    if (camState === 'ready' && videoRef.current) {
      const url = captureFromVideo(videoRef.current)
      // video not streaming yet (videoWidth = 0) → fall back to the picker
      if (url) startAnalysis(url)
      else fileRef.current?.click()
    } else {
      fileRef.current?.click()
    }
  }

  const handleFile = async (f: File | undefined) => {
    if (!f) return
    const url = await downscaleFile(f)
    if (url) {
      startAnalysis(url)
    } else {
      // undecodable file (HEIC, corrupt, non-image) — tell the user instead
      // of silently doing nothing
      setUploadError(true)
    }
  }

  const pickCandidate = (c: Prediction) => {
    if (!result) return
    setResult({ ...result, picked: c, word: c.word, translation: c.translations[lang] })
    speak(c.word)
  }

  const openEditor = () => {
    if (!result) return
    setEditWord(result.word)
    setEditTrans(result.translation)
    setEditing(true)
  }

  const saveEditor = () => {
    if (!result) return
    setResult({
      ...result,
      word: editWord.trim(),
      translation: editTrans.trim(),
    })
    setEditing(false)
  }

  const confirm = () => {
    if (!result || !photo || !result.word.trim()) return
    speak(result.word)
    setPhase('leaving')
    window.setTimeout(() => {
      const now = new Date()
      const base: Translations = result.picked
        ? { ...result.picked.translations }
        : { en: result.word, zh: result.word, ja: result.word, ko: result.word }
      onSave({
        id: uid(),
        dateISO: toDateISO(now),
        imageDataUrl: result.cropUrl,
        photoDataUrl: photo,
        word: result.word,
        translations: {
          ...base,
          en: result.word,
          [lang]: result.translation || base[lang],
        },
        createdAt: now.getTime(),
      })
      onClose()
    }, 430)
  }

  const reset = () => {
    analyzeToken.current++
    setPhoto(null)
    setResult(null)
    setEditing(false)
    setPhase('camera')
  }

  const today = formatDateLabel(lang, new Date())

  return (
    <div className="absolute inset-0 z-50 bg-black">
      {/* ── camera / preview layer ── */}
      {phase === 'camera' && (
        <>
          {camState !== 'denied' ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex h-full w-full flex-col items-center justify-center gap-4 bg-neutral-900 text-neutral-300"
            >
              <ImagePlus size={44} strokeWidth={1.5} />
              <span className="max-w-[240px] text-center text-sm leading-relaxed">
                {t(lang, 'cameraFallback')}
              </span>
              <span className="rounded-full bg-white px-5 py-2 text-sm font-bold text-neutral-900">
                {t(lang, 'uploadPhoto')}
              </span>
            </button>
          )}

          {/* top hint + model status */}
          <div
            className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/55 to-transparent px-5 pb-10"
            style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
          >
            <p className="text-[17px] font-extrabold text-white">{today}</p>
            <p className="mt-0.5 text-[13px] font-medium text-white/80">{t(lang, 'frameHint')}</p>
            {modelStatus === 'loading' && (
              <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/40 px-3.5 py-1.5 text-[12px] font-semibold text-white/90 backdrop-blur">
                <span className="sw-pulse-dot h-1.5 w-1.5 rounded-full bg-violet-300" />
                {t(lang, 'modelLoading')}
              </span>
            )}
            {modelStatus === 'error' && (
              <span className="mt-3 inline-block rounded-full bg-black/40 px-3.5 py-1.5 text-[12px] font-semibold text-amber-200 backdrop-blur">
                {t(lang, 'modelOffline')}
              </span>
            )}
            {uploadError && (
              <span className="sw-pop mt-3 inline-block rounded-full bg-red-500/80 px-3.5 py-1.5 text-[12px] font-semibold text-white backdrop-blur">
                {t(lang, 'uploadError')}
              </span>
            )}
          </div>

          {/* corner-bracket focus frame */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[46%] w-[72%] max-h-[340px]">
              <span className="absolute left-0 top-0 h-9 w-9 rounded-tl-lg border-l-[3.5px] border-t-[3.5px] border-white" />
              <span className="absolute right-0 top-0 h-9 w-9 rounded-tr-lg border-r-[3.5px] border-t-[3.5px] border-white" />
              <span className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-lg border-b-[3.5px] border-l-[3.5px] border-white" />
              <span className="absolute bottom-0 right-0 h-9 w-9 rounded-br-lg border-b-[3.5px] border-r-[3.5px] border-white" />
            </div>
          </div>

          {/* close + shutter */}
          <button
            onClick={onClose}
            aria-label="close"
            className="absolute right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur active:scale-90"
            style={{ top: 'calc(14px + env(safe-area-inset-top))' }}
          >
            <X size={20} />
          </button>
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-gradient-to-t from-black/55 to-transparent pt-12"
            style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}
          >
            <div className="relative flex items-center justify-center">
              {/* album / upload — always reachable, not only when camera fails */}
              <button
                onClick={() => fileRef.current?.click()}
                aria-label="upload photo"
                className="absolute -left-24 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition active:scale-90"
              >
                <ImagePlus size={20} />
              </button>
              <button
                onClick={handleShutter}
                aria-label="shutter"
                className="h-[74px] w-[74px] rounded-full border-[5px] border-white bg-white/25 backdrop-blur transition active:scale-90"
              />
            </div>
          </div>
        </>
      )}

      {/* ── analyzing: background dissolves away while detection runs ── */}
      {phase === 'analyzing' && photo && (
        <div className="relative h-full w-full overflow-hidden">
          <img src={photo} alt="" className="sw-dissolve-layer absolute inset-0 h-full w-full object-cover" />
          <img src={photo} alt="" className="sw-sharp-center absolute inset-0 h-full w-full object-cover" />
          {SPARKLES.map((s, i) => (
            <span
              key={i}
              className="sw-sparkle text-white"
              style={{ left: s.left, top: s.top, animationDelay: s.delay, fontSize: s.size }}
            >
              {s.char}
            </span>
          ))}
          <div className="absolute inset-x-0 top-[46%] flex flex-col items-center">
            <p className="rounded-full bg-black/45 px-5 py-2 text-sm font-bold text-white backdrop-blur">
              {analyzeStep === 'detect'
                ? t(lang, 'analyzing')
                : analyzeStep === 'classify'
                  ? clipReady
                    ? t(lang, 'classifying')
                    : t(lang, 'bigModelLoading')
                  : t(lang, 'removingBg')}
            </p>
          </div>
          <button
            onClick={cancelAnalysis}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-sm font-semibold text-white/85 underline underline-offset-4"
          >
            {t(lang, 'cancel')}
          </button>
        </div>
      )}

      {/* ── word card ── */}
      {(phase === 'card' || phase === 'leaving') && result && (
        <div className="flex h-full w-full items-end bg-white">
          <div
            className={`flex max-h-full w-full flex-col items-center overflow-y-auto rounded-t-[32px] bg-white px-7 pb-9 pt-10 ${
              phase === 'leaving' ? 'sw-card-out' : 'sw-card-in'
            }`}
            style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}
          >
            {/* subject cutout: transparent sticker, or photo tile as fallback */}
            <div className="relative mb-2 flex h-56 w-full items-center justify-center">
              <div className="sw-glow absolute inset-0 scale-110 rounded-full" />
              {result.sticker ? (
                <img
                  src={result.cropUrl}
                  alt={result.word || 'snap'}
                  className="sw-float sw-sticker-white relative max-h-full max-w-[76%] object-contain"
                />
              ) : (
                <img
                  src={result.cropUrl}
                  alt={result.word || 'snap'}
                  className="sw-float relative h-48 w-48 rounded-[36px] object-cover shadow-2xl shadow-black/25 ring-1 ring-black/5"
                />
              )}
            </div>

            {/* offline / uncertainty notice */}
            {result.modelError && (
              <p className="mb-2 mt-1 max-w-[280px] rounded-2xl bg-amber-50 px-4 py-2 text-center text-[13px] font-semibold leading-snug text-amber-700">
                {t(lang, 'modelOffline')}
              </p>
            )}
            {result.uncertain && !result.modelError && (
              <p className="mb-1 mt-1 text-[13px] font-semibold text-neutral-400">
                {t(lang, 'notSure')}
              </p>
            )}

            {/* candidate chips in uncertain state */}
            {result.uncertain && result.candidates.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                {result.candidates.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => pickCandidate(c)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
                      result.picked?.label === c.label
                        ? 'bg-violet-500 text-white shadow-md shadow-violet-200'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {c.word}
                    <span className="ml-1.5 font-medium opacity-60">
                      {c.translations[lang]}
                      {lang === 'zh' && (
                        <Py
                          text={c.translations.zh}
                          className="block text-[10px] font-normal opacity-70"
                        />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* word pill + pronunciation */}
            {result.word ? (
              <button
                onClick={() => speak(result.word)}
                className="mt-3 flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-2.5 text-lg font-extrabold text-white shadow-lg active:scale-95"
              >
                {result.word}
                <Volume2 size={18} className="text-white/80" />
              </button>
            ) : (
              !editing && (
                <p className="mt-4 text-sm font-medium text-neutral-300">—</p>
              )
            )}

            {/* translation pill (+ pinyin & Mandarin TTS for Chinese) */}
            {result.translation && !editing && (
              <span className="mt-3 flex items-center gap-2 rounded-full bg-neutral-100 px-5 py-1.5">
                <span className="text-center">
                  <span className="block text-[15px] font-semibold leading-tight text-neutral-600">
                    {result.translation}
                  </span>
                  {lang === 'zh' && (
                    <Py
                      text={result.translation}
                      className="block text-[10px] font-medium leading-tight text-neutral-400"
                    />
                  )}
                </span>
                {lang === 'zh' && (
                  <button
                    onClick={() => speak(result.translation, 'zh-CN')}
                    aria-label="speak translation"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-200 active:scale-90"
                  >
                    <Volume2 size={14} />
                  </button>
                )}
              </span>
            )}

            {/* inline correction editor */}
            {editing ? (
              <div className="sw-pop mt-5 w-full rounded-2xl bg-neutral-50 p-4 ring-1 ring-black/5">
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                  {t(lang, 'editWord')}
                </label>
                <input
                  value={editWord}
                  onChange={(e) => setEditWord(e.target.value)}
                  autoFocus
                  className="mb-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[15px] font-semibold outline-none focus:border-violet-400"
                />
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                  {t(lang, 'editTranslation')}
                </label>
                <input
                  value={editTrans}
                  onChange={(e) => setEditTrans(e.target.value)}
                  className="mb-4 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[15px] font-semibold outline-none focus:border-violet-400"
                />
                <button
                  onClick={saveEditor}
                  className="w-full rounded-full bg-neutral-900 py-2.5 text-sm font-bold text-white active:scale-[0.98]"
                >
                  {t(lang, 'save')}
                </button>
              </div>
            ) : (
              <button onClick={openEditor} className="mt-4 text-[13px] font-medium text-neutral-400 underline underline-offset-4">
                {t(lang, 'adjustHint')}
              </button>
            )}

            {/* action buttons */}
            <div className="mt-6 flex items-center gap-8">
              <button
                onClick={reset}
                aria-label="retry"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition active:scale-90"
              >
                <RotateCcw size={22} />
              </button>
              <button
                onClick={confirm}
                disabled={!result.word.trim()}
                aria-label="confirm"
                className={`flex h-[68px] w-[68px] items-center justify-center rounded-full text-white shadow-lg transition active:scale-90 ${
                  result.word.trim()
                    ? 'bg-violet-500 shadow-violet-300'
                    : 'bg-neutral-300 shadow-neutral-200'
                }`}
              >
                <Check size={30} strokeWidth={2.6} />
              </button>
              <button
                onClick={onClose}
                aria-label="cancel"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition active:scale-90"
              >
                <X size={22} />
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
