import { useEffect, useRef } from 'react'

// slow drifting stars + the odd shooting star (space-movie flavour, kept faint)
export default function Starfield({ className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let stars = []
    let w = 0
    let h = 0
    let raf = 0
    let last = 0
    let nextShoot = 0
    let shoot = null

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.min(150, Math.round((w * h) / 16000))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random(),
        r: 0.35 + Math.random() * 1.05,
        tw: Math.random() * Math.PI * 2,
      }))

      if (reduce) paintStatic(performance.now())
    }

    const paintStars = (now, dt) => {
      ctx.clearRect(0, 0, w, h)
      for (const s of stars) {
        if (dt) {
          s.x -= (0.002 + s.z * 0.009) * dt
          if (s.x < -2) {
            s.x = w + 2
            s.y = Math.random() * h
          }
        }
        const twinkle = 0.5 + 0.5 * Math.sin(now * 0.0012 + s.tw)
        ctx.beginPath()
        ctx.fillStyle = `rgba(226,232,255,${(0.12 + twinkle * 0.4) * (0.35 + s.z * 0.65)})`
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const paintStatic = (now) => paintStars(now, 0)

    const frame = (now) => {
      const dt = Math.min(64, now - last)
      last = now
      paintStars(now, dt)

      if (!reduce) {
        if (!shoot && now > nextShoot) {
          shoot = {
            x: w * (0.5 + Math.random() * 0.45),
            y: h * (0.05 + Math.random() * 0.35),
            life: 0,
            dur: 900,
          }
          nextShoot = now + 7000 + Math.random() * 9000
        }

        if (shoot) {
          shoot.life += dt
          const t = shoot.life / shoot.dur
          if (t >= 1) {
            shoot = null
          } else {
            const x = shoot.x - t * 280
            const y = shoot.y + t * 140
            const trail = ctx.createLinearGradient(x, y, x + 110, y - 55)
            trail.addColorStop(0, `rgba(255,255,255,${0.75 * (1 - t)})`)
            trail.addColorStop(1, 'rgba(255,255,255,0)')
            ctx.strokeStyle = trail
            ctx.lineWidth = 1.3
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x + 110, y - 55)
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)

    if (!reduce) {
      last = performance.now()
      nextShoot = last + 3500
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  )
}
