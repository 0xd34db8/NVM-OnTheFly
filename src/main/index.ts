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

let appTray: Tray | null = null

export async function updateTrayMenu() {
  if (!appTray) return

  const menuTemplate: any[] = [
    { label: 'Open NVM: OnTheFly', click: () => {
        const win = BrowserWindow.getAllWindows()[0]
        if (win) {
          win.show()
          win.focus()
        } else {
          createWindow()
        }
    }},
    { type: 'separator' }
  ]

  try {
    const installed = await getInstalledData()
    if (installed && installed.length > 0) {
      menuTemplate.push({ label: 'Switch Node Version', enabled: false })
      installed.forEach(node => {
        menuTemplate.push({
          label: `${node.isActive ? '✓ ' : '  '} v${node.version}`,
          type: 'normal',
          click: async () => {
            if (!node.isActive) {
              await useVersion(node.version)
              updateTrayMenu()
              // Send event to renderer to refresh UI if open
              BrowserWindow.getAllWindows().forEach(w => w.webContents.send('nvm:refresh-requested'))
            }
          }
        })
      })
      menuTemplate.push({ type: 'separator' })
    }
  } catch (e) {
    // Ignore error if nvm is not ready
  }

  menuTemplate.push({ label: 'Quit', click: () => app.quit() })
  appTray.setContextMenu(Menu.buildFromTemplate(menuTemplate))
}

function createTray() {
  const iconPath = join(__dirname, '../../src/renderer/assets/img/logo-32x32.ico')
  const icon = nativeImage.createFromPath(iconPath)
  appTray = new Tray(icon)

  appTray.setToolTip('NVM: OnTheFly')
  updateTrayMenu()
}

import {
  checkAvailableModes,
  getMode,
  setMode,
  getInstalledData,
  getDownloadData,
  installEngine,
  installVersion,
  uninstallVersion,
  useVersion,
  migratePackages,
  getPackagesForVersion,
  runNpmCommand,
  cancelInstallProcess,
  getAliases,
  setAlias,
  deleteAlias
} from './nvm'

async function getDirSize(dirPath: string): Promise<number> {
  let size = 0
  const fs = require('fs/promises')
  const path = require('path')
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true })
    const sizes = await Promise.all(files.map(async (file: any) => {
      const filePath = path.join(dirPath, file.name)
      if (file.isDirectory()) {
        return await getDirSize(filePath)
      } else {
        const stat = await fs.stat(filePath)
        return stat.size
      }
    }))
    size = sizes.reduce((acc: number, curr: number) => acc + curr, 0)
  } catch (e) {
    // ignore
  }
  return size
}

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
  
  ipcMain.handle('dialog:openDirectory', async () => {
    const { dialog } = require('electron')
    const result = await dialog.showOpenDialog(BrowserWindow.getAllWindows()[0], {
      properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  ipcMain.handle('nvm:detectProjectVersion', async (event, dirPath: string) => {
    const fs = require('fs/promises')
    const path = require('path')
    let requiredVersion = null
    let source = null
    const dependencies: { name: string, version: string, size?: number, isDev: boolean }[] = []

    let pkgObj: any = null

    // Try to get package.json
    try {
      const pkgPath = path.join(dirPath, 'package.json')
      const pkgContent = await fs.readFile(pkgPath, 'utf8')
      pkgObj = JSON.parse(pkgContent)
      if (pkgObj.engines && pkgObj.engines.node) {
        requiredVersion = pkgObj.engines.node
        source = 'package.json (engines.node)'
      }
    } catch (err) {}

    // Try .nvmrc if no requiredVersion found yet
    if (!requiredVersion) {
      try {
        const nvmrcPath = path.join(dirPath, '.nvmrc')
        const nvmrcContent = await fs.readFile(nvmrcPath, 'utf8')
        requiredVersion = nvmrcContent.trim()
        source = '.nvmrc'
      } catch (e) {}
    }

    if (pkgObj) {
      const allDeps = []
      if (pkgObj.dependencies) {
        for (const [name, version] of Object.entries(pkgObj.dependencies)) {
          allDeps.push({ name, version: String(version), isDev: false })
        }
      }
      if (pkgObj.devDependencies) {
        for (const [name, version] of Object.entries(pkgObj.devDependencies)) {
          allDeps.push({ name, version: String(version), isDev: true })
        }
      }

      await Promise.all(allDeps.map(async (dep) => {
        const nodeModulesPath = path.join(dirPath, 'node_modules', dep.name)
        const size = await getDirSize(nodeModulesPath)
        dependencies.push({ ...dep, size })
      }))
    }

    // sort alphabetically
    dependencies.sort((a, b) => a.name.localeCompare(b.name))

    return { requiredVersion, source, dependencies }
  })
  
  ipcMain.handle('nvm:installEngine', async (event, engine: string) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    const res = await installEngine(engine, onStream)
    updateTrayMenu()
    return res
  })
  
  ipcMain.handle('nvm:installVersion', async (event, version: string) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    const res = await installVersion(version, onStream)
    updateTrayMenu()
    return res
  })
  
  ipcMain.handle('nvm:uninstallVersion', async (event, version: string) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    const res = await uninstallVersion(version, onStream)
    updateTrayMenu()
    return res
  })
  
  ipcMain.handle('nvm:useVersion', async (event, version: string) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    const res = await useVersion(version, onStream)
    updateTrayMenu()
    return res
  })
  
  ipcMain.handle('nvm:migratePackages', async (event, version: string, fromVersion: string, packages?: string[]) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    const res = await migratePackages(version, fromVersion, packages, onStream)
    updateTrayMenu()
    return res
  })
  
  ipcMain.handle('nvm:getPackagesForVersion', (event, version: string) => {
    return getPackagesForVersion(version)
  })
  
  ipcMain.handle('nvm:runNpmCommand', (event, args: string[]) => {
    const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
    return runNpmCommand(args, onStream)
  })

  ipcMain.handle('nvm:listAliases', async () => {
    return getAliases()
  })

  ipcMain.handle('nvm:setAlias', async (event, name: string, version: string) => {
    return setAlias(name, version)
  })

  ipcMain.handle('nvm:deleteAlias', async (event, name: string) => {
    return deleteAlias(name)
  })

  ipcMain.handle('nvm:checkOutdatedPackages', async () => {
    try {
      const res = await runNpmCommand(['outdated', '-g', '--json'])
      // npm outdated exits with 1 if there are outdated packages, 0 if everything is up to date.
      if (res.result) {
        return JSON.parse(res.result)
      }
      return {}
    } catch (e) {
      return {}
    }
  })

  ipcMain.handle('nvm:cleanNpmCache', async () => {
    const res = await runNpmCommand(['cache', 'clean', '--force'])
    return res
  })

  ipcMain.handle('nvm:runCustomCommand', (event, command: string) => {
    return new Promise((resolve) => {
      const { spawn } = require('child_process')
      
      let cmd;
      if (getMode() === 'nvm-sh') {
        const bashCmd = `source ~/.bash_profile 2>/dev/null || true; source ~/.bashrc 2>/dev/null || true; source ~/.nvm/nvm.sh 2>/dev/null || true; ${command}`
        cmd = spawn('bash', ['-c', bashCmd], { shell: false })
      } else {
        cmd = spawn(command, { shell: true })
      }
      
      let stdoutData = ''
      let stderrData = ''
      
      const onStream = (msg: string, type: string) => event.sender.send('nvm:stream', { msg, type })
      
      onStream(`> ${command}\n`, 'system')

      cmd.stdout.on('data', (d: any) => {
        const msg = String(d)
        stdoutData += msg
        onStream(msg, 'info')
      })
      cmd.stderr.on('data', (d: any) => {
        const msg = String(d)
        stderrData += msg
        onStream(msg, 'error')
      })
      cmd.on('error', (err: any) => {
        onStream(`Command failed: ${err.message}\n`, 'error')
        resolve({ result: '', error: err.message, code: 1 })
      })
      cmd.on('exit', (code: number | null) => {
        resolve({ result: stdoutData, error: stderrData, code })
      })
    })
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
