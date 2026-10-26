const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('tv', {
  scanLibrary: () => ipcRenderer.invoke('library:scan'),
  playMovie: (file) => ipcRenderer.invoke('movies:play', file),
  getMeta: (title, year, kind) => ipcRenderer.invoke('movies:meta', title, year, kind),
  searchTitles: (query) => ipcRenderer.invoke('movies:search', query),
  getSimilar: (id, kind) => ipcRenderer.invoke('movies:similar', id, kind),
  getInfo: () => ipcRenderer.invoke('app:info'),
  setToken: (token) => ipcRenderer.invoke('app:set-token', token),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url),
  quit: () => ipcRenderer.invoke('app:quit'),
})
