// Pinyin helper (pinyin-pro): 甜甜圈 → "tián tián quān" with tone marks.
// pinyin-pro ships a large dictionary (~300 KB minified), so it is loaded
// via dynamic import on demand — never in the entry bundle.

import { useEffect, useState } from 'react'

type Converter = (text: string, options?: Record<string, unknown>) => string

let converter: Converter | null = null
let pending: Promise<void> | null = null
const cache = new Map<string, string>()

function ensureLoaded(): Promise<void> {
  if (!pending) {
    pending = import('pinyin-pro')
      .then((m) => {
        converter = m.pinyin as unknown as Converter
      })
      .catch(() => {
        pending = null // allow retry
      })
  }
  return pending
}

/** Start loading the dictionary in the background (call once at app start). */
export function preloadPinyin() {
  void ensureLoaded()
}

/** React hook: returns pinyin with tone marks, '' until the dictionary loads. */
export function usePinyin(zh: string): string {
  const [py, setPy] = useState<string>(() => cache.get(zh) ?? '')
  useEffect(() => {
    if (!zh) {
      setPy('')
      return
    }
    const hit = cache.get(zh)
    if (hit !== undefined) {
      setPy(hit)
      return
    }
    let alive = true
    void ensureLoaded().then(() => {
      if (!alive || !converter) return
      try {
        const v = converter(zh, { toneType: 'symbol', type: 'string' })
        cache.set(zh, v)
        setPy(v)
      } catch {
        /* ignore */
      }
    })
    return () => {
      alive = false
    }
  }, [zh])
  return py
}
