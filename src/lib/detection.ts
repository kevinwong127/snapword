// On-device object detection with TensorFlow.js COCO-SSD.
// The tf modules are loaded via dynamic import() so Vite code-splits them
// out of the initial bundle; the model itself is a module-level singleton.

import { COCO_I18N } from './coco-i18n'
import type { Translations } from './objects'

export interface Prediction {
  label: string // raw COCO class, e.g. "potted plant"
  word: string // display label, e.g. "Potted plant"
  score: number
  /** [x, y, width, height] in source-image pixels (absent for CLIP candidates) */
  bbox?: [number, number, number, number]
  translations: Translations
}

interface CocoPrediction {
  bbox: [number, number, number, number]
  class: string
  score: number
}

interface CocoModel {
  detect: (img: HTMLImageElement | HTMLCanvasElement) => Promise<CocoPrediction[]>
}

let modelPromise: Promise<CocoModel> | null = null

function prettify(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function translationsFor(label: string): Translations {
  const entry = COCO_I18N[label]
  const word = prettify(label)
  return {
    en: word,
    zh: entry?.zh ?? word,
    ja: entry?.ja ?? word,
    ko: entry?.ko ?? word,
  }
}

/** Lazily load the COCO-SSD model (webgl backend, wasm fallback, cpu last).
 *  Cached as a singleton — subsequent calls resolve instantly. */
export function loadModel(): Promise<CocoModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import('@tensorflow/tfjs')
      try {
        await tf.setBackend('webgl')
        await tf.ready()
      } catch {
        /* fall through to wasm */
      }
      if (tf.getBackend() !== 'webgl') {
        try {
          const wasm = await import('@tensorflow/tfjs-backend-wasm')
          wasm.setWasmPaths(
            'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.22.0/dist/',
          )
          await tf.setBackend('wasm')
          await tf.ready()
        } catch {
          await tf.setBackend('cpu')
          await tf.ready()
        }
      }
      const coco = await import('@tensorflow-models/coco-ssd')
      // mobilenet_v2 = better mAP than the lite variant, still fast on-device
      const model = await coco.load({ base: 'mobilenet_v2' })
      return model as unknown as CocoModel
    })()
    // allow retry on next attempt if this load fails
    modelPromise.catch(() => {
      modelPromise = null
    })
  }
  return modelPromise
}

/** Run detection, returning up to `max` candidates sorted by score desc. */
export async function detectObjects(
  img: HTMLImageElement,
  max = 3,
): Promise<Prediction[]> {
  const model = await loadModel()
  const preds = await model.detect(img)
  return preds
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((p) => ({
      label: p.class,
      word: prettify(p.class),
      score: p.score,
      bbox: p.bbox,
      translations: translationsFor(p.class),
    }))
}
