// Cloud vision-LLM recognition (primary path when an API key is configured).
// OpenAI-compatible chat-completions format, works for both Zhipu GLM-4V-Flash
// (free, reachable from mainland China) and Alibaba DashScope Qwen-VL.
// Any failure (network, CORS, timeout, bad JSON, low confidence) → null and
// the caller silently falls back to the local pipeline.

import { PROVIDERS } from './settings'
import type { Settings } from './settings'

export interface CloudResult {
  en: string
  zh: string
  ja: string
  ko: string
  confidence: number
}

const PROMPT = `Identify the main object in this photo. Reply with JSON only, no markdown, no explanation, in exactly this shape:
{"en":"common English word for the object (singular noun)","zh":"Traditional Chinese translation","ja":"Japanese translation","ko":"Korean translation","confidence":0.0}
confidence is your certainty between 0 and 1.`

const TIMEOUT_MS = 15000
const MIN_CONFIDENCE = 0.4

/** Extract the first {...} JSON object from a possibly-fenced response. */
function parseJsonLoose(text: string): CloudResult | null {
  try {
    const cleaned = text
      .replace(/```(?:json)?/gi, '')
      .trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) return null
    const obj = JSON.parse(match[0]) as Partial<CloudResult>
    if (typeof obj.en !== 'string' || !obj.en.trim()) return null
    const confidence = typeof obj.confidence === 'number' ? obj.confidence : 0
    return {
      en: obj.en.trim(),
      zh: (obj.zh ?? '').trim() || obj.en.trim(),
      ja: (obj.ja ?? '').trim() || obj.en.trim(),
      ko: (obj.ko ?? '').trim() || obj.en.trim(),
      confidence,
    }
  } catch {
    return null
  }
}

export async function recognizeCloud(
  imageDataUrl: string,
  settings: Settings,
): Promise<CloudResult | null> {
  if (!settings.apiKey.trim()) return null
  const provider = PROVIDERS[settings.provider]
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(provider.url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const content = data.choices?.[0]?.message?.content ?? ''
    const parsed = parseJsonLoose(content)
    if (!parsed || parsed.confidence < MIN_CONFIDENCE) return null
    return parsed
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
