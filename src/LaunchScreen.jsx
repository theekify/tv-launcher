import { Sparkle } from './Doodles'

// quick streaming-service style sting before VLC takes over
export default function LaunchScreen({ title, kicker = 'NOW PLAYING', color = '#ffffff', error }) {
  return (
    <div className="launch-screen fixed inset-0 z-[80] overflow-hidden bg-black">
      <div
        className="absolute inset-0 opacity-80"
        style={{ background: `radial-gradient(circle at 50% 44%, ${color}20, #000 62%)` }}
      />
      <div className="grain absolute inset-0" />

      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-12 text-center">
        <p className="launch-brand flex items-center justify-center gap-2 text-[9px] font-semibold uppercase tracking-[0.5em] text-white/40">
          <Sparkle className="h-2.5 w-2.5" />
          TV Launcher
        </p>

        <h2 className="launch-title mx-auto mt-5 max-w-4xl text-[clamp(1.6rem,4.2vh,2.9rem)] font-semibold leading-tight tracking-[-0.03em] text-white">
          {title}
        </h2>

        <div className="mx-auto mt-7 h-[2px] w-44 overflow-hidden rounded-full bg-white/10">
          <span
            className="launch-bar block h-full w-full origin-left rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>

      <p className="absolute inset-x-0 bottom-[9vh] text-center text-[9px] uppercase tracking-[0.4em] text-white/25">
        {kicker}
      </p>

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-10 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-rose-300/75">
            Playback failed
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-white/55">{error}</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-white/25">
            Backspace to go back
          </p>
        </div>
      )}
    </div>
  )
}
