import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../src/renderer/assets/img/logo-256x256.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray() {
  const iconPath = join(__dirname, '../../src/renderer/assets/img/logo-32x32.ico')
  const icon = nativeImage.createFromPath(iconPath)
  const tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open NVM: OnTheFly', click: () => {
        const win = BrowserWindow.getAllWindows()[0]
        if (win) {
          win.show()
          win.focus()
        } else {
          createWindow()
        }
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setToolTip('NVM: OnTheFly')
  tray.setContextMenu(contextMenu)
}

import {
  checkAvailableModes,
  getMode,
  setMode,
  getInstalledData,
  getRemoteData,
  installVersion,
  uninstallVersion,
  useVersion,
  migratePackages,
  runNpmCommand
} from './nvm'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  createTray()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  ipcMain.on('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.minimize()
  })

  ipcMain.on('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.close()
  })

  ipcMain.on('open-external', (_, url: string) => {
    shell.openExternal(url)
  })

  // NVM IPC Handlers
  ipcMain.handle('nvm:checkAvailableModes', () => checkAvailableModes())
  ipcMain.handle('nvm:getMode', () => getMode())
  ipcMain.on('nvm:setMode', (_, mode) => setMode(mode))
  
  ipcMain.handle('nvm:getInstalledData', (event) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    return getInstalledData(onStream)
  })
  
  ipcMain.handle('nvm:getRemoteData', () => getRemoteData())
  
  ipcMain.handle('nvm:installVersion', (event, version: string) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    return installVersion(version, onStream)
  })
  
  ipcMain.handle('nvm:uninstallVersion', (event, version: string) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    return uninstallVersion(version, onStream)
  })
  
  ipcMain.handle('nvm:useVersion', (event, version: string) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    return useVersion(version, onStream)
  })
  
  ipcMain.handle('nvm:migratePackages', (event, version: string, fromVersion: string) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    return migratePackages(version, fromVersion, onStream)
  })
  
  ipcMain.handle('nvm:runNpmCommand', (event, args: string[]) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    return runNpmCommand(args, onStream)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
