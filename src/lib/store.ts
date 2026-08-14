// localStorage persistence + seed data for the word wall.

import { OBJECTS, findObject } from './objects'
import type { Translations } from './objects'

export interface WordEntry {
  id: string
  /** local date yyyy-mm-dd, used for grouping */
  dateISO: string
  /** cutout/sticker image shown on the wall (svg data uri or photo) */
  imageDataUrl: string
  /** original captured photo (downscaled jpeg), when snapped via camera */
  photoDataUrl?: string
  word: string
  translations: Translations
  createdAt: number
}

const KEY = 'snapword.words.v1'
const LANG_KEY = 'snapword.lang.v1'

export function toDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function uid(): string {
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function loadEntries(): WordEntry[] | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const list = JSON.parse(raw) as WordEntry[]
    return Array.isArray(list) ? list : null
  } catch {
    return null
  }
}

export function saveEntries(list: WordEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch (e) {
    console.warn('SnapWord: failed to persist words', e)
  }
}

export function loadLang(): string | null {
  try {
    return localStorage.getItem(LANG_KEY)
  } catch {
    return null
  }
}

export function saveLang(lang: string) {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* ignore */
  }
}

/** 8 sample entries across 3 dates so the wall isn't empty on first run. */
export function seedEntries(): WordEntry[] {
  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000
  const mk = (objectId: string, daysAgo: number, hour: number): WordEntry => {
    const obj = findObject(objectId) ?? OBJECTS[0]
    const d = new Date(now.getTime() - daysAgo * dayMs)
    d.setHours(hour, 15, 0, 0)
    return {
      id: uid() + objectId,
      dateISO: toDateISO(d),
      imageDataUrl: obj.image,
      word: obj.translations.en,
      translations: { ...obj.translations },
      createdAt: d.getTime(),
    }
  }
  return [
    mk('donut', 0, 9),
    mk('toast', 1, 18),
    mk('cup', 1, 14),
    mk('monstera', 1, 10),
    mk('tape', 3, 19),
    mk('binder-clip', 3, 16),
    mk('rubber-duck', 3, 12),
    mk('palm-tree', 3, 8),
  ]
}

export function ensureEntries(): WordEntry[] {
  const existing = loadEntries()
  if (existing) return existing
  const seeded = seedEntries()
  saveEntries(seeded)
  return seeded
}
