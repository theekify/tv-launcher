import { useEffect, useRef, useState } from 'react'

export default function Tile({ item, focused, index = 0, onHover, onSelect }) {
  const ref = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  // Scroll the shelf only — scrollIntoView also scrolls the page at the row
  // edges, which shifted the whole UI and left black bars behind.
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

  // Only react to real mouse movement, otherwise tiles scrolling
  // under a stationary cursor would steal focus.
  const handleMove = (e) => {
    if (!(e.movementX || e.movementY)) return
    onHover()
    if (!focused) return

    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: -py * 7, y: px * 9 })
  }

  // a small fixed lean, alternating across the row so the shelf feels hand placed
  const lean = (index % 5) - 2
  const activeTilt = focused ? tilt : { x: 0, y: 0 }
  const rotX = activeTilt.x
  const rotY = focused ? lean * 0.8 + activeTilt.y : 0

  return (
    <button
      ref={ref}
      tabIndex={-1}
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      onClick={onSelect}
      className={`relative aspect-[2/3] w-[clamp(7.5rem,16vh,11rem)] shrink-0 rounded-2xl outline-none will-change-transform ${
        focused ? 'z-10' : 'opacity-45'
      }`}
      style={{
        transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${
          focused ? 1.06 : 1
        })`,
        transition: 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1.08), opacity 300ms ease-out',
      }}
    >
      {/* soft colour bloom behind the focused card */}
      <span
        className="pointer-events-none absolute -inset-5 rounded-[1.8rem] blur-2xl transition-opacity duration-500"
        style={{ backgroundColor: item.color, opacity: focused ? 0.22 : 0 }}
      />

      <div
        className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10"
        style={{
          boxShadow: focused
            ? '0 0 0 2px rgba(255,255,255,0.92), 0 34px 70px -30px #000'
            : '0 12px 32px -24px #000',
          transition: 'box-shadow 300ms ease-out',
        }}
      >
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col justify-end p-4"
            style={{ background: `linear-gradient(150deg, ${item.color}, #0a0a0c 85%)` }}
          >
            <span className="text-base font-medium leading-snug line-clamp-3">{item.title}</span>
            {(item.year || item.subtitle) && (
              <span className="mt-1 text-[11px] uppercase tracking-[0.15em] text-white/45">
                {[item.year, item.subtitle].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        )}

        {focused && <span className="sheen pointer-events-none absolute inset-0" />}
      </div>
    </button>
  )
}
