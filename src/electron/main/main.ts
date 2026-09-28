import { join } from 'node:path'
// @ts-ignore
import * as sudo from 'sudo-prompt'

import { spawn } from 'node:child_process'
import { app, BrowserWindow, ipcMain, Menu, nativeImage, Notification, Tray } from 'electron'
import { createSchema, getSchema, setSchema } from '../../utils/storage.js'

const isDev = process.env.npm_lifecycle_event === 'app:dev' ? true : false

// Fix Windows PATH inheritance issues for nvm-windows and Git Bash nvm-sh fallback
if (process.platform === 'win32') {
    const appDataNvm = process.env.APPDATA ? join(process.env.APPDATA, 'nvm') : '';
    const programDataNvm = process.env.ALLUSERSPROFILE ? join(process.env.ALLUSERSPROFILE, 'nvm') : '';
    const gitBashBin = 'C:\\Program Files\\Git\\bin';
    
    if (appDataNvm && !process.env.PATH?.includes(appDataNvm)) {
        process.env.PATH = `${appDataNvm};${process.env.PATH}`;
    }
    if (programDataNvm && !process.env.PATH?.includes(programDataNvm)) {
        process.env.PATH = `${programDataNvm};${process.env.PATH}`;
    }
    if (!process.env.PATH?.includes(gitBashBin)) {
        process.env.PATH = `${gitBashBin};${process.env.PATH}`;
    }
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 750,
        height: 494,
        frame: false,
        resizable: true,
        icon: join(__dirname, '../../../src/assets/img/logo-256x256.png'),
        webPreferences: {
            preload: join(__dirname, '../preload/preload.js'),
        },
    })

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(join(__dirname, '../../index.html'))
    }

    mainWindow.webContents.on('dom-ready', () => {
        createSchema()
        const config = getSchema()

        mainWindow.webContents.send('setPlatform', process.platform)
        mainWindow.webContents.send('getConfig', config)
    })
}

function createTray() {
    const icon = nativeImage.createFromPath(join(__dirname, '../../../src/assets/img/logo-32x32.ico'))
    const tray = new Tray(icon)

    const item: any = [
        { label: '1' },
        { type: 'separator' },
        { label: 'Quit', click: () => app.exit() }
    ]
    const contextMenu = Menu.buildFromTemplate(item)

    tray.setContextMenu(contextMenu)
}

app.whenReady().then(() => {
    createWindow()
    createTray()

    ipcMain.on('quit', () => app.quit())
    ipcMain.on('relaunch', () => {
        app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
        app.exit(0)
    })
    ipcMain.on('minimize', () => {
        const win = BrowserWindow.getFocusedWindow()
        if (win) win.minimize()
        else app.hide()
    })
    ipcMain.on('maximize', () => {
        const win = BrowserWindow.getFocusedWindow()
        if (win) {
            if (win.isMaximized()) win.unmaximize()
            else win.maximize()
        }
    })
    let currentMode = 'nvm-windows'

    ipcMain.on('checkAvailableModes', async (evt) => {
        let modes: string[] = []
        if (process.platform === 'win32') {
            try {
                await new Promise<void>((resolve, reject) => {
                    const cmd = spawn('nvm', ['version'], { shell: true })
                    cmd.on('close', code => code === 0 ? resolve() : reject())
                    cmd.on('error', () => reject())
                })
                modes.push('nvm-windows')
            } catch (e) {}

            try {
                await new Promise<void>((resolve, reject) => {
                    const bashCmd = 'source ~/.bash_profile 2>/dev/null || true; source ~/.bashrc 2>/dev/null || true; source ~/.nvm/nvm.sh 2>/dev/null || true; nvm --version'
                    const cmd = spawn('bash', ['-c', bashCmd], { shell: false })
                    cmd.on('close', code => code === 0 ? resolve() : reject())
                    cmd.on('error', () => reject())
                })
                modes.push('nvm-sh')
            } catch (e) {}
        } else {
            modes.push('nvm-sh')
        }
        evt.reply('availableModes', modes)
    })

    ipcMain.on('setMode', (evt, mode) => {
        currentMode = mode
    })

    ipcMain.on('runCommand', (evt: any, param: any) => {
        let result: string [] = []


        if (process.platform === 'darwin') {
            for (let i = 0; i < 10; i++) {
                result.push(`v21.4.0`)
            }
            evt.reply('resCommand', { result, os: process.platform })
            return
        }

        // Sanitize arguments to prevent shell injection since we might use shell: true
        const safeArgs = param.args.map((a: string) => a.replace(/[^a-zA-Z0-9.\-=]/g, ''))
        let isFallback = false

        const runCommand = (executable: string, args: string[], useShell: boolean) => {
            const cmd = spawn(executable, args, { shell: useShell })
            let stderrData = ''
            let stdoutData = ''

            const handleFallback = () => {
                if (!isFallback && executable === 'nvm') {
                    isFallback = true
                    result = []
                    
                    let fallbackArgs = [...safeArgs]
                    if (fallbackArgs[0] === 'use') {
                        fallbackArgs = ['alias', 'default', fallbackArgs[1]]
                    }

                    let bashCmd = `source ~/.bash_profile 2>/dev/null || true; source ~/.bashrc 2>/dev/null || true; source ~/.nvm/nvm.sh 2>/dev/null || true; nvm use default >/dev/null 2>&1; nvm ${fallbackArgs.join(' ')}`
                    if (fallbackArgs[0] === 'ls') {
                        bashCmd += `; echo "---CURRENT---"; cat ~/.nvm/alias/default 2>/dev/null || echo "None"`
                    }

                    evt.reply('streamCommand', { text: `\n> nvm ${fallbackArgs.join(' ')}\n`, type: 'system' })
                    runCommand('bash', ['-c', bashCmd], false)
                    return true
                }
                return false
            }

            if (executable === 'nvm' && currentMode === 'nvm-sh' && !isFallback) {
                handleFallback()
                return
            }


            cmd.on('error', (err) => {
                if (handleFallback()) return;
                
                if (executable !== 'nvm') {
                    evt.reply('resCommand', { result: [`Error: ${err.message}`], os: process.platform, mode: 'Error' })
                }
            })

            cmd.stderr.on('data', data => {
                const msg = String(data)
                if (!msg.includes("'nvm' is not recognized") && !msg.includes("operable program or batch file")) {
                    evt.reply('streamCommand', { text: msg, type: 'error' })
                }
                stderrData += msg
            })

            cmd.stdout.on('data', data => {
                const msg = String(data)
                let type = 'info'
                if (msg.includes('default ->') || msg.includes('Now using node')) {
                    type = 'success'
                }
                evt.reply('streamCommand', { text: msg, type })
                stdoutData += msg
            })

            cmd.on('close', (code) => {
                if (isFallback && executable === 'nvm') return;
                
                result = stdoutData.split('\n')

                if (code !== 0) {
                    if (handleFallback()) return;
                    evt.reply('resCommand', { result: [`Error: exited with ${code}`, stderrData], os: process.platform, mode: 'Error', command: param.args[0] })
                } else {
                    currentMode = isFallback ? 'nvm-sh' : 'nvm-windows'
                    evt.reply('resCommand', { result, os: process.platform, mode: currentMode, command: param.args[0] })
                }
            })
        }

        if (process.platform === 'win32' && safeArgs[0] === 'use' && currentMode !== 'nvm-sh') {
            evt.reply('streamCommand', { text: 'Requesting Administrator permissions to change system symlink...\n', type: 'system' })
            const cmd = `nvm ${safeArgs.join(' ')}`
            sudo.exec(cmd, { name: 'NVM OnTheFly' }, (error, stdout, stderr) => {
                if (stdout) {
                    const msg = String(stdout)
                    evt.reply('streamCommand', { text: msg, type: msg.includes('Now using node') ? 'success' : 'info' })
                }
                if (stderr) evt.reply('streamCommand', { text: String(stderr), type: 'error' })
                if (error) {
                    evt.reply('resCommand', { result: [`Error: ${error.message || error}`], os: process.platform, mode: 'Error', command: safeArgs[0] })
                } else {
                    evt.reply('resCommand', { result: stdout ? String(stdout).split('\n') : [], os: process.platform, mode: 'nvm-windows', command: safeArgs[0] })
                }
            })
        } else {
            runCommand('nvm', safeArgs, process.platform === 'win32')
        }
    })

    ipcMain.on('runNpmCommand', (evt, param) => {
        let isFallback = currentMode === 'nvm-sh'
        
        let stdoutData = ''
        let stderrData = ''
        
        evt.reply('streamCommand', { text: `\n> npm ${param.args.join(' ')}\n`, type: 'system' })

        if (isFallback) {
            const bashCmd = `source ~/.bash_profile 2>/dev/null || true; source ~/.bashrc 2>/dev/null || true; source ~/.nvm/nvm.sh 2>/dev/null || true; npm ${param.args.join(' ')}`
            const cmd = spawn('bash', ['-c', bashCmd], { shell: false })
            cmd.stdout.on('data', d => {
                const msg = String(d)
                stdoutData += msg
                evt.reply('streamCommand', { text: msg, type: 'info' })
            })
            cmd.stderr.on('data', d => {
                const msg = String(d)
                stderrData += msg
                evt.reply('streamCommand', { text: msg, type: 'error' })
            })
            cmd.on('close', code => {
                evt.reply('resNpmCommand', { result: stdoutData, error: stderrData })
            })
        } else {
            const cmd = spawn('npm', param.args, { shell: true })
            cmd.stdout.on('data', d => {
                const msg = String(d)
                stdoutData += msg
                evt.reply('streamCommand', { text: msg, type: 'info' })
            })
            cmd.stderr.on('data', d => {
                const msg = String(d)
                stderrData += msg
                evt.reply('streamCommand', { text: msg, type: 'error' })
            })
            cmd.on('close', code => {
                evt.reply('resNpmCommand', { result: stdoutData, error: stderrData })
            })
        }
    })

    ipcMain.on('setConfig', (_, config) => {
        setSchema({ config })
    })

    ipcMain.on('showNotification', (_, param) => new Notification(param).show())
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
