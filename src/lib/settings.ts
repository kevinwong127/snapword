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
