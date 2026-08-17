// Cloud vision-LLM provider settings, persisted in localStorage.

export type ProviderId = 'zhipu' | 'dashscope'

export interface Settings {
  provider: ProviderId
  apiKey: string
}

const KEY = 'snapword.settings.v1'

export const PROVIDERS: Record<
  ProviderId,
  { url: string; model: string; name: string }
> = {
  zhipu: {
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4v-flash',
    name: 'Zhipu GLM-4V-Flash',
  },
  dashscope: {
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-vl-plus',
    name: 'Alibaba Qwen-VL',
  },
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Settings
      if (s && (s.provider === 'zhipu' || s.provider === 'dashscope')) {
        return { provider: s.provider, apiKey: s.apiKey ?? '' }
      }
    }
  } catch {
    /* ignore */
  }
  return { provider: 'zhipu', apiKey: '' }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

/**
 * One-tap setup link: `?key=<API_KEY>&provider=zhipu|dashscope` saves the key
 * into the settings store, then immediately strips the params from the address
 * bar so the key never lingers in the URL, bookmarks, or history.
 * Empty/malformed params are ignored silently. Returns true if a key was saved.
 */
export function applySettingsFromUrl(): boolean {
  try {
    const params = new URLSearchParams(window.location.search)
    const key = (params.get('key') ?? '').trim()
    const provider = params.get('provider')
    if (!params.has('key') && !params.has('provider')) return false
    // strip first: even an empty/invalid key must not stay in the URL
    window.history.replaceState(null, '', window.location.pathname)
    if (!key) return false
    const next = loadSettings() // preserves existing fields
    next.apiKey = key
    if (provider === 'zhipu' || provider === 'dashscope') next.provider = provider
    saveSettings(next)
    return true
  } catch {
    return false
  }
}
