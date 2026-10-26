export default function DvdScreensaver({ visible }) {
  return (
    <div
      aria-hidden="true"
      className={`dvd-screensaver pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="dvd-x absolute left-0 top-0">
        <div className="dvd-y">
          <div className="flex h-10 w-24 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] text-[13px] font-semibold tracking-[0.3em] text-white/40 shadow-[0_0_40px_rgba(255,255,255,0.06)]">
            DVD
          </div>
        </div>
      </div>
    </div>
  )
}
