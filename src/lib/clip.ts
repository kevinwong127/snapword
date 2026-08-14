// Stage-2 fine-grained classification: zero-shot CLIP via
// @huggingface/transformers (Xenova/clip-vit-base-patch32, q8 quantized).
//
// Performance design: text embeddings for the whole vocabulary are encoded
// ONCE (averaged over 2 prompt templates) and cached; each snap then only
// needs a single vision-encoder forward pass + a dot product — ~1–2s instead
// of re-encoding hundreds of labels every time. Fully client-side; weights
// (~150 MB total for both encoders) download from the HF CDN on first use,
// then browser-cached. Dynamic import + module-level singleton. Any failure
// → caller falls back to COCO-SSD labels.

import { VOCAB, VOCAB_LABELS } from './vocab'
import type { Prediction } from './detection'

interface TensorLike {
  data: Float32Array
  dims: number[]
}

interface ClipState {
  /** encode one image → normalized embedding */
  encodeImage: (dataUrl: string) => Promise<Float32Array>
  /** [L, D] L2-normalized label embeddings, template-averaged */
  textEmb: Float32Array
  dim: number
}

const TEMPLATES = ['a photo of a {}', 'a close-up photo of a {}']
const LOGIT_SCALE = 100 // standard CLIP temperature scaling

let statePromise: Promise<ClipState> | null = null

async function initClip(): Promise<ClipState> {
  const t = await import('@huggingface/transformers')
  t.env.allowLocalModels = false
  const model = 'Xenova/clip-vit-base-patch32'

  // load the separate text/vision encoders explicitly — the combined
  // model.onnx requires both input types and is not usable here
  const [tokenizer, textModel, processor, visionModel] = await Promise.all([
    t.AutoTokenizer.from_pretrained(model),
    t.CLIPTextModelWithProjection.from_pretrained(model, {
      dtype: 'q8',
      model_file_name: 'text_model',
    } as Record<string, unknown>),
    t.AutoProcessor.from_pretrained(model),
    t.CLIPVisionModelWithProjection.from_pretrained(model, {
      dtype: 'q8',
      model_file_name: 'vision_model',
    } as Record<string, unknown>),
  ])

  const L = VOCAB_LABELS.length
  let emb: Float32Array | null = null
  for (const tpl of TEMPLATES) {
    const prompts = VOCAB_LABELS.map((l) => tpl.replace('{}', l))
    const inputs = tokenizer(prompts, { padding: true, truncation: true })
    const out = (await textModel(inputs)) as { text_embeds: TensorLike }
    const te = out.text_embeds
    if (!te || te.dims.length !== 2 || te.dims[0] !== L) {
      throw new Error(`unexpected text_embeds dims: ${te?.dims}`)
    }
    const data = Float32Array.from(te.data)
    if (!emb) {
      emb = data
    } else {
      for (let i = 0; i < emb.length; i++) emb[i] += data[i]
    }
  }
  if (!emb) throw new Error('text embedding failed')

  const dim = emb.length / L
  // average over templates, then L2-normalize each row
  for (let r = 0; r < L; r++) {
    let n = 0
    for (let d = 0; d < dim; d++) {
      const v = emb[r * dim + d] / TEMPLATES.length
      emb[r * dim + d] = v
      n += v * v
    }
    n = Math.sqrt(n) || 1
    for (let d = 0; d < dim; d++) emb[r * dim + d] /= n
  }

  const encodeImage = async (dataUrl: string): Promise<Float32Array> => {
    const image = await t.RawImage.read(dataUrl)
    const imageInputs = await processor(image)
    const out = (await visionModel(imageInputs)) as { image_embeds: TensorLike }
    const v = Float32Array.from(out.image_embeds.data)
    let n = 0
    for (let i = 0; i < v.length; i++) n += v[i] * v[i]
    n = Math.sqrt(n) || 1
    for (let i = 0; i < v.length; i++) v[i] /= n
    return v
  }

  return { encodeImage, textEmb: emb, dim }
}

export function loadClip(): Promise<ClipState> {
  if (!statePromise) {
    statePromise = initClip()
    // allow retry on next attempt if this load fails
    statePromise.catch((e) => {
      console.debug('[SnapWord] CLIP init failed:', e)
      statePromise = null
    })
  }
  return statePromise
}

/** Kick off the CLIP download/load in the background (idle preload). */
export function preloadClip() {
  void loadClip().catch(() => {})
}

/**
 * Classify a (cropped, ≤480px) subject image against the expanded vocabulary.
 * Returns the top-K candidates with softmax probabilities. Throws when the
 * model can't load — caller must fall back.
 */
export async function classifySubject(dataUrl: string, topK = 3): Promise<Prediction[]> {
  const st = await loadClip()
  const v = await st.encodeImage(dataUrl)

  // cosine similarity → scaled logits → softmax
  const L = VOCAB_LABELS.length
  const logits = new Float32Array(L)
  let max = -Infinity
  for (let r = 0; r < L; r++) {
    let s = 0
    const off = r * st.dim
    for (let d = 0; d < st.dim; d++) s += st.textEmb[off + d] * v[d]
    const logit = s * LOGIT_SCALE
    logits[r] = logit
    if (logit > max) max = logit
  }
  let sum = 0
  for (let r = 0; r < L; r++) {
    logits[r] = Math.exp(logits[r] - max)
    sum += logits[r]
  }

  const scored = VOCAB.map((entry, i) => ({ entry, score: logits[i] / sum }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK).map(({ entry, score }) => ({
    label: entry.label,
    word: entry.word,
    score,
    translations: { ...entry.translations },
  }))
}
