import { useCallback, useEffect, useRef, useState } from 'react'

const COLS = 6
const MIN_QUERY = 2

const norm = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

function HintKey({ children }) {
  return (
    <kbd className="rounded-[5px] border border-white/15 bg-white/[0.06] px-1.5 py-[3px] text-[9px] font-medium leading-none text-white/45">
      {children}
    </kbd>
  )
}

function Card({ item, index, selected, local, onHover, onPick }) {
  return (
    <button
      type="button"
      data-index={index}
      onClick={onPick}
      onMouseEnter={onHover}
      className={`similar-card group relative block w-full cursor-pointer text-left outline-none transition-transform duration-200 ${
        selected ? 'z-10 scale-[1.02]' : ''
      }`}
    >
      <div
        className={`relative aspect-[2/3] overflow-hidden rounded-xl border transition-all duration-200 ${
          selected
            ? 'border-white/80 shadow-[0_0_0_2px_rgba(255,255,255,0.9),0_24px_60px_-24px_rgba(255,255,255,0.28)]'
            : 'border-white/10'
        }`}
      >
        {item.poster ? (
          <img
            src={item.poster}
            alt=""
            draggable={false}
            className={`h-full w-full object-cover transition-opacity duration-200 ${
              selected ? 'opacity-100' : 'opacity-55'
            }`}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/[0.02] transition-opacity duration-200 ${
              selected ? 'opacity-100' : 'opacity-55'
            }`}
          >
            <span className="px-2 text-center text-[10px] uppercase tracking-[0.15em] text-white/30">
              {item.title}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        {local && (
          <span className="absolute left-2 top-2 rounded-full border border-white/25 bg-black/65 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm">
            In library
          </span>
        )}

        {item.rating && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-white/75 backdrop-blur-sm">
            ★ {item.rating}
          </span>
        )}
      </div>

      <p
        className={`mt-2 truncate text-[11px] font-medium transition-colors ${
          selected ? 'text-white' : 'text-white/55'
        }`}
      >
        {item.title}
      </p>
      <p className="mt-0.5 truncate text-[9px] uppercase tracking-[0.12em] text-white/25">
        {[item.year, item.kind === 'tv' ? 'Series' : 'Film'].filter(Boolean).join(' · ')}
      </p>
    </button>
  )
}

const isLocalShow = (entry) => entry?.kind === 'show' || Array.isArray(entry?.episodes)

const formatRuntime = (minutes) => {
  const value = Number(minutes)
  if (!value || value < 1) return null
  const hours = Math.floor(value / 60)
  const rest = value % 60
  if (!hours) return `${rest}m`
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

const formatDate = (value) => {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const countryLabel = (name) => {
  if (name === 'United States of America') return 'USA'
  if (name === 'United Kingdom') return 'UK'
  return name
}

function DetailsPanel({
  item,
  local,
  actions,
  actionIndex,
  onHoverAction,
  onAction,
  onClose,
  extra,
  loading,
}) {
  const genres = (extra?.genres?.length ? extra.genres : item.genres || []).slice(0, 3)
  const meta = [item.year, item.rating && `★ ${item.rating}`, ...genres].filter(Boolean)
  const overview = extra?.overview || item.overview
  const cast = extra?.cast || []
  const info = []

  if (extra) {
    const people =
      item.kind === 'tv'
        ? extra.creators?.length
          ? extra.creators
          : extra.directors
        : extra.directors
    if (people?.length) {
      info.push({
        label: item.kind === 'tv' ? 'Created by' : 'Directed by',
        value: people.join(', '),
      })
    }

    const runtime = formatRuntime(extra.runtime)
    if (runtime) {
      info.push({ label: item.kind === 'tv' ? 'Episode length' : 'Runtime', value: runtime })
    }

    if (item.kind === 'tv' && extra.seasons) {
      info.push({
        label: 'Episodes',
        value: `${extra.seasons} season${extra.seasons > 1 ? 's' : ''}${
          extra.episodes ? ` · ${extra.episodes} episodes` : ''
        }`,
      })
    }

    const released = formatDate(extra.releaseDate)
    if (released) {
      info.push({ label: item.kind === 'tv' ? 'First aired' : 'Released', value: released })
    }

    if (item.kind === 'tv' && extra.status) {
      info.push({ label: 'Status', value: extra.status })
    }

    if (extra.countries?.length) {
      info.push({ label: 'Country', value: extra.countries.map(countryLabel).join(', ') })
    }
  }

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-6 backdrop-blur-lg"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="detail-panel hero-in relative w-[min(900px,88vw)] overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0d]/95 shadow-[0_60px_160px_-50px_#000]">
        {(item.backdrop || item.poster) && (
          <div className="pointer-events-none absolute inset-0">
            <img
              src={item.backdrop || item.poster}
              alt=""
              draggable={false}
              className="h-full w-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-[#0b0b0d]/85 to-[#0b0b0d]/35" />
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/50 transition-colors hover:border-white/30 hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="relative flex gap-7 p-8">
          <div className="w-40 shrink-0">
            <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_30px_60px_-30px_#000]">
              {item.poster ? (
                <img
                  src={item.poster}
                  alt=""
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-end bg-gradient-to-br from-white/10 to-transparent p-3">
                  <span className="text-sm text-white/45">{item.title}</span>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-white/35">
                {item.kind === 'tv' ? 'Series' : 'Film'}
              </p>
              {local && (
                <span className="rounded-full border border-white/25 bg-white/[0.06] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/75">
                  In library
                </span>
              )}
            </div>

            <h2 className="mt-2 pr-8 text-3xl font-semibold leading-tight tracking-[-0.03em] text-white">
              {item.title}
            </h2>

            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/35">
              {meta.join(' · ')}
            </p>

            {extra?.tagline && (
              <p className="mt-2 text-[12px] italic leading-relaxed text-white/40">
                “{extra.tagline}”
              </p>
            )}

            <p className="mt-4 max-h-36 overflow-y-auto pr-3 text-sm leading-relaxed text-white/55">
              {overview || 'No overview available for this title yet.'}
            </p>

            {info.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/[0.07] pt-4">
                {info.map((row) => (
                  <div key={row.label} className="min-w-[86px] max-w-[190px]">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-white/25">
                      {row.label}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-white/65">{row.value}</p>
                  </div>
                ))}
              </div>
            )}

            {(loading || cast.length > 0) && (
              <div className="mt-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/30">
                  Cast
                </p>
                <div className="mt-2 flex flex-wrap gap-3.5">
                  {loading
                    ? Array.from({ length: 6 }, (_, index) => (
                        <div key={index} className="w-[76px] shrink-0 animate-pulse text-center">
                          <div className="mx-auto h-12 w-12 rounded-full bg-white/[0.06]" />
                          <div className="mx-auto mt-2 h-2 w-14 rounded bg-white/[0.05]" />
                          <div className="mx-auto mt-1 h-1.5 w-10 rounded bg-white/[0.04]" />
                        </div>
                      ))
                    : cast.slice(0, 6).map((person, index) => (
                        <div key={`${person.name}-${index}`} className="w-[76px] shrink-0 text-center">
                          <div className="mx-auto h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-white/[0.05]">
                            {person.profile ? (
                              <img
                                src={person.profile}
                                alt=""
                                draggable={false}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[12px] font-medium text-white/35">
                                {person.name.slice(0, 1)}
                              </div>
                            )}
                          </div>
                          <p className="mt-1.5 line-clamp-2 min-h-[2.4em] text-[10px] leading-[1.2] text-white/70">
                            {person.name}
                          </p>
                          <p className="truncate text-[8px] uppercase tracking-[0.08em] text-white/25">
                            {person.character}
                          </p>
                        </div>
                      ))}
                </div>
              </div>
            )}

            <p className="mt-5 text-[9px] uppercase tracking-[0.2em] text-white/25">
              {local
                ? `Ready to ${isLocalShow(local) ? 'open' : 'play'} from C:\\Mvs`
                : 'Not in your library — add it to C:\\Mvs to play it here'}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {actions.map((action, index) => (
                <button
                  key={action.id}
                  type="button"
                  onMouseEnter={() => onHoverAction(index)}
                  onClick={() => onAction(action)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    action.primary
                      ? 'bg-white text-black'
                      : 'border border-white/15 bg-white/[0.04] text-white/70 hover:border-white/35 hover:text-white'
                  } ${
                    actionIndex === index
                      ? 'ring-2 ring-white/90 ring-offset-2 ring-offset-[#0b0b0d]'
                      : action.primary
                        ? 'opacity-80'
                        : 'opacity-60'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center gap-2.5 border-t border-white/10 bg-black/20 px-8 py-3 text-[9px] uppercase tracking-[0.22em] text-white/30">
          <HintKey>←</HintKey>
          <HintKey>→</HintKey>
          <span>Choose</span>
          <HintKey>Enter</HintKey>
          <span>{actions[actionIndex]?.label ?? 'Select'}</span>
          <HintKey>⌫</HintKey>
          <span>Back</span>
          <HintKey>Esc</HintKey>
          <span>Close</span>
        </div>
      </div>
    </div>
  )
}

export default function SimilarFinder({ onClose, library, hasToken, onNeedToken, onOpenItem }) {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('search')
  const [results, setResults] = useState([])
  const [similar, setSimilar] = useState([])
  const [subject, setSubject] = useState(null)
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailAction, setDetailAction] = useState(0)
  const [detailExtra, setDetailExtra] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const inputRef = useRef(null)
  const scrollRef = useRef(null)
  const requestRef = useRef(0)

  const localFor = useCallback(
    (item) => {
      const name = norm(item?.title)
      if (!name) return null
      return library.find((entry) => norm(entry.title) === name) ?? null
    },
    [library]
  )

  // take keyboard focus as soon as the overlay mounts
  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30)
    return () => window.clearTimeout(timer)
  }, [])

  const openDetail = useCallback(
    (item) => {
      if (!item) return
      setDetail({ item, local: localFor(item) })
      setDetailAction(0)
      setDetailExtra(null)
      setDetailLoading(typeof window.tv?.getDetails === 'function')
    },
    [localFor]
  )

  const closeDetail = useCallback(() => setDetail(null), [])

  const runSearch = useCallback(async (value) => {
    const id = ++requestRef.current
    setLoading(true)
    setError(null)

    try {
      const res = await window.tv?.searchTitles?.(value)
      if (id !== requestRef.current) return null
      if (!res?.ok) {
        setError(res?.error || 'TMDB search failed')
        setResults([])
        return null
      }
      setResults(res.results || [])
      setSelected(0)
      return res.results || []
    } catch (err) {
      if (id !== requestRef.current) return null
      setError(err?.message || 'TMDB search failed')
      setResults([])
      return null
    } finally {
      if (id === requestRef.current) setLoading(false)
    }
  }, [])

  // live search, a beat behind the keyboard
  useEffect(() => {
    if (mode !== 'search' || !hasToken) return
    const value = query.trim()
    if (value.length < MIN_QUERY) return

    const timer = window.setTimeout(() => runSearch(value), 320)
    return () => window.clearTimeout(timer)
  }, [query, mode, hasToken, runSearch])

  const openSimilar = useCallback(async (item) => {
    if (!item) return

    const id = ++requestRef.current
    setSubject(item)
    setMode('similar')
    setSimilar([])
    setSelected(0)
    setLoading(true)
    setError(null)

    try {
      const res = await window.tv?.getSimilar?.(item.id, item.kind)
      if (id !== requestRef.current) return
      if (!res?.ok) {
        setError(res?.error || 'Could not load similar titles')
        return
      }
      setSimilar(res.results || [])
    } catch (err) {
      if (id !== requestRef.current) return
      setError(err?.message || 'Could not load similar titles')
    } finally {
      if (id === requestRef.current) setLoading(false)
    }
  }, [])

  const detailId = detail?.item.id
  const detailKind = detail?.item.kind

  useEffect(() => {
    if (!detailId) return

    let cancelled = false
    const request = window.tv?.getDetails?.(detailId, detailKind)
    if (!request) return

    request
      .then((res) => {
        if (!cancelled) setDetailExtra(res?.ok ? res.details : null)
      })
      .catch(() => {
        if (!cancelled) setDetailExtra(null)
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [detailId, detailKind])

  const detailActions = detail
    ? detail.local
      ? [
          {
            id: 'play',
            label: isLocalShow(detail.local) ? 'Open series' : 'Play now',
            primary: true,
            run: () => onOpenItem(detail.local),
          },
          {
            id: 'similar',
            label: 'More like this',
            run: () => {
              setDetail(null)
              openSimilar(detail.item)
            },
          },
        ]
      : [
          {
            id: 'similar',
            label: 'More like this',
            primary: true,
            run: () => {
              setDetail(null)
              openSimilar(detail.item)
            },
          },
          {
            id: 'tmdb',
            label: 'View on TMDB',
            run: () =>
              window.tv?.openExternal?.(
                `https://www.themoviedb.org/${
                  detail.item.kind === 'tv' ? 'tv' : 'movie'
                }/${detail.item.id}`
              ),
          },
        ]
    : []

  // keep the focused poster inside the overlay's own scroll area
  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    const card = scroller.querySelector(`[data-index="${selected}"]`)
    if (!card) return

    const view = scroller.getBoundingClientRect()
    const box = card.getBoundingClientRect()
    if (box.top < view.top) scroller.scrollTop -= view.top - box.top + 10
    else if (box.bottom > view.bottom) scroller.scrollTop += box.bottom - view.bottom + 10
  }, [selected, mode, results, similar])

  const changeQuery = useCallback((value) => {
    setQuery(value)
    setDetail(null)
    setMode('search')
    setSubject(null)
    setSimilar([])
    setResults([])
    setSelected(0)
    setError(null)
    setLoading(hasToken && value.trim().length >= MIN_QUERY)
  }, [hasToken])

  const list = mode === 'similar' ? similar : results

  const clamp = (value, length) => Math.max(0, Math.min(value, Math.max(0, length - 1)))

  const submit = async () => {
    if (mode === 'similar') {
      const item = similar[selected]
      if (item) openDetail(item)
      return
    }

    const value = query.trim()
    if (!value) return

    // typing, then Enter straight away: wait for the up-to-date match
    let item = results[selected]
    if (!item) {
      const fresh = await runSearch(value)
      item = fresh?.[0]
    }
    if (item) openDetail(item)
  }

  const handleKeyDown = (event) => {
    if (detail) {
      if (event.key === 'Escape' || event.key === 'Backspace') {
        event.preventDefault()
        event.stopPropagation()
        closeDetail()
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        detailActions[detailAction]?.run()
        return
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        event.stopPropagation()
        setDetailAction((value) => (value === 0 ? 1 : 0))
        return
      }

      // the query field is read-only behind the panel; swallow other keys
      event.preventDefault()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      submit()
      return
    }

    if (event.key === 'Backspace' && mode === 'similar') {
      event.preventDefault()
      event.stopPropagation()
      setMode('search')
      setSelected(0)
      setError(null)
      return
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      event.stopPropagation()
      const step = event.key === 'ArrowRight' ? 1 : -1
      setSelected((value) => clamp(value + step, list.length))
      return
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      // up/down edit the query in search mode, so only capture them in the grid
      if (mode !== 'similar') return
      event.preventDefault()
      event.stopPropagation()
      const step = event.key === 'ArrowDown' ? COLS : -COLS
      setSelected((value) => clamp(value + step, list.length))
    }
  }

  const hintChips = (
    <>
      <HintKey>←</HintKey>
      <HintKey>→</HintKey>
      <HintKey>↑</HintKey>
      <HintKey>↓</HintKey>
      <span>Choose</span>
      <HintKey>Enter</HintKey>
      <span>Details</span>
      {mode === 'similar' && (
        <>
          <HintKey>⌫</HintKey>
          <span>Back</span>
        </>
      )}
      <HintKey>Esc</HintKey>
      <span>Close</span>
    </>
  )

  const searching = loading && list.length === 0

  return (
    <div
      className="similar-finder fixed inset-0 z-[70] overflow-hidden bg-[#060608]/95 backdrop-blur-2xl"
      onMouseDown={(event) => {
        if (event.target !== inputRef.current) {
          event.preventDefault()
          inputRef.current?.focus()
        }
      }}
    >
      <div className="pointer-events-none absolute -left-40 -top-60 h-[700px] w-[700px] rounded-full bg-white/[0.035] blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-72 right-0 h-[600px] w-[600px] rounded-full bg-white/[0.02] blur-[140px]" />

      <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col px-14 pt-14">
        <div className="flex shrink-0 items-center gap-4">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0 text-white/30"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            ref={inputRef}
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            readOnly={Boolean(detail)}
            placeholder="Type a movie or show…"
            spellCheck={false}
            autoComplete="off"
            aria-label="Search for a title"
            className="min-w-0 flex-1 border-0 bg-transparent text-3xl font-medium tracking-[-0.025em] text-white outline-none placeholder:text-white/20"
          />

          <span className="shrink-0 text-[9px] uppercase tracking-[0.3em] text-white/20">TMDB</span>
        </div>

        <div className="mt-5 h-px w-full bg-gradient-to-r from-white/15 via-white/5 to-transparent" />

        <div className="mt-7 flex min-h-0 flex-1 flex-col">
          {!hasToken ? (
            <div className="mt-20 flex flex-col items-center text-center">
              <p className="text-sm text-white/45">Add a TMDB token to find similar titles.</p>
              <button
                type="button"
                onClick={onNeedToken}
                className="mt-5 rounded-full bg-white px-5 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90"
              >
                Add a token
              </button>
            </div>
          ) : error ? (
            <div className="mt-20 text-center">
              <p className="text-sm text-rose-200/80">{error}</p>
              <p className="mt-2 text-[9px] uppercase tracking-[0.25em] text-white/25">
                Keep typing to try again
              </p>
            </div>
          ) : mode === 'similar' ? (
            <>
              <div className="flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">More like</p>
                <h2 className="text-xl font-semibold tracking-tight text-white/85">{subject?.title}</h2>
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                  {[subject?.year, subject?.kind === 'tv' ? 'Series' : 'Film'].filter(Boolean).join(' · ')}
                </span>
              </div>

              {searching ? (
                <p className="mt-16 text-center text-[10px] uppercase tracking-[0.28em] text-white/30">
                  <span className="animate-pulse">Finding titles…</span>
                </p>
              ) : similar.length === 0 ? (
                <p className="mt-16 text-center text-sm text-white/35">
                  No similar titles found.
                  <span className="mt-3 block text-[9px] uppercase tracking-[0.25em] text-white/20">
                    Backspace goes back
                  </span>
                </p>
              ) : (
                <div ref={scrollRef} className="mt-5 min-h-0 flex-1 overflow-y-auto pb-24">
                  <div className="grid grid-cols-6 gap-x-4 gap-y-6">
                    {similar.map((item, index) => {
                      const local = localFor(item)
                      return (
                        <Card
                          key={`${item.kind}-${item.id}`}
                          item={item}
                          index={index}
                          selected={selected === index}
                          local={local}
                          onHover={() => setSelected(index)}
                          onPick={() => openDetail(item)}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {query.trim().length < MIN_QUERY ? (
                <div className="mt-16 text-center">
                  <p className="text-sm text-white/35">
                    Type a title — we’ll find films and shows like it.
                  </p>
                  <p className="mt-3 text-[9px] uppercase tracking-[0.25em] text-white/20">
                    Enter opens the closest match
                  </p>
                </div>
              ) : searching ? (
                <p className="mt-16 text-center text-[10px] uppercase tracking-[0.28em] text-white/30">
                  <span className="animate-pulse">Searching TMDB…</span>
                </p>
              ) : results.length === 0 ? (
                <p className="mt-16 text-center text-sm text-white/35">
                  No matches for “{query.trim()}”.
                </p>
              ) : (
                <>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">Matches</p>
                    <span className="text-[10px] tabular-nums text-white/20">{results.length}</span>
                  </div>

                  <div ref={scrollRef} className="mt-5 min-h-0 flex-1 overflow-y-auto pb-24">
                    <div className="grid grid-cols-6 gap-x-4 gap-y-6">
                      {results.map((item, index) => {
                        const local = localFor(item)
                        return (
                          <Card
                            key={`${item.kind}-${item.id}`}
                            item={item}
                            index={index}
                            selected={selected === index}
                            local={local}
                            onHover={() => setSelected(index)}
                            onPick={() => openDetail(item)}
                          />
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-16 items-center justify-center gap-2.5 bg-gradient-to-t from-[#060608] via-[#060608]/90 to-transparent text-[9px] uppercase tracking-[0.22em] text-white/30">
        {hintChips}
      </div>

      {detail && (
        <DetailsPanel
          item={detail.item}
          local={detail.local}
          actions={detailActions}
          actionIndex={detailAction}
          onHoverAction={setDetailAction}
          onAction={(action) => action.run()}
          onClose={closeDetail}
          extra={detailExtra}
          loading={detailLoading}
        />
      )}
    </div>
  )
}
