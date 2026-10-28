const fs = require('fs')
const path = require('path')
const { app } = require('electron')
const { readToken } = require('./config.cjs')

const IMG = 'https://image.tmdb.org/t/p'
const GENRES = {
  12: 'Adventure',
  14: 'Fantasy',
  16: 'Animation',
  18: 'Drama',
  27: 'Horror',
  28: 'Action',
  35: 'Comedy',
  36: 'History',
  37: 'Western',
  53: 'Thriller',
  80: 'Crime',
  99: 'Documentary',
  878: 'Sci-Fi',
  9648: 'Mystery',
  10402: 'Music',
  10749: 'Romance',
  10751: 'Family',
  10752: 'War',
  10770: 'TV Movie',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
}
let cache = null
let cacheFile = null
const searchCache = new Map()
const similarCache = new Map()
const detailsCache = new Map()

function loadCache() {
  if (cache) return
  cacheFile = path.join(app.getPath('userData'), 'meta-cache.json')
  try {
    cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
  } catch {
    cache = {}
  }
}

function saveCache() {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(cache))
  } catch {}
}

function resetCache() {
  cache = {}
  searchCache.clear()
  similarCache.clear()
  detailsCache.clear()
  try {
    fs.rmSync(path.join(app.getPath('userData'), 'meta-cache.json'), { force: true })
  } catch {}
}

// first 6 chars + length: changing the token re-asks TMDB instead of
// reusing the "no match" results cached for the previous token
function tokenTag(token) {
  return `${token.slice(0, 6)}:${token.length}`
}

async function request(token, endpoint, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3${endpoint}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  const headers = { accept: 'application/json' }
  // v4 read tokens start with "eyJ"; v3 keys are short hex strings
  if (token.startsWith('eyJ')) headers.Authorization = `Bearer ${token}`
  else url.searchParams.set('api_key', token)

  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(res.status === 401 ? 'TMDB rejected that token (401)' : `TMDB ${res.status}`)
  }

  return res.json()
}

async function search(token, title, year, type) {
  const params = { query: title, include_adult: 'false' }
  if (year) params[type === 'tv' ? 'first_air_date_year' : 'year'] = year

  const data = await request(token, `/search/${type}`, params)
  return data.results?.[0] ?? null
}

function resultShape(item, fallbackKind) {
  const kind =
    item.media_type === 'tv' || item.first_air_date
      ? 'tv'
      : fallbackKind === 'tv'
        ? 'tv'
        : 'movie'

  return {
    id: item.id,
    kind,
    title: item.title || item.name || '',
    year: (item.release_date || item.first_air_date || '').slice(0, 4) || null,
    overview: item.overview || '',
    rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
    poster: item.poster_path ? `${IMG}/w500${item.poster_path}` : null,
    backdrop: item.backdrop_path ? `${IMG}/w1280${item.backdrop_path}` : null,
    genres: (item.genre_ids || [])
      .map((id) => GENRES[id])
      .filter(Boolean)
      .slice(0, 3),
  }
}

async function searchTitles(query) {
  const q = String(query || '').trim()
  if (!q) return { ok: true, results: [] }

  const token = readToken()
  if (!token) return { ok: false, error: 'No TMDB token saved', results: [] }

  const key = q.toLowerCase()
  if (searchCache.has(key)) return { ok: true, results: searchCache.get(key) }

  try {
    const data = await request(token, '/search/multi', {
      query: q,
      include_adult: 'false',
      language: 'en-US',
    })

    const results = (data.results || [])
      .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 12)
      .map((r) => resultShape(r, r.media_type))

    searchCache.set(key, results)
    return { ok: true, results }
  } catch (err) {
    return { ok: false, error: err.message || 'TMDB search failed', results: [] }
  }
}

async function getSimilar(id, kind) {
  const type = kind === 'tv' ? 'tv' : 'movie'
  if (!id) return { ok: true, results: [] }

  const token = readToken()
  if (!token) return { ok: false, error: 'No TMDB token saved', results: [] }

  const key = `${type}:${id}`
  if (similarCache.has(key)) return { ok: true, results: similarCache.get(key) }

  try {
    const data = await request(token, `/${type}/${id}/recommendations`, { language: 'en-US' })

    const results = (data.results || [])
      .filter((r) => r.poster_path)
      .slice(0, 12)
      .map((r) => resultShape(r, type))

    similarCache.set(key, results)
    return { ok: true, results }
  } catch (err) {
    return { ok: false, error: err.message || 'TMDB recommendations failed', results: [] }
  }
}

async function getDetails(id, kind) {
  const type = kind === 'tv' ? 'tv' : 'movie'
  if (!id) return { ok: false, error: 'Missing title id' }

  const token = readToken()
  if (!token) return { ok: false, error: 'No TMDB token saved' }

  const key = `${type}:${id}`
  if (detailsCache.has(key)) return { ok: true, details: detailsCache.get(key) }

  try {
    const data = await request(token, `/${type}/${id}`, {
      append_to_response: 'credits',
      language: 'en-US',
    })

    const credits = data.credits || {}
    const cast = (credits.cast || [])
      .filter((person) => person.name)
      .slice(0, 8)
      .map((person) => ({
        name: person.name,
        character: person.character || '',
        profile: person.profile_path ? `${IMG}/w185${person.profile_path}` : null,
      }))

    const directors = (credits.crew || [])
      .filter((person) => person.job === 'Director')
      .map((person) => person.name)
      .filter(Boolean)
      .slice(0, 2)

    const creators = (data.created_by || [])
      .map((person) => person.name)
      .filter(Boolean)
      .slice(0, 2)

    const details = {
      id: data.id,
      kind: type,
      overview: data.overview || '',
      tagline: data.tagline || '',
      status: data.status || '',
      releaseDate: data.release_date || data.first_air_date || '',
      runtime:
        data.runtime ||
        (Array.isArray(data.episode_run_time) ? data.episode_run_time[0] : null) ||
        null,
      seasons: data.number_of_seasons ?? null,
      episodes: data.number_of_episodes ?? null,
      genres: (data.genres || []).map((genre) => genre.name).filter(Boolean),
      countries: (data.production_countries || [])
        .map((country) => country.name)
        .filter(Boolean)
        .slice(0, 2),
      directors,
      creators,
      cast,
    }

    detailsCache.set(key, details)
    return { ok: true, details }
  } catch (err) {
    return { ok: false, error: err.message || 'TMDB details failed' }
  }
}

async function verifyToken(token) {
  try {
    await search(token, 'Inception', null, 'movie')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

async function getMeta(title, year, kind = 'movie') {
  loadCache()
  const type = kind === 'tv' ? 'tv' : 'movie'
  const token = readToken()
  if (!token) return null

  const key = `${type}|${tokenTag(token)}|${title.toLowerCase()}|${year || ''}`
  if (key in cache) return cache[key]

  try {
    let hit = await search(token, title, year, type)
    if (!hit && year) hit = await search(token, title, null, type) // retry without the year

    const meta = hit
      ? {
          tmdbId: hit.id,
          title: hit.title || hit.name,
          year: (hit.release_date || hit.first_air_date)?.slice(0, 4) || year || null,
          overview: hit.overview || '',
          rating: hit.vote_average ? Math.round(hit.vote_average * 10) / 10 : null,
          poster: hit.poster_path ? `${IMG}/w500${hit.poster_path}` : null,
          backdrop: hit.backdrop_path ? `${IMG}/w1280${hit.backdrop_path}` : null,
        }
      : null

    cache[key] = meta // "no match" is cached too, so we don't re-ask every launch
    saveCache()
    return meta
  } catch (err) {
    console.error('TMDB lookup failed:', err.message)
    return null // network errors aren't cached, so they retry next launch
  }
}

module.exports = { getMeta, verifyToken, resetCache, searchTitles, getSimilar, getDetails }
