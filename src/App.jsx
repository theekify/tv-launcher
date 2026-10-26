import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { colorFor } from './data'
import { useInput } from './useInput'
import Tile from './Tile'
import EpisodeTile from './EpisodeTile'
import Starfield from './Starfield'
import SpinningTop from './SpinningTop'
import DvdScreensaver from './DvdScreensaver'
import LaunchScreen from './LaunchScreen'
import SimilarFinder from './SimilarFinder'
import { Sparkle } from './Doodles'

const clampCol = (rows, r, c) => Math.min(c, rows[r].items.length - 1)
const pad = (n) => String(n).padStart(2, '0')

// shows are grouped by the scanner; the episodes check keeps older data working
const isShow = (item) => item?.kind === 'show' || Array.isArray(item?.episodes)

function groupSeasons(show) {
  const seasons = new Map()
  for (const ep of show.episodes) {
    if (!seasons.has(ep.season)) seasons.set(ep.season, [])
    seasons.get(ep.season).push(ep)
  }
  return [...seasons.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([season, items]) => ({ id: `s${season}`, season, items }))
}

function Meta({ item, extra = [] }) {
  const bits = [item.year, item.rating && `★ ${item.rating}`, ...extra].filter(Boolean)
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/45">
      {bits.map((bit, i) => (
        <span key={i} className="flex items-center gap-3">
          {i > 0 && <span className="h-[3px] w-[3px] rounded-full bg-white/25" />}
          {bit}
        </span>
      ))}
    </div>
  )
}

function Kicker({ children }) {
  return (
    <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/40">
      <Sparkle className="h-2.5 w-2.5 text-white/50" />
      {children}
    </p>
  )
}

function Brand({ hasToken, onAddToken }) {
  return (
    <header className="absolute left-14 top-10 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-white/30">
      <Sparkle className="h-3 w-3 text-white/40" />
      TV Launcher
      {!hasToken && (
        <button
          type="button"
          onClick={onAddToken}
          className="ml-2 flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/[0.06] px-2.5 py-1 text-[9px] tracking-[0.18em] text-amber-100/60 transition-colors hover:border-amber-200/50 hover:text-amber-100"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" />
          Add TMDB token
        </button>
      )}
    </header>
  )
}

function ExitButton() {
  return (
    <button
      type="button"
      onClick={() => window.tv?.quit?.()}
      className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-white/55 transition-colors hover:border-white/45 hover:bg-white/10 hover:text-white"
      title="Quit to Windows (Esc / Ctrl+Q)"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-2.5 w-2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M12 3v8" />
        <path d="M6.6 6.6a8 8 0 1 0 10.8 0" />
      </svg>
      Exit
    </button>
  )
}

function SearchBar({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group absolute left-1/2 top-5 z-20 flex h-12 w-[clamp(340px,34vw,560px)] -translate-x-1/2 items-center gap-3 rounded-full border border-white/15 bg-white/[0.055] px-5 text-left shadow-[0_20px_60px_-30px_#000] backdrop-blur-md transition-all duration-300 hover:border-white/35 hover:bg-white/[0.09]"
      title="Search movies and shows ( / )"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px] shrink-0 text-white/40 transition-colors group-hover:text-white/70"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/40 transition-colors group-hover:text-white/75">
        Search movies &amp; shows…
      </span>
      <span className="flex h-6 min-w-6 items-center justify-center rounded-[7px] border border-white/15 bg-white/[0.05] px-1.5 text-[10px] font-medium text-white/35 transition-colors group-hover:border-white/25 group-hover:text-white/65">
        /
      </span>
    </button>
  )
}

function TokenModal({ value, onChange, onSubmit, onClose, error, saving }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="hero-in w-[min(620px,86vw)] rounded-3xl border border-white/10 bg-[#0b0b0d]/95 p-8 shadow-[0_40px_120px_-40px_#000]">
        <Kicker>Posters</Kicker>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Add a TMDB token</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          Paste your API Read Access Token (starts with <span className="text-white/75">eyJ</span>) or a v3
          API key. It stays on this PC.
        </p>

        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'Enter') onSubmit()
          }}
          placeholder="eyJhbGciOiJIUzI1NiJ9..."
          spellCheck={false}
          className="mt-5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-sm text-white/90 outline-none transition-colors placeholder:text-white/20 focus:border-white/40"
        />

        {error && <p className="mt-3 text-sm text-rose-300/80">{error}</p>}

        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => window.tv?.openExternal?.('https://www.themoviedb.org/settings/api')}
            className="text-[10px] uppercase tracking-[0.22em] text-white/35 underline decoration-white/20 decoration-dotted underline-offset-4 transition-colors hover:text-white/70"
          >
            Where do I get one?
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!value.trim() || saving}
              onClick={onSubmit}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity disabled:opacity-30"
            >
              {saving ? 'Checking…' : 'Save'}
            </button>
          </div>
        </div>
        <p className="mt-4 text-[9px] uppercase tracking-[0.25em] text-white/20">Esc cancels · Enter saves</p>
      </div>
    </div>
  )
}

export default function App() {
  const [movies, setMovies] = useState([])
  const [shows, setShows] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [problem, setProblem] = useState(null)
  const [focus, setFocus] = useState({ row: 0, col: 0 })
  const [openShowId, setOpenShowId] = useState(null)
  const [episodeFocus, setEpisodeFocus] = useState({ row: 0, col: 0 })
  const [hasToken, setHasToken] = useState(true)
  const [tokenOpen, setTokenOpen] = useState(false)
  const [tokenDraft, setTokenDraft] = useState('')
  const [tokenError, setTokenError] = useState(null)
  const [savingToken, setSavingToken] = useState(false)
  const [finderOpen, setFinderOpen] = useState(false)
  const [playing, setPlaying] = useState(null)
  const [playError, setPlayError] = useState(null)
  const [idle, setIdle] = useState(false)

  const rootRef = useRef(null)
  const launchingRef = useRef(false)

  // after a minute of no input the shelves get a bouncing DVD logo
  useEffect(() => {
    let timer
    const wake = () => {
      setIdle(false)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setIdle(true), 60000)
    }
    wake()
    window.addEventListener('keydown', wake)
    window.addEventListener('mousemove', wake)
    window.addEventListener('mousedown', wake)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', wake)
      window.removeEventListener('mousemove', wake)
      window.removeEventListener('mousedown', wake)
    }
  }, [])

  useEffect(() => {
    if (!window.tv) {
      setProblem('Electron bridge unavailable — fully quit and restart the launcher')
      setLoaded(true)
      return
    }
    let cancelled = false

    window.tv
      .getInfo?.()
      .then((info) => {
        if (!cancelled) setHasToken(Boolean(info?.hasToken))
      })
      .catch(() => {})

    async function fillMeta(items, tmdbKind, setter) {
      for (const item of items) {
        let meta = null
        try {
          meta = await window.tv.getMeta(item.title, item.year, tmdbKind)
        } catch {
          // network/TMDB hiccup: keep the gradient tile and carry on
        }
        if (cancelled) return
        if (meta) {
          // never let the TMDB type ("tv") overwrite the scanner kind ("show")
          setter((prev) => prev.map((p) => (p.id === item.id ? { ...p, ...meta } : p)))
        }
      }
    }

    async function load() {
      let result
      try {
        result = await window.tv.scanLibrary()
      } catch (err) {
        if (cancelled) return
        setProblem(`Scan failed: ${err?.message || err}`)
        setLoaded(true)
        return
      }
      if (cancelled) return

      const movieItems = result.movies.map((m) => ({
        ...m,
        kind: 'movie',
        id: m.path,
        color: colorFor(m.title),
      }))
      const showItems = result.shows.map((s) => ({
        ...s,
        kind: 'show',
        color: colorFor(s.title),
        subtitle: `${s.episodes.length} episode${s.episodes.length === 1 ? '' : 's'}`,
      }))

      setMovies(movieItems)
      setShows(showItems)
      setLoaded(true)

      // fill in posters/backdrops one by one, tiles update as they arrive
      await fillMeta(movieItems, 'movie', setMovies)
      if (cancelled) return
      await fillMeta(showItems, 'tv', setShows)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const rows = useMemo(
    () =>
      [
        { id: 'movies', title: 'Movies', items: movies },
        { id: 'shows', title: 'Series', items: shows },
      ].filter((r) => r.items.length > 0),
    [movies, shows]
  )

  const libraryItems = useMemo(() => [...movies, ...shows], [movies, shows])

  const openShow = useMemo(
    () => (openShowId ? shows.find((s) => s.id === openShowId) ?? null : null),
    [openShowId, shows]
  )
  const seasons = useMemo(() => (openShow ? groupSeasons(openShow) : []), [openShow])

  const openToken = useCallback(() => {
    setTokenDraft('')
    setTokenError(null)
    setTokenOpen(true)
  }, [])

  const submitToken = useCallback(async () => {
    const value = tokenDraft.trim()
    if (!value || !window.tv) return

    setSavingToken(true)
    setTokenError(null)
    try {
      const res = await window.tv.setToken(value)
      if (!res?.ok) {
        setTokenError(res?.error || 'TMDB refused that token')
        setSavingToken(false)
        return
      }
      setHasToken(true)
      setTokenOpen(false)
      window.location.reload()
    } catch (err) {
      setTokenError(err?.message || 'Could not save the token')
      setSavingToken(false)
    }
  }, [tokenDraft])

  // short projector-leader beat, then hand the file to VLC
  const launch = useCallback((item, file, kicker) => {
    if (!window.tv || !file || launchingRef.current) return
    launchingRef.current = true
    setPlayError(null)
    setPlaying({
      title: item.title,
      color: item.color || '#ffffff',
      kicker: kicker || 'NOW PLAYING',
    })

    window.setTimeout(async () => {
      try {
        const res = await window.tv.playMovie(file)
        if (!res?.ok) {
          setPlayError(res?.error || 'Could not start playback')
          return
        }
        setPlaying(null)
        launchingRef.current = false
      } catch (err) {
        setPlayError(err?.message || 'Could not start playback')
      }
    }, 750)
  }, [])

  const playEpisode = useCallback(
    (ep) => {
      if (!openShow || !ep) return
      launch(
        { ...openShow, title: `${openShow.title} · S${pad(ep.season)}E${pad(ep.episode)}` },
        ep.path,
        'UP NEXT'
      )
    },
    [openShow, launch]
  )

  const onAction = useCallback(
    (action) => {
      if (playing) {
        if (playError && (action === 'BACK' || action === 'QUIT')) {
          setPlaying(null)
          setPlayError(null)
          launchingRef.current = false
        }
        return
      }

      if (tokenOpen) {
        if ((action === 'BACK' || action === 'QUIT') && !savingToken) setTokenOpen(false)
        return
      }

      // the finder owns its own keyboard, but if focus escapes, close it
      if (finderOpen) {
        if (action === 'BACK' || action === 'QUIT') setFinderOpen(false)
        return
      }

      if (action === 'QUIT') {
        window.tv?.quit?.()
        return
      }

      if (action === 'SETTINGS') {
        openToken()
        return
      }

      if (action === 'FIND') {
        setFinderOpen(true)
        return
      }

      // episode picker for the open show
      if (openShow) {
        if (action === 'BACK' || action === 'HOME') {
          setOpenShowId(null)
          return
        }
        if (action === 'SELECT') {
          const ep = seasons[episodeFocus.row]?.items[episodeFocus.col]
          if (ep) playEpisode(ep)
          return
        }

        const { row, col } = episodeFocus
        let next = episodeFocus
        if (action === 'UP') {
          const r = Math.max(0, row - 1)
          next = { row: r, col: Math.min(col, seasons[r].items.length - 1) }
        } else if (action === 'DOWN') {
          const r = Math.min(seasons.length - 1, row + 1)
          next = { row: r, col: Math.min(col, seasons[r].items.length - 1) }
        } else if (action === 'LEFT') {
          next = { row, col: Math.max(0, col - 1) }
        } else if (action === 'RIGHT') {
          next = { row, col: Math.min(col + 1, seasons[row].items.length - 1) }
        }
        setEpisodeFocus(next)
        return
      }

      if (rows.length === 0) return
      const { row, col } = focus
      let next = focus

      switch (action) {
        case 'UP': {
          const r = Math.max(0, row - 1)
          next = { row: r, col: clampCol(rows, r, col) }
          break
        }
        case 'DOWN': {
          const r = Math.min(rows.length - 1, row + 1)
          next = { row: r, col: clampCol(rows, r, col) }
          break
        }
        case 'LEFT':
          next = { row, col: Math.max(0, col - 1) }
          break
        case 'RIGHT':
          next = { row, col: clampCol(rows, row, col + 1) }
          break
        case 'BACK':
        case 'HOME':
          next = { row: 0, col: 0 }
          break
        case 'SELECT': {
          const item = rows[row].items[col]
          if (isShow(item)) {
            setOpenShowId(item.id)
            setEpisodeFocus({ row: 0, col: 0 })
          } else if (item?.path) {
            launch(item, item.path)
          }
          break
        }
      }

      setFocus(next)
    },
    [
      playing,
      playError,
      tokenOpen,
      savingToken,
      finderOpen,
      openToken,
      openShow,
      seasons,
      episodeFocus,
      rows,
      focus,
      launch,
      playEpisode,
    ]
  )

  useInput(onAction)

  const hoverTile = (r, c) =>
    setFocus((prev) => (prev.row === r && prev.col === c ? prev : { row: r, col: c }))

  const hoverEpisode = (r, c) =>
    setEpisodeFocus((prev) => (prev.row === r && prev.col === c ? prev : { row: r, col: c }))

  const openItem = (item) => {
    if (isShow(item)) {
      setOpenShowId(item.id)
      setEpisodeFocus({ row: 0, col: 0 })
    } else if (item?.path) {
      launch(item, item.path)
    }
  }

  // mouse parallax: the backdrop and hero drift slightly against the pointer
  const handlePointer = useCallback((e) => {
    const el = rootRef.current
    if (!el) return
    const px = (e.clientX / window.innerWidth - 0.5) * 2
    const py = (e.clientY / window.innerHeight - 0.5) * 2
    el.style.setProperty('--px', px.toFixed(3))
    el.style.setProperty('--py', py.toFixed(3))
  }, [])

  const modal = tokenOpen ? (
    <TokenModal
      value={tokenDraft}
      onChange={setTokenDraft}
      onSubmit={submitToken}
      onClose={() => setTokenOpen(false)}
      error={tokenError}
      saving={savingToken}
    />
  ) : null

  const overlays = (
    <>
      {modal}
      {finderOpen && (
        <SimilarFinder
          onClose={() => setFinderOpen(false)}
          library={libraryItems}
          hasToken={hasToken}
          onNeedToken={() => {
            setFinderOpen(false)
            openToken()
          }}
          onOpenItem={(item) => {
            setFinderOpen(false)
            openItem(item)
          }}
        />
      )}
      {playing && (
        <LaunchScreen
          title={playing.title}
          kicker={playing.kicker}
          color={playing.color}
          error={playError}
        />
      )}
    </>
  )

  // ---- show detail: pick an episode -------------------------------------
  if (openShow) {
    return (
      <>
        <div
          ref={rootRef}
          onMouseMove={handlePointer}
          className="grain relative h-full overflow-hidden bg-black"
        >
          <div
            className="drift pointer-events-none absolute -left-40 -top-80 h-[900px] w-[900px] rounded-full opacity-[0.16] blur-[130px] transition-colors duration-1000"
            style={{ backgroundColor: openShow.color }}
          />

          <div
            className="pointer-events-none absolute -inset-6 transition-transform duration-700 ease-out"
            style={{ transform: 'translate3d(calc(var(--px, 0) * -12px), calc(var(--py, 0) * -12px), 0)' }}
          >
            {openShow.backdrop && (
              <div key={openShow.backdrop} className="backdrop-in absolute inset-0">
                <img src={openShow.backdrop} alt="" className="kenburns h-full w-full object-cover" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/35 to-transparent" />

          <Starfield className="opacity-50" />

          <Brand hasToken={hasToken} onAddToken={openToken} />
          <SearchBar onClick={() => setFinderOpen(true)} />

          <div
            className="absolute left-14 top-[13vh] max-w-2xl transition-transform duration-700 ease-out"
            style={{ transform: 'translate3d(calc(var(--px, 0) * 6px), calc(var(--py, 0) * 6px), 0)' }}
          >
            <div key={openShow.id} className="hero-in">
              <Kicker>Series</Kicker>
              <h1 className="title-in mt-3 text-5xl font-semibold leading-[1.03] tracking-[-0.035em] md:text-6xl">
                {openShow.title}
              </h1>
              <span
                className="line-in mt-4 block h-[2px] w-10 rounded-full"
                style={{ backgroundColor: openShow.color }}
              />
              <Meta
                item={openShow}
                extra={[
                  `${seasons.length} season${seasons.length === 1 ? '' : 's'}`,
                  `${openShow.episodes.length} episodes`,
                ]}
              />
              {openShow.overview && (
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/55 line-clamp-3">
                  {openShow.overview}
                </p>
              )}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-[50vh] overflow-y-hidden">
            {seasons.map((season, r) => (
              <section key={season.id} className="mb-5">
                <div className="flex items-center gap-3 px-14">
                  <h2 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
                    Season {pad(season.season)}
                  </h2>
                  <span className="text-[10px] tabular-nums text-white/20">{season.items.length}</span>
                </div>
                <div className="flex gap-3 overflow-x-hidden px-14 py-4">
                  {season.items.map((ep, c) => (
                    <EpisodeTile
                      key={ep.path}
                      episode={ep}
                      focused={episodeFocus.row === r && episodeFocus.col === c}
                      onHover={() => hoverEpisode(r, c)}
                      onSelect={() => playEpisode(ep)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="absolute right-8 top-10">
            <ExitButton />
          </div>
          <p className="absolute bottom-5 right-8 text-[9px] uppercase tracking-[0.22em] text-white/20">
            TMDB
          </p>
        </div>
        {overlays}
      </>
    )
  }

  // ---- home ------------------------------------------------------------
  const current = rows[focus.row]?.items[focus.col]

  if (!current) {
    return (
      <>
        <div
          ref={rootRef}
          className="grain relative flex h-full flex-col items-center justify-center gap-6 overflow-hidden bg-black"
        >
          <Starfield className="opacity-50" />
          {loaded && problem ? (
            <p className="max-w-md text-center text-sm leading-relaxed text-white/45">{problem}</p>
          ) : (
            <>
              <SpinningTop className="h-20 w-20" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/30">
                {loaded ? 'Nothing in C:\\Mvs' : 'Spinning up the library'}
              </p>
            </>
          )}
        </div>
        {overlays}
      </>
    )
  }

  const currentEpisodes = isShow(current) ? current.episodes?.length ?? 0 : 0
  const currentSeasons = isShow(current)
    ? new Set(current.episodes?.map((ep) => ep.season)).size
    : 0

  return (
    <>
      <div
        ref={rootRef}
        onMouseMove={handlePointer}
        className="grain relative h-full overflow-hidden bg-black"
      >
        <div
          className="drift pointer-events-none absolute -left-40 -top-80 h-[900px] w-[900px] rounded-full opacity-[0.18] blur-[130px] transition-colors duration-1000"
          style={{ backgroundColor: current.color }}
        />

        <div
          className="pointer-events-none absolute -inset-6 transition-transform duration-700 ease-out"
          style={{ transform: 'translate3d(calc(var(--px, 0) * -12px), calc(var(--py, 0) * -12px), 0)' }}
        >
          {current.backdrop && (
            <div key={current.backdrop} className="backdrop-in absolute inset-0">
              <img src={current.backdrop} alt="" className="kenburns h-full w-full object-cover" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/35 to-transparent" />

        <Starfield className="opacity-50" />
        <DvdScreensaver visible={idle} />

        <Brand hasToken={hasToken} onAddToken={openToken} />
        <SearchBar onClick={() => setFinderOpen(true)} />

        {/* hero info — animates in every time the focus moves */}
        <div className="absolute left-14 top-[14vh] max-w-2xl transition-transform duration-700 ease-out"
          style={{ transform: 'translate3d(calc(var(--px, 0) * 6px), calc(var(--py, 0) * 6px), 0)' }}
        >
          <div key={current.id} className="hero-in">
            <Kicker>{isShow(current) ? 'Series' : 'Film'}</Kicker>
            <h1 className="title-in mt-3 text-5xl font-semibold leading-[1.03] tracking-[-0.035em] md:text-6xl">
              {current.title}
            </h1>
            <span
              className="line-in mt-4 block h-[2px] w-10 rounded-full"
              style={{ backgroundColor: current.color }}
            />
            <Meta
              item={current}
              extra={
                isShow(current)
                  ? [
                      `${currentEpisodes} episodes`,
                      `${currentSeasons} season${currentSeasons === 1 ? '' : 's'}`,
                    ]
                  : []
              }
            />
            {current.overview && (
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/55 line-clamp-2">
                {current.overview}
              </p>
            )}
          </div>
        </div>

        {/* shelves */}
        <div className="absolute inset-x-0 bottom-0 pb-5">
          {rows.map((row, r) => (
            <section key={row.id} className="mb-2 last:mb-0">
              <div className="flex items-center gap-3 px-14">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
                  {row.title}
                </h2>
                <span className="text-[10px] tabular-nums text-white/20">{row.items.length}</span>
              </div>
              <div className="flex gap-5 overflow-x-hidden px-14 py-3">
                {row.items.map((item, c) => (
                  <Tile
                    key={item.id ?? item.path}
                    item={item}
                    index={c}
                    focused={focus.row === r && focus.col === c}
                    onHover={() => hoverTile(r, c)}
                    onSelect={() => openItem(item)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="absolute right-8 top-10">
          <ExitButton />
        </div>
        <p className="absolute bottom-5 right-8 text-[9px] uppercase tracking-[0.22em] text-white/20">
          TMDB
        </p>
      </div>
      {overlays}
    </>
  )
}
