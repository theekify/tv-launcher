const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const { scanLibrary } = require('./library.cjs')
const { getMeta, verifyToken, resetCache, searchTitles, getSimilar } = require('./tmdb.cjs')
const { readToken, saveToken } = require('./config.cjs')

// `electron .` is now the production path; `electron . --dev` uses Vite.
const isDev = process.argv.includes('--dev')
const MOVIES_DIR = 'C:\\Mvs'
const VLC_PATHS = [
  'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
  'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe',
]

let win
let knownFiles = new Set() // only files the scanner returned can be played

function createWindow() {
  win = new BrowserWindow({
    fullscreen: true,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Esc is a hard quit in the renderer; Ctrl+Q is the same from anywhere
  win.webContents.on('before-input-event', (e, input) => {
    if (input.control && input.key.toLowerCase() === 'q') app.exit(0)
  })
}

ipcMain.handle('library:scan', async () => {
  const { movies, shows } = await scanLibrary(MOVIES_DIR)
  knownFiles = new Set([
    ...movies.map((m) => m.path),
    ...shows.flatMap((s) => s.episodes.map((ep) => ep.path)),
  ])
  return { movies, shows }
})

ipcMain.handle('movies:meta', (_e, title, year, kind) => getMeta(title, year, kind))
ipcMain.handle('movies:search', (_e, query) => searchTitles(query))
ipcMain.handle('movies:similar', (_e, id, kind) => getSimilar(id, kind))

ipcMain.handle('app:info', () => ({ hasToken: Boolean(readToken()), moviesDir: MOVIES_DIR }))

// kill the process outright — closing the window alone can leave the app alive
ipcMain.handle('app:quit', () => {
  app.exit(0)
})

ipcMain.handle('app:open-external', (_e, url) => {
  if (typeof url === 'string' && /^https:\/\/www\.themoviedb\.org\//.test(url)) {
    shell.openExternal(url)
  }
})

ipcMain.handle('app:set-token', async (_e, token) => {
  const value = String(token || '').trim()
  if (!value) return { ok: false, error: 'No token given' }

  const check = await verifyToken(value)
  if (!check.ok) return check

  saveToken(value)
  resetCache()
  return { ok: true }
})

ipcMain.handle('movies:play', (_e, file) => {
  if (!knownFiles.has(file)) return { ok: false, error: 'Unknown file' }

  const vlc = VLC_PATHS.find((p) => fs.existsSync(p))
  if (!vlc) return { ok: false, error: 'VLC not found' }

  const child = spawn(vlc, ['--fullscreen', '--play-and-exit', file], { stdio: 'ignore' })

  win.minimize()
  const comeBack = () => {
    if (win && !win.isDestroyed()) {
      win.restore()
      win.focus()
    }
  }
  child.on('exit', comeBack)
  child.on('error', comeBack)

  return { ok: true }
})

function runSmokeTest() {
  const probe = new BrowserWindow({
    show: false,
    width: 1600,
    height: 900,
    backgroundColor: '#000000',
    webPreferences: {
      contextIsolation: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  const errors = []
  probe.webContents.on('console-message', (_e, level, message) => {
    if (level >= 2 && !message.includes('Electron Security Warning')) errors.push(message)
  })

  ;(async () => {
    try {
      if (isDev) await probe.loadURL('http://localhost:5173')
      else await probe.loadFile(path.join(__dirname, '../dist/index.html'))
      await new Promise((r) => setTimeout(r, 4500))

      const state = await probe.webContents.executeJavaScript(
        `({
          heading: document.querySelector('h1')?.textContent ?? null,
          tiles: document.querySelectorAll('button').length,
          hasBridge: Boolean(window.tv),
          addTokenChip: document.body.innerText.includes('Add TMDB token'),
        })`
      )
      console.log(JSON.stringify({ state, errors }))
    } catch (err) {
      console.log(JSON.stringify({ error: err.message, errors }))
    }
    app.quit()
  })()
}

app.whenReady().then(() => {
  if (process.argv.includes('--smoke')) {
    runSmokeTest()
    return
  }
  if (process.argv.includes('--info')) {
    console.log(
      JSON.stringify({
        name: app.getName(),
        userData: app.getPath('userData'),
        exe: app.getPath('exe'),
        hasToken: Boolean(readToken()),
      })
    )
    app.quit()
    return
  }
  createWindow()
})
app.on('window-all-closed', () => app.quit())
