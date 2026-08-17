// Media helpers: camera frame capture, image downscale, TTS.

/** Draw the current video frame to a canvas, downscaled to max 480px wide JPEG. */
export function captureFromVideo(video: HTMLVideoElement): string | null {
  const w = video.videoWidth
  const h = video.videoHeight
  if (!w || !h) return null
  const scale = Math.min(1, 480 / w)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.7)
}

/** Draw a bitmap/image to a ≤480px-wide JPEG data URL. */
function drawToJpeg(
  source: CanvasImageSource,
  w: number,
  h: number,
): string | null {
  if (!w || !h) return null
  const scale = Math.min(1, 480 / w)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  try {
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch {
    return null
  }
}

/** Legacy path: decode via <img> element. */
function downscaleViaImgEl(file: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(drawToJpeg(img, img.naturalWidth, img.naturalHeight))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

/**
 * Downscale an image File/Blob to max 480px wide JPEG data URL.
 * Honors EXIF orientation via createImageBitmap (phone photos are often
 * stored rotated); falls back to the <img> path. Returns null when the
 * file cannot be decoded (e.g. HEIC on browsers without support).
 */
export async function downscaleFile(file: Blob): Promise<string | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      const url = drawToJpeg(bmp, bmp.width, bmp.height)
      bmp.close()
      if (url) return url
    } catch {
      /* decode failed or options unsupported — try legacy path */
    }
  }
  return downscaleViaImgEl(file)
}

// ── TTS voice resolution ────────────────────────────────────────────────
// English pronunciation uses a natural-sounding BRITISH (en-GB) voice.
// Voices load lazily in Chrome, so we re-resolve on `voiceschanged` and
// cache the result. Available voices depend on the OS/browser; if no en-GB
// voice exists we fall back gracefully (any en-* voice, then the default).

let voicesCache: SpeechSynthesisVoice[] = []
let lastLoggedVoice: string | null = null

function refreshVoices() {
  try {
    if (!('speechSynthesis' in window)) return
    const v = window.speechSynthesis.getVoices()
    if (v.length > 0) voicesCache = v
  } catch {
    /* ignore */
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices()
  try {
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
  } catch {
    /* ignore */
  }
}

const normLang = (l: string) => (l || '').replace('_', '-').toLowerCase()

/** Natural/neural-sounding en-GB voices, roughly in preference order. */
const NATURAL_VOICE_RE = /natural|neural|online/i
const GOOGLE_UK_RE = /^Google UK English/

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (voicesCache.length === 0) refreshVoices()
  const enGB = voicesCache.filter((v) => normLang(v.lang) === 'en-gb')
  // tier 1: natural / neural / online en-GB voices (Microsoft Sonia, Ryan,
  // Libby "Natural", Edge online voices, …) and Google UK English Female/Male
  const natural =
    enGB.find((v) => GOOGLE_UK_RE.test(v.name)) ??
    enGB.find((v) => NATURAL_VOICE_RE.test(v.name))
  if (natural) return natural
  // tier 2: any other en-GB voice
  if (enGB.length > 0) return enGB[0]
  // tier 3: any en-* voice (e.g. en-US) rather than a non-English default
  return voicesCache.find((v) => normLang(v.lang).startsWith('en')) ?? null
}

function pickVoiceForLang(lang: string): SpeechSynthesisVoice | null {
  if (voicesCache.length === 0) refreshVoices()
  const target = normLang(lang)
  return (
    voicesCache.find((v) => normLang(v.lang) === target) ??
    voicesCache.find((v) => normLang(v.lang).startsWith(target.split('-')[0])) ??
    null
  )
}

function logVoiceOnce(voice: SpeechSynthesisVoice | null, lang: string) {
  const desc = voice ? `${voice.name} (${voice.lang})` : `browser default (${lang})`
  if (desc !== lastLoggedVoice) {
    lastLoggedVoice = desc
    console.debug(`[SnapWord] TTS voice for ${lang}: ${desc}`)
  }
}

/**
 * Pronounce a word with the Web Speech API.
 * English defaults to a natural British (en-GB) voice; other languages
 * (e.g. zh-CN) resolve their own matching voice and are unaffected by the
 * en-GB preference logic.
 */
export function speak(text: string, lang = 'en-GB') {
  try {
    if (!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    // subtle, human-feeling prosody
    u.rate = 0.95
    u.pitch = 1.0
    const voice = normLang(lang).startsWith('en') ? pickEnglishVoice() : pickVoiceForLang(lang)
    // keep the requested lang on the utterance (en-GB for English); an
    // explicitly set voice takes precedence during actual synthesis
    if (voice) u.voice = voice
    logVoiceOnce(voice, lang)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch {
    /* ignore */
  }
}

/** Load a data URL into an HTMLImageElement (for detection / cropping). */
export function loadImageEl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image decode failed'))
    img.src = dataUrl
  })
}

/**
 * Downscale a decoded image for cloud upload: longest side ≤ maxPx,
 * JPEG at the given quality. Returns null when the draw fails.
 */
export function downscaleImage(
  img: HTMLImageElement,
  maxPx = 768,
  quality = 0.8,
): string | null {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) return null
  const scale = Math.min(1, maxPx / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.imageSmoothingQuality = 'high'
  try {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    return null
  }
}

function drawCrop(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): string | null {
  // output: ≤480px, upscaled to at least ~240px for tiny detections
  const outW = Math.round(Math.min(480, Math.max(240, sw)))
  const outH = Math.round((outW / sw) * sh)
  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.imageSmoothingQuality = 'high'
  try {
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch {
    return null
  }
}

/**
 * Crop the detected object region from the photo with padding,
 * expanded toward a square-ish crop. Returns a downscaled JPEG data URL —
 * this is the real-photo "cutout" shown on the card and the wall.
 */
export function cropDetection(
  img: HTMLImageElement,
  bbox: [number, number, number, number],
  padRatio = 0.28,
): string | null {
  const [bx, by, bw, bh] = bbox
  const padX = bw * padRatio
  const padY = bh * padRatio
  let x = bx - padX
  let y = by - padY
  let w = bw + padX * 2
  let h = bh + padY * 2
  // square-ish: expand the shorter side symmetrically
  if (w > h) {
    y -= (w - h) / 2
    h = w
  } else {
    x -= (h - w) / 2
    w = h
  }
  // clamp to image bounds
  x = Math.max(0, Math.min(x, img.naturalWidth - 8))
  y = Math.max(0, Math.min(y, img.naturalHeight - 8))
  w = Math.min(w, img.naturalWidth - x)
  h = Math.min(h, img.naturalHeight - y)
  if (w < 8 || h < 8) return null
  return drawCrop(img, x, y, w, h)
}

/** Square center crop (~62% of the shorter side) — fallback when no bbox. */
export function cropCenter(img: HTMLImageElement): string | null {
  const side = Math.min(img.naturalWidth, img.naturalHeight) * 0.62
  const x = (img.naturalWidth - side) / 2
  const y = (img.naturalHeight - side) / 2
  return drawCrop(img, x, y, side, side)
}
