import { contextBridge, ipcRenderer } from 'electron'

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

try {
  contextBridge.exposeInMainWorld('context', {
    windowMinimize: () => ipcRenderer.send('window-minimize'),
    windowMaximize: () => ipcRenderer.send('window-maximize'),
    windowClose: () => ipcRenderer.send('window-close'),
    openExternal: (url: string) => ipcRenderer.send('open-external', url)
  })

  contextBridge.exposeInMainWorld('nvmAPI', {
    checkAvailableModes: () => ipcRenderer.invoke('nvm:checkAvailableModes'),
    getMode: () => ipcRenderer.invoke('nvm:getMode'),
    setMode: (mode: string) => ipcRenderer.send('nvm:setMode', mode),
    getInstalledData: () => ipcRenderer.invoke('nvm:getInstalledData'),
    getDownloadData: () => ipcRenderer.invoke('nvm:getDownloadData'),
    installEngine: (engine: string) => ipcRenderer.invoke('nvm:installEngine', engine),
    installVersion: (version: string) => ipcRenderer.invoke('nvm:installVersion', version),
    uninstallVersion: (version: string) => ipcRenderer.invoke('nvm:uninstallVersion', version),
    useVersion: (version: string) => ipcRenderer.invoke('nvm:useVersion', version),
    migratePackages: (version: string, fromVersion: string, packages?: string[]) => ipcRenderer.invoke('nvm:migratePackages', version, fromVersion, packages),
    getPackagesForVersion: (version: string) => ipcRenderer.invoke('nvm:getPackagesForVersion', version),
    detectProjectVersion: (dirPath: string) => ipcRenderer.invoke('nvm:detectProjectVersion', dirPath),
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    cancelInstall: () => ipcRenderer.invoke('nvm:cancelInstall'),
    runNpmCommand: (args: string[]) => ipcRenderer.invoke('nvm:runNpmCommand', args),
    listAliases: () => ipcRenderer.invoke('nvm:listAliases'),
    setAlias: (name: string, version: string) => ipcRenderer.invoke('nvm:setAlias', name, version),
    deleteAlias: (name: string) => ipcRenderer.invoke('nvm:deleteAlias', name),
    checkOutdatedPackages: () => ipcRenderer.invoke('nvm:checkOutdatedPackages'),
    cleanNpmCache: () => ipcRenderer.invoke('nvm:cleanNpmCache'),
    runCustomCommand: (command: string) => ipcRenderer.invoke('nvm:runCustomCommand', command),
    getGlobalPackagesSizes: (packages: string[]) => ipcRenderer.invoke('nvm:getGlobalPackagesSizes', packages),
    getNodeSizes: (type: 'installed' | 'download', versions: string[]) => ipcRenderer.invoke('nvm:getNodeSizes', type, versions),
    onStream: (callback: (data: { msg: string; type: string }) => void) => {
      ipcRenderer.on('nvm:stream', (_event, data) => callback(data))
    },
    removeStreamListener: () => {
      ipcRenderer.removeAllListeners('nvm:stream')
    },
    onRefreshRequested: (callback: () => void) => {
      ipcRenderer.on('nvm:refresh-requested', () => callback())
    },
    removeRefreshListener: () => {
      ipcRenderer.removeAllListeners('nvm:refresh-requested')
    }
  })
} catch (error) {
  console.error('PRELOAD SCRIPT ERROR:', error)
  // Also alert so we can see it in the UI if console is missed
  if (typeof window !== 'undefined') {
    window.alert('PRELOAD ERROR: ' + String(error))
  }
}
