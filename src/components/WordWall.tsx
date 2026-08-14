import { useMemo, useState } from 'react'
import { Check, Globe, Volume2, X } from 'lucide-react'
import type { WordEntry } from '@/lib/store'
import { LANGS, formatDateLabel, formatGroupHeader, t } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import { speak } from '@/lib/media'
import { usePinyin } from '@/lib/pinyin'

interface Props {
  entries: WordEntry[]
  lang: Lang
  onLangChange: (l: Lang) => void
  onDelete: (id: string) => void
}

function WordCard({
  entry,
  lang,
  onDelete,
}: {
  entry: WordEntry
  lang: Lang
  onDelete: () => void
}) {
  const zhText = lang === 'zh' ? entry.translations.zh : ''
  const py = usePinyin(zhText)

  const handleTap = () => {
    // tap: pronounce the English word (en-GB) — no popup
    speak(entry.word)
  }

  // transparent stickers (svg seeds, alpha-masked png cutouts) get the white
  // outline treatment; rectangular photo crops keep the plain soft shadow
  const transparent =
    entry.imageDataUrl.startsWith('data:image/png') ||
    entry.imageDataUrl.startsWith('data:image/svg')

  return (
    <div className="relative mb-7 break-inside-avoid">
      <button
        className="block w-full select-none"
        style={{ WebkitTouchCallout: 'none' }}
        onClick={handleTap}
        onContextMenu={(e) => e.preventDefault()}
      >
        <img
          src={entry.imageDataUrl}
          alt={entry.word}
          draggable={false}
          className={`${transparent ? 'sw-sticker-white' : 'sw-sticker'} mx-auto w-full pointer-events-none`}
        />
        <span className="relative z-10 mx-auto -mt-5 flex w-fit max-w-full items-center rounded-full bg-neutral-900 px-4 py-1.5 text-[15px] font-bold text-white shadow-lg">
          <span className="truncate">{entry.word}</span>
        </span>
      </button>

      {/* inline translation under the English pill (+ pinyin when zh) */}
      <div className="mt-1.5 flex items-center justify-center gap-1">
        <div className="text-center">
          <p className="text-[13px] font-semibold leading-tight text-neutral-500">
            {entry.translations[lang]}
          </p>
          {lang === 'zh' && py && (
            <p className="text-[10px] font-medium leading-tight text-neutral-400">{py}</p>
          )}
        </div>
        {lang === 'zh' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              speak(entry.translations.zh, 'zh-CN')
            }}
            aria-label="speak translation"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 active:scale-90"
          >
            <Volume2 size={12} />
          </button>
        )}
      </div>

      {/* always-visible delete button at the image's top-right corner */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        aria-label="delete word"
        className="absolute right-1 top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900/55 text-white shadow-md backdrop-blur-sm transition hover:bg-red-500/90 active:scale-90"
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </div>
  )
}

export default function WordWall({ entries, lang, onLangChange, onDelete }: Props) {
  const [langOpen, setLangOpen] = useState(false)

  const groups = useMemo(() => {
    const map = new Map<string, WordEntry[]>()
    for (const e of entries) {
      const arr = map.get(e.dateISO) ?? []
      arr.push(e)
      map.set(e.dateISO, arr)
    }
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, list]) => ({
        date,
        list: [...list].sort((a, b) => b.createdAt - a.createdAt),
      }))
  }, [entries])

  const today = formatDateLabel(lang, new Date())
  const total = entries.length

  return (
    <div className="sw-no-scrollbar h-full overflow-y-auto bg-white px-5 pb-40">
      {/* header */}
      <header
        className="sticky top-0 z-30 -mx-5 flex items-center justify-between bg-white/90 px-5 pb-3 backdrop-blur"
        style={{ paddingTop: 'calc(14px + env(safe-area-inset-top))' }}
      >
        <button
          aria-label="close"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 active:scale-90"
        >
          <X size={20} />
        </button>
        <div className="text-center">
          <p className="text-[17px] font-extrabold tracking-tight text-neutral-900">{today}</p>
          <p className="text-xs font-medium text-neutral-400">
            {total} {t(lang, 'wordsUnit')}
          </p>
        </div>
        <div className="relative">
          <button
            aria-label="language"
            onClick={() => setLangOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 active:scale-90"
          >
            <Globe size={19} />
          </button>
          {langOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setLangOpen(false)} />
              <div className="sw-pop absolute right-0 top-11 z-40 w-36 overflow-hidden rounded-2xl bg-white py-1 shadow-xl ring-1 ring-black/5">
                {LANGS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      onLangChange(l.id)
                      setLangOpen(false)
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    {l.label}
                    {l.id === lang && <Check size={15} className="text-violet-500" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      {/* empty state */}
      {total === 0 && (
        <div className="flex flex-col items-center pt-36 text-center">
          <div className="mb-6 flex gap-3">
            <span className="sw-pulse-dot h-3 w-3 rounded-full bg-neutral-300" />
            <span
              className="sw-pulse-dot h-3 w-3 rounded-full bg-neutral-300"
              style={{ animationDelay: '0.35s' }}
            />
          </div>
          <p className="max-w-[240px] text-[15px] font-medium leading-relaxed text-neutral-400">
            {t(lang, 'empty')}
          </p>
        </div>
      )}

      {/* word groups */}
      {groups.map((g) => (
        <section key={g.date} className="mt-6">
          <h2 className="mb-4 text-[13px] font-semibold tracking-wide text-neutral-400">
            {formatGroupHeader(lang, g.date, g.list.length)}
          </h2>
          <div className="columns-2 gap-6">
            {g.list.map((e) => (
              <WordCard key={e.id} entry={e} lang={lang} onDelete={() => onDelete(e.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
