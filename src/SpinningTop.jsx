// a wobbling spinning top — a small nod to a certain Nolan film
export default function SpinningTop({ className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-x-5 bottom-2 h-2 rounded-[50%] bg-white/10 blur-md" />
      <div className="top-wobble h-full w-full">
        <svg viewBox="0 0 64 64" className="top-spin h-full w-full text-white/70" fill="none" aria-hidden="true">
          <path d="M32 5 V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M32 15 C 42 21, 47 31, 47 39 C 47 48, 40 54, 32 58 C 24 54, 17 48, 17 39 C 17 31, 22 21, 32 15 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M22 33 H42" stroke="currentColor" strokeWidth="0.9" opacity="0.45" />
          <path d="M32 15 V58" stroke="currentColor" strokeWidth="0.7" opacity="0.25" />
        </svg>
      </div>
    </div>
  )
}
