// UI language: drives both UI strings and the word translation shown.

export type Lang = 'en' | 'zh' | 'ja' | 'ko'

export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'zh', label: '中文', short: '中' },
  { id: 'ja', label: '日本語', short: '日' },
  { id: 'ko', label: '한국어', short: '한' },
]

const STRINGS = {
  wordsUnit: { en: 'Words', zh: '單詞', ja: '単語', ko: '개의 단어' },
  empty: {
    en: 'Nothing snapped yet! What’s around you?',
    zh: '還沒有拍下任何單詞！看看你周圍有什麼？',
    ja: 'まだ何も撮っていません！周りにあるものは？',
    ko: '아직 촬영한 단어가 없어요! 주변에 뭐가 있나요?',
  },
  frameHint: {
    en: 'Please place the object within the frame',
    zh: '請將物體放在取景框內',
    ja: '対象を枠の中に入れてください',
    ko: '사물을 프레임 안에 놓아주세요',
  },
  analyzing: { en: 'AI analyzing…', zh: 'AI 識別中…', ja: 'AI 解析中…', ko: 'AI 분석 중…' },
  removingBg: { en: 'Cutting out subject…', zh: '正在退地…', ja: '背景を除去中…', ko: '배경 제거 중…' },
  bigModelLoading: {
    en: 'Loading large AI model…',
    zh: '正在載入大型 AI 模型…',
    ja: '大型AIモデルを読み込み中…',
    ko: '대형 AI 모델 로딩 중…',
  },
  classifying: {
    en: 'Fine-grained recognition…',
    zh: '精細識別中…',
    ja: '詳細に認識中…',
    ko: '정밀 인식 중…',
  },
  modelLoading: { en: 'AI model loading…', zh: 'AI 模型載入中…', ja: 'AI モデル読み込み中…', ko: 'AI 모델 로딩 중…' },
  modelOffline: {
    en: 'AI model unavailable (offline) — please type the word manually',
    zh: 'AI 模型不可用（離線）— 請手動輸入單詞',
    ja: 'AI モデルを利用できません（オフライン）— 手動で入力してください',
    ko: 'AI 모델을 사용할 수 없어요 (오프라인) — 단어를 직접 입력하세요',
  },
  notSure: {
    en: 'Not sure — which one is it?',
    zh: '不太確定 — 是哪個？',
    ja: 'よくわかりません — どれですか？',
    ko: '확실하지 않아요 — 어떤 건가요?',
  },
  cancel: { en: 'Cancel', zh: '取消', ja: 'キャンセル', ko: '취소' },
  adjustHint: {
    en: 'Not what you expected? Tap to adjust',
    zh: '識別不對？點按修改',
    ja: '違いますか？タップして修正',
    ko: '예상과 다른가요? 탭하여 수정하세요',
  },
  cameraFallback: {
    en: 'Camera unavailable — choose a photo instead',
    zh: '相機不可用 — 改為選擇照片',
    ja: 'カメラを使えません — 写真を選択してください',
    ko: '카메라를 사용할 수 없어요 — 사진을 선택하세요',
  },
  uploadPhoto: { en: 'Upload photo', zh: '上傳照片', ja: '写真をアップロード', ko: '사진 업로드' },
  uploadError: {
    en: 'Couldn’t read that photo — please try another image',
    zh: '無法讀取這張照片 — 請換一張圖片',
    ja: '写真を読み込めませんでした — 別の画像をお試しください',
    ko: '사진을 읽을 수 없어요 — 다른 이미지를 선택해 주세요',
  },
  editWord: { en: 'English word', zh: '英文單詞', ja: '英単語', ko: '영어 단어' },
  editTranslation: { en: 'Translation', zh: '翻译', ja: '翻訳', ko: '번역' },
  save: { en: 'Save', zh: '保存', ja: '保存', ko: '저장' },
  holdToDelete: { en: 'Hold to delete', zh: '長按可刪除', ja: '長押しで削除', ko: '길게 눌러 삭제' },
} as const

export type StringKey = keyof typeof STRINGS

export function t(lang: Lang, key: StringKey): string {
  return STRINGS[key][lang]
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Feb 23" / "5月07" / "5月 07" / "5월 07" */
export function formatDateLabel(lang: Lang, d: Date): string {
  const m = d.getMonth() + 1
  const day = String(d.getDate()).padStart(2, '0')
  switch (lang) {
    case 'en':
      return `${MONTHS_EN[d.getMonth()]} ${d.getDate()}`
    case 'zh':
      return `${m}月${day}`
    case 'ja':
      return `${m}月 ${day}`
    case 'ko':
      return `${m}월 ${day}`
  }
}

/** "Feb 23 / 1 Words" · "5月 07 / 2単語" · "5월 07 / 3개의 단어" · "5月07 / 2 單詞" */
export function formatGroupHeader(lang: Lang, dateISO: string, count: number): string {
  const d = new Date(dateISO + 'T12:00:00')
  const label = formatDateLabel(lang, d)
  const unit = t(lang, 'wordsUnit')
  const sep = lang === 'en' || lang === 'zh' ? ' ' : ''
  return `${label} / ${count}${sep}${unit}`
}
