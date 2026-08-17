import { useEffect, useState } from 'react'
import WordWall from '@/components/WordWall'
import CaptureFlow from '@/components/CaptureFlow'
import RainbowButton from '@/components/RainbowButton'
import { ensureEntries, saveEntries, saveLang, loadLang } from '@/lib/store'
import type { WordEntry } from '@/lib/store'
import { LANGS } from '@/lib/i18n'
import { t } from '@/lib/i18n'
import { preloadPinyin } from '@/lib/pinyin'
import { preloadClip } from '@/lib/clip'
import { applySettingsFromUrl, loadSettings } from '@/lib/settings'
import type { Lang } from '@/lib/i18n'

function initialLang(): Lang {
  const saved = loadLang()
  if (saved && LANGS.some((l) => l.id === saved)) return saved as Lang
  const nav = (navigator.language || 'en').toLowerCase()
  if (nav.startsWith('zh')) return 'zh'
  if (nav.startsWith('ja')) return 'ja'
  if (nav.startsWith('ko')) return 'ko'
  return 'en'
}

export default function Home() {
  const [keyToast, setKeyToast] = useState(false)
  useEffect(() => {
    // one-tap setup link: ?key=... saves the cloud API key, then strips the URL
    if (applySettingsFromUrl()) setKeyToast(true)
    preloadPinyin()
    // idle preload: start the CLIP download in the background so the first
    // snap is fast (weights are browser-cached afterwards). Skip entirely
    // when a cloud key is configured — the cloud fast path never touches
    // local models; they load on demand only if a cloud call fails.
    if (!loadSettings().apiKey.trim()) {
      const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }
      if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(() => preloadClip(), { timeout: 8000 })
      else window.setTimeout(() => preloadClip(), 4000)
    }
  }, [])
  useEffect(() => {
    if (!keyToast) return
    const timer = window.setTimeout(() => setKeyToast(false), 3500)
    return () => window.clearTimeout(timer)
  }, [keyToast])
  const [entries, setEntries] = useState<WordEntry[]>(() => ensureEntries())
  const [lang, setLang] = useState<Lang>(initialLang)
  const [capturing, setCapturing] = useState(false)

  const handleSave = (entry: WordEntry) => {
    setEntries((prev) => {
      const next = [entry, ...prev]
      saveEntries(next)
      return next
    })
  }

  const handleDelete = (id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id)
      saveEntries(next)
      return next
    })
  }

  const handleLang = (l: Lang) => {
    setLang(l)
    saveLang(l)
  }

  return (
    <div className="flex min-h-screen justify-center bg-neutral-200 sm:py-0">
      {/* mobile shell: fullscreen on phones, centered 420px column on desktop */}
      <div className="relative h-screen w-full max-w-[420px] overflow-hidden bg-white shadow-2xl shadow-black/20">
        {keyToast && (
          <div
            role="status"
            className="sw-pop absolute left-1/2 top-5 z-[70] -translate-x-1/2 whitespace-nowrap rounded-full bg-neutral-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-xl"
          >
            {t(lang, 'cloudKeySaved')}
          </div>
        )}
        <WordWall entries={entries} lang={lang} onLangChange={handleLang} onDelete={handleDelete} />
        {!capturing && <RainbowButton onClick={() => setCapturing(true)} />}
        {capturing && (
          <CaptureFlow
            lang={lang}
            onSave={handleSave}
            onClose={() => setCapturing(false)}
          />
        )}
      </div>
    </div>
  )
}
