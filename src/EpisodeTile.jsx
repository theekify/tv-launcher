import { useEffect, useRef } from 'react'

const pad = (n) => String(n).padStart(2, '0')

export default function EpisodeTile({ episode, focused, onHover, onSelect }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!focused) return
    const el = ref.current
    const scroller = el?.parentElement
    if (!el || !scroller) return

    const elRect = el.getBoundingClientRect()
    const scrollerRect = scroller.getBoundingClientRect()
    const target =
      scroller.scrollLeft + (elRect.left - scrollerRect.left) - (scroller.clientWidth - elRect.width) / 2
    const max = scroller.scrollWidth - scroller.clientWidth

    scroller.scrollTo({ left: Math.max(0, Math.min(target, max)), behavior: 'smooth' })
  }, [focused])

  const handleMove = (e) => {
    if (e.movementX || e.movementY) onHover()
  }

  return (
    <button
      ref={ref}
      tabIndex={-1}
      onMouseMove={handleMove}
      onClick={onSelect}
      className={`relative z-0 flex h-[72px] w-[264px] shrink-0 items-center gap-3 rounded-xl border px-3.5 text-left outline-none transition-all duration-300 ease-out ${
        focused
          ? 'z-10 -translate-y-0.5 border-white/30 bg-white/[0.12]'
          : 'border-white/[0.06] bg-white/[0.03] opacity-70'
      }`}
      style={{
        boxShadow: focused ? '0 0 0 2px rgba(255,255,255,0.85), 0 20px 40px -28px #000' : 'none',
      }}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-colors duration-300 ${
          focused ? 'bg-white text-black' : 'bg-white/[0.07] text-white/50'
        }`}
      >
        {pad(episode.episode)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-semibold uppercase tracking-[0.28em] text-white/30">
          S{pad(episode.season)}
        </span>
        <span className="mt-0.5 block truncate text-sm font-medium text-white/90">
          {episode.title || `Episode ${episode.episode}`}
        </span>
      </span>
      <svg
        viewBox="0 0 24 24"
        className={`h-3.5 w-3.5 shrink-0 text-white transition-opacity duration-300 ${
          focused ? 'opacity-80' : 'opacity-0'
        }`}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 5.5 L18 12 L8 18.5 Z" />
      </svg>
    </button>
  )
}
