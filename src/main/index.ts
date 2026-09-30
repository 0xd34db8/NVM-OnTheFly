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
  getDownloadData,
  installVersion,
  uninstallVersion,
  useVersion,
  migratePackages,
  getPackagesForVersion,
  runNpmCommand,
  cancelInstallProcess
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
  
  ipcMain.handle('nvm:getDownloadData', () => getDownloadData())
  
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
  
  ipcMain.handle('nvm:migratePackages', (event, version: string, fromVersion: string, packages?: string[]) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    return migratePackages(version, fromVersion, packages, onStream)
  })
  
  ipcMain.handle('nvm:getPackagesForVersion', (event, version: string) => {
    return getPackagesForVersion(version)
  })
  
  ipcMain.handle('nvm:runNpmCommand', (event, args: string[]) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    return runNpmCommand(args, onStream)
  })

  ipcMain.handle('nvm:cancelInstall', () => {
    cancelInstallProcess()
  })

  ipcMain.handle('nvm:getGlobalPackagesSizes', async (_, packages: string[]) => {
    try {
      const rootRes = await runNpmCommand(['root', '-g'])
      const rootPath = rootRes.result.trim().replace(/\r?\n|\r/g, '')
      if (!rootPath) return {}

      const fs = require('fs/promises')
      const path = require('path')

      async function getDirSize(dirPath: string): Promise<number> {
        let size = 0
        try {
          const files = await fs.readdir(dirPath, { withFileTypes: true })
          const sizes = await Promise.all(files.map(async (file) => {
            const filePath = path.join(dirPath, file.name)
            if (file.isDirectory()) {
              return await getDirSize(filePath)
            } else {
              const stat = await fs.stat(filePath)
              return stat.size
            }
          }))
          size = sizes.reduce((acc, curr) => acc + curr, 0)
        } catch (e) {
          // ignore
        }
        return size
      }

      const sizes: Record<string, number> = {}
      await Promise.all(packages.map(async (pkg) => {
        const pkgPath = path.join(rootPath, pkg)
        sizes[pkg] = await getDirSize(pkgPath)
      }))

      return sizes
    } catch (e) {
      console.error('Failed to get package sizes:', e)
      return {}
    }
  })

  ipcMain.handle('nvm:getNodeSizes', async (_, type: 'installed' | 'download', versions: string[]) => {
    try {
      const sizes: Record<string, number> = {}
      if (type === 'installed') {
        const mode = getMode()

        let nvmRoot = ''
        if (mode === 'nvm-windows') {
          const appData = process.env.APPDATA
          nvmRoot = appData ? require('node:path').join(appData, 'nvm') : ''
        } else {
          const home = process.env.HOME || process.env.USERPROFILE
          nvmRoot = home ? require('node:path').join(home, '.nvm', 'versions', 'node') : ''
        }
        if (!nvmRoot) return {}

        const fs = require('node:fs/promises')
        const path = require('node:path')

        async function getDirSize(dirPath: string): Promise<number> {
          let size = 0
          try {
            const files = await fs.readdir(dirPath, { withFileTypes: true })
            const folderSizes = await Promise.all(files.map(async (file) => {
              const filePath = path.join(dirPath, file.name)
              if (file.isDirectory()) {
                return await getDirSize(filePath)
              } else {
                const stat = await fs.stat(filePath)
                return stat.size
              }
            }))
            size = folderSizes.reduce((acc, curr) => acc + curr, 0)
          } catch (e) { }
          return size
        }

        await Promise.all(versions.map(async (v) => {
          // nvm-windows names folders without 'v', e.g., '20.0.0'
          const folderName = mode === 'nvm-windows' ? v.replace(/^v/, '') : v
          sizes[v] = await getDirSize(path.join(nvmRoot, folderName))
        }))
      } else if (type === 'download') {
        const platform = process.platform === 'win32' ? 'win' : (process.platform === 'darwin' ? 'darwin' : 'linux')
        const arch = process.arch === 'x64' ? 'x64' : (process.arch === 'arm64' ? 'arm64' : 'x86')
        const ext = platform === 'win' ? 'zip' : 'tar.xz'
        
        await Promise.all(versions.map(async (v) => {
          try {
            const url = `https://nodejs.org/dist/${v}/node-${v}-${platform}-${arch}.${ext}`
            const res = await fetch(url, { method: 'HEAD' })
            if (res.ok) {
              const contentLength = res.headers.get('content-length')
              if (contentLength) sizes[v] = parseInt(contentLength, 10)
            }
          } catch (e) { }
        }))
      }
      return sizes
    } catch (e) {
      console.error('Failed to get node sizes:', e)
      return {}
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
