import { Camera } from 'lucide-react'

/** Bottom-center circular capture button with a slowly rotating rainbow ring. */
export default function RainbowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Snap a word"
      className="absolute left-1/2 z-40 -translate-x-1/2 active:scale-95 transition-transform"
      style={{ bottom: 'calc(20px + env(safe-area-inset-bottom))' }}
    >
      <span className="sw-rainbow-ring block h-[76px] w-[76px] rounded-full p-[5px] shadow-xl shadow-black/20">
        <span className="flex h-full w-full items-center justify-center rounded-full bg-white">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-neutral-900 text-white">
            <Camera size={26} strokeWidth={2.2} />
          </span>
        </span>
      </span>
    </button>
  )
}
