const fs = require('fs/promises')
const path = require('path')

const EXTS = new Set(['.mkv', '.mp4', '.avi', '.mov', '.webm'])
const JUNK =
  /\b(480p|720p|1080p|2160p|4k|bluray|brrip|bdrip|webrip|web-dl|hdrip|dvdrip|x264|x265|h264|h265|hevc)\b/i
// S01E02, s4e1, S01.E02, S01_E02 ...
const EPISODE = /\b[Ss](\d{1,2})[\s._-]*[Ee](\d{1,3})\b/
const SMALL = new Set(['a', 'an', 'and', 'of', 'the', 'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by'])

// "breaking bad" -> "Breaking Bad", "The Shining" left alone
function prettify(str) {
  const clean = str.replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (/[A-Z]/.test(clean)) return clean
  return clean
    .split(' ')
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

function parseTitle(filePath) {
  const clean = path.parse(filePath).name.replace(/[._]+/g, ' ').trim()

  // "Inception 2010 1080p ..." -> title "Inception", year 2010
  const y = /\b((?:19|20)\d{2})\b/.exec(clean)
  if (y && y.index > 0) {
    return { title: prettify(clean.slice(0, y.index).replace(/[\s(\[-]+$/, '')), year: y[1] }
  }

  // no year: cut at the first quality/codec tag instead
  const j = JUNK.exec(clean)
  const raw = (j && j.index > 0 ? clean.slice(0, j.index) : clean).replace(/[\s(\[-]+$/, '')
  return { title: prettify(raw) || prettify(clean), year: null }
}

// "Breaking Bad S04E02 720p ..." -> { show: 'Breaking Bad', season: 4, episode: 2, title: null }
function parseEpisode(filePath) {
  const clean = path.parse(filePath).name.replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim()
  const m = EPISODE.exec(clean)
  if (!m) return null

  let before = clean.slice(0, m.index).trim()
  let after = clean.slice(m.index + m[0].length).trim()

  // "Tulsa King (2022) S3E1" -> show year comes from the file name
  let year = null
  const y = /\b((?:19|20)\d{2})\b/.exec(before)
  if (y) {
    year = y[1]
    before = before.slice(0, y.index).trim()
  }
  before = before.replace(/[\s(\[-]+$/, '')

  // episode name, cut before the quality tags
  const j = JUNK.exec(after)
  if (j) after = after.slice(0, j.index)
  after = after.replace(/[\s(\[-]+$/, '').trim()

  const show = prettify(before)
  if (!show) return null

  return {
    show,
    year,
    key: show.toLowerCase().replace(/[^a-z0-9]+/g, ''),
    season: Number(m[1]),
    episode: Number(m[2]),
    title: after ? prettify(after) : null,
  }
}

async function walk(dir, out) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return // folder not readable, skip it
  }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      await walk(full, out)
    } else if (EXTS.has(path.extname(e.name).toLowerCase()) && !/sample/i.test(e.name)) {
      out.push(full)
    }
  }
}

async function scanLibrary(root) {
  const files = []
  await walk(root, files)

  const movies = []
  const shows = new Map()

  for (const file of files) {
    const ep = parseEpisode(file)
    if (!ep) {
      movies.push({ path: file, kind: 'movie', ...parseTitle(file) })
      continue
    }

    let show = shows.get(ep.key)
    if (!show) {
      show = { id: `show:${ep.key}`, kind: 'show', title: ep.show, year: ep.year, episodes: [] }
      shows.set(ep.key, show)
    }
    if (!show.year && ep.year) show.year = ep.year
    show.episodes.push({ path: file, season: ep.season, episode: ep.episode, title: ep.title })
  }

  for (const show of shows.values()) {
    show.episodes.sort((a, b) => a.season - b.season || a.episode - b.episode)
  }

  return {
    movies: movies.sort((a, b) => a.title.localeCompare(b.title)),
    shows: [...shows.values()].sort((a, b) => a.title.localeCompare(b.title)),
  }
}

module.exports = { scanLibrary }
