const fs = require('fs')
const path = require('path')
const { app } = require('electron')

// Treat the sample text we ship as "no token", not as a real key.
function isPlaceholder(value) {
  if (!value) return true
  return /paste_your|your_token|your_tmdb|changeme|placeholder/i.test(value) || value.length < 20
}

function envFiles() {
  const files = []
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    files.push(path.join(process.env.PORTABLE_EXECUTABLE_DIR, '.env'))
  }
  files.push(path.join(path.dirname(app.getPath('exe')), '.env'))
  files.push(path.join(app.getPath('userData'), '.env'))
  files.push(path.join(app.getAppPath(), '.env'))
  files.push(path.join(__dirname, '..', '.env'))
  return [...new Set(files)]
}

function readToken() {
  const fromEnv = (process.env.TMDB_TOKEN || '').trim()
  if (!isPlaceholder(fromEnv)) return fromEnv

  for (const file of envFiles()) {
    try {
      const text = fs.readFileSync(file, 'utf8')
      const m = /^\s*TMDB_TOKEN\s*=\s*(.+)$/m.exec(text)
      const value = m?.[1]?.trim().replace(/^["']|["']$/g, '')
      if (!isPlaceholder(value)) return value
    } catch {
      // not here, try the next location
    }
  }
  return null
}

function saveToken(token) {
  const value = String(token || '').trim()
  if (isPlaceholder(value)) throw new Error('That does not look like a TMDB token')

  const file = path.join(app.getPath('userData'), '.env')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `TMDB_TOKEN=${value}\n`)
  return file
}

module.exports = { readToken, saveToken, isPlaceholder }
