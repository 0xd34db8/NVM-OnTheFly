import { spawn, exec, ChildProcess } from 'node:child_process'
import * as sudo from '@vscode/sudo-prompt'
import { join } from 'node:path'

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

export type Mode = 'nvm-windows' | 'nvm-sh' | 'Error'

let currentMode: Mode = 'nvm-windows'

export async function checkAvailableModes(): Promise<Mode[]> {
    let modes: Mode[] = []
    if (process.platform === 'win32') {
        try {
            await new Promise<void>((resolve, reject) => {
                const cmd = spawn('nvm version', { shell: true })
                cmd.on('exit', code => code === 0 ? resolve() : reject())
                cmd.on('error', () => reject())
            })
            modes.push('nvm-windows')
        } catch (_e) {}

        try {
            await new Promise<void>((resolve, reject) => {
                const bashCmd = 'source ~/.bash_profile 2>/dev/null || true; source ~/.bashrc 2>/dev/null || true; source ~/.nvm/nvm.sh 2>/dev/null || true; nvm --version'
                const cmd = spawn('bash', ['-c', bashCmd], { shell: false })
                cmd.on('exit', code => code === 0 ? resolve() : reject())
                cmd.on('error', () => reject())
            })
            modes.push('nvm-sh')
        } catch (_e) {}
    } else {
        modes.push('nvm-sh')
    }
    
    if (modes.length > 0) {
        currentMode = modes[0]
    }
    
    return modes
}

export function setMode(mode: Mode) {
    currentMode = mode
}

export function getMode() {
    return currentMode
}

export interface NvmCommandResult {
    result: string[]
    os: string
    mode: Mode
    command: string
}

let activeInstallProcess: ChildProcess | null = null;

export function cancelInstallProcess() {
    if (activeInstallProcess && activeInstallProcess.pid) {
        if (process.platform === 'win32') {
            exec(`taskkill /pid ${activeInstallProcess.pid} /f /t`);
        } else {
            activeInstallProcess.kill('SIGKILL');
        }
        activeInstallProcess = null;
    }
}

export function runCommand(args: string[], onStream?: (msg: string, type: string) => void): Promise<NvmCommandResult> {
    return new Promise((resolve) => {
        let result: string[] = []
        if (onStream) onStream(`\n> nvm ${args.join(' ')}\n`, 'system')

        if (process.platform === 'darwin') {
            for (let i = 0; i < 10; i++) {
                result.push(`v21.4.0`)
            }
            resolve({ result, os: process.platform, mode: currentMode, command: args[0] })
            return
        }

        const safeArgs = args.map(a => a.replace(/[^a-zA-Z0-9.\-=]/g, ''))
        let isFallback = false

        const executeCmd = (executable: string, cmdArgs: string[], useShell: boolean) => {
            const cmd = useShell ? spawn(`${executable} ${cmdArgs.join(' ')}`, { shell: true }) : spawn(executable, cmdArgs, { shell: false })
            if (args[0] === 'install') {
                activeInstallProcess = cmd;
            }
            let stderrData = ''
            let stdoutData = ''

            const handleFallback = () => {
                if (!isFallback && executable === 'nvm') {
                    isFallback = true
                    result = []
                    
                    let fallbackArgs = [...safeArgs]
                    if (fallbackArgs[0] === 'use') {
                        fallbackArgs = ['alias', 'default', fallbackArgs[1]]
                    } else if (fallbackArgs[0] === 'ls' && !fallbackArgs.includes('--no-alias')) {
                        fallbackArgs.push('--no-alias')
                    }

                    let bashCmd = `source ~/.bash_profile 2>/dev/null || true; source ~/.bashrc 2>/dev/null || true; source ~/.nvm/nvm.sh 2>/dev/null || true; nvm use default >/dev/null 2>&1; nvm ${fallbackArgs.join(' ')}`
                    if (fallbackArgs[0] === 'ls') {
                        bashCmd += `; echo "---CURRENT---"; cat ~/.nvm/alias/default 2>/dev/null || echo "None"`
                    }

                    executeCmd('bash', ['-c', bashCmd], false)
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
                    resolve({ result: [`Error: ${err.message}`], os: process.platform, mode: 'Error', command: args[0] })
                }
            })

            cmd.stderr.on('data', data => {
                const msg = String(data)
                if (!msg.includes("'nvm' is not recognized") && !msg.includes("operable program or batch file")) {
                    if (onStream) onStream(msg, 'error')
                }
                stderrData += msg
            })

            cmd.stdout.on('data', data => {
                const msg = String(data)
                let type = 'info'
                if (msg.includes('default ->') || msg.includes('Now using node')) {
                    type = 'success'
                }
                if (onStream) onStream(msg, type)
                stdoutData += msg
            })

            cmd.on('exit', (code) => {
                if (args[0] === 'install' && activeInstallProcess === cmd) {
                    activeInstallProcess = null;
                }
                if (isFallback && executable === 'nvm') return;
                
                result = stdoutData.split('\n')

                if (code !== 0) {
                    if (handleFallback()) return;
                    resolve({ result: [`Error: exited with ${code}`, stderrData], os: process.platform, mode: 'Error', command: args[0] })
                } else {
                    currentMode = isFallback ? 'nvm-sh' : 'nvm-windows'
                    resolve({ result, os: process.platform, mode: currentMode, command: args[0] })
                }
            })
        }

        if (process.platform === 'win32' && safeArgs[0] === 'use' && currentMode !== 'nvm-sh') {
            if (onStream) onStream('Requesting Administrator permissions to change system symlink...\n', 'system')
            const cmdStr = `nvm ${safeArgs.join(' ')}`
            sudo.exec(cmdStr, { name: 'NVM OnTheFly' }, (error, stdout, stderr) => {
                if (stdout) {
                    const msg = String(stdout)
                    if (onStream) onStream(msg, msg.includes('Now using node') ? 'success' : 'info')
                }
                if (stderr && onStream) onStream(String(stderr), 'error')
                
                if (error) {
                    resolve({ result: [`Error: ${error.message || error}`], os: process.platform, mode: 'Error', command: safeArgs[0] })
                } else {
                    resolve({ result: stdout ? String(stdout).split('\n') : [], os: process.platform, mode: 'nvm-windows', command: safeArgs[0] })
                }
            })
        } else {
            executeCmd('nvm', safeArgs, process.platform === 'win32')
        }
    })
}

export interface InstalledNode {
    version: string
    isActive: boolean
}

export async function getInstalledData(onStream?: (msg: string, type: string) => void): Promise<{ nodes: InstalledNode[], mode: Mode }> {
    const args = currentMode === 'nvm-sh' ? ['ls', '--no-alias'] : ['ls']
    const res = await runCommand(args, onStream)
    
    if (res.os === 'darwin') {
         return { nodes: [], mode: res.mode }
    }

    let activeVersion = ''
    
    for (let i = 0; i < res.result.length; i++) {
        const line = res.result[i]
        // eslint-disable-next-line no-control-regex
        const cleanLine = line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim()
        
        if (res.mode === 'nvm-windows') {
            if (cleanLine.startsWith('*')) {
                const match = cleanLine.match(/\d+\.\d+\.\d+/)
                if (match) activeVersion = `v${match[0]}`
            }
        } else {
            if (cleanLine.startsWith('default ->')) {
                const matches = cleanLine.match(/\d+\.\d+\.\d+/g)
                if (matches && matches.length > 0) {
                    activeVersion = `v${matches[matches.length - 1]}`
                }
            }
            if (cleanLine === '---CURRENT---') {
                // eslint-disable-next-line no-control-regex
                const nextLine = res.result[i + 1]?.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim()
                if (nextLine) {
                    const match = nextLine.match(/\d+\.\d+\.\d+/)
                    if (match) {
                        activeVersion = `v${match[0]}`
                    }
                }
            }
        }
    }

    const installedNodes: InstalledNode[] = []

    for (let i = 0; i < res.result.length; i++) {
        const line = res.result[i]
        // eslint-disable-next-line no-control-regex
        const cleanLine = line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim()
        
        if (cleanLine !== '') {
            if (cleanLine.includes('->') && !cleanLine.startsWith('->')) continue

            const matches = cleanLine.match(/\d+\.\d+\.\d+/)
            if (!matches) continue

            const version = `v${matches[0]}`

            if (installedNodes.some(d => d.version === version)) continue

            installedNodes.push({
                version,
                isActive: version === activeVersion
            })
        }
    }
    
    return { nodes: installedNodes, mode: res.mode }
}

export async function getDownloadData(): Promise<any[]> {
    try {
        const res = await fetch('https://nodejs.org/dist/index.json')
        return await res.json()
    } catch (_e) {
        return []
    }
}

export async function getPackagesForVersion(version: string): Promise<string[]> {
    try {
        let packagesPath = ''
        if (currentMode === 'nvm-windows') {
            const appDataNvm = process.env.APPDATA ? join(process.env.APPDATA, 'nvm') : ''
            if (appDataNvm) {
                packagesPath = join(appDataNvm, version, 'node_modules')
            }
        } else {
            // nvm-sh
            const home = process.env.HOME || process.env.USERPROFILE || ''
            if (process.platform === 'win32') {
                packagesPath = join(home, '.nvm', 'versions', 'node', version, 'bin', 'node_modules')
            } else {
                packagesPath = join(home, '.nvm', 'versions', 'node', version, 'lib', 'node_modules')
            }
        }
        
        if (packagesPath) {
            const fs = require('node:fs')
            if (fs.existsSync(packagesPath)) {
                const dirs = fs.readdirSync(packagesPath, { withFileTypes: true })
                return dirs
                    .filter((dirent: any) => dirent.isDirectory() && dirent.name !== 'npm' && dirent.name !== 'corepack')
                    .map((dirent: any) => dirent.name)
            }
        }
    } catch (_e) {}
    return []
}

export async function installVersion(version: string, onStream?: (msg: string, type: string) => void): Promise<boolean> {
    const res = await runCommand(['install', version], onStream)
    return res.mode !== 'Error'
}

export async function installEngine(engine: string, onStream?: (msg: string, type: string) => void): Promise<boolean> {
    return new Promise((resolve) => {
        if (engine === 'nvm-windows') {
            if (onStream) onStream('Downloading nvm-windows setup...\n', 'info')
            // Using PowerShell to download and run the setup
            const psCmd = `Invoke-WebRequest -Uri "https://github.com/coreybutler/nvm-windows/releases/download/1.1.12/nvm-setup.exe" -OutFile "$env:TEMP\\nvm-setup.exe"; Start-Process -FilePath "$env:TEMP\\nvm-setup.exe" -Wait`
            const cmd = spawn('powershell.exe', ['-Command', psCmd], { shell: false })
            cmd.stdout.on('data', d => { if (onStream) onStream(String(d), 'info') })
            cmd.stderr.on('data', d => { if (onStream) onStream(String(d), 'error') })
            cmd.on('exit', (code) => {
                resolve(code === 0)
            })
        } else if (engine === 'nvm-sh') {
            if (onStream) onStream('Downloading and installing nvm-sh...\n', 'info')
            const bashCmd = 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash'
            // For Windows we might need to run this in Git Bash if available
            const execCmd = process.platform === 'win32' ? 'bash' : 'bash' 
            const cmd = spawn(execCmd, ['-c', bashCmd], { shell: false })
            cmd.stdout.on('data', d => { if (onStream) onStream(String(d), 'info') })
            cmd.stderr.on('data', d => { if (onStream) onStream(String(d), 'error') })
            cmd.on('exit', (code) => {
                resolve(code === 0)
            })
            cmd.on('error', (err) => {
                if (onStream) onStream(`Failed to start bash: ${err.message}\n`, 'error')
                resolve(false)
            })
        } else {
            resolve(false)
        }
    })
}

export async function uninstallVersion(version: string, onStream?: (msg: string, type: string) => void): Promise<boolean> {
    const res = await runCommand(['uninstall', version], onStream)
    return res.mode !== 'Error'
}

export async function useVersion(version: string, onStream?: (msg: string, type: string) => void): Promise<boolean> {
    const res = await runCommand(['use', version], onStream)
    return res.mode !== 'Error'
}

export async function migratePackages(version: string, fromVersion: string, packages?: string[], onStream?: (msg: string, type: string) => void): Promise<boolean> {
    if (!packages || packages.length === 0) {
        const res = await runCommand(['install', version, `--reinstall-packages-from=${fromVersion}`], onStream)
        return res.mode !== 'Error'
    } else {
        // partial migration
        const installRes = await runCommand(['install', version], onStream)
        if (installRes.mode === 'Error') return false
        
        if (currentMode === 'nvm-windows') {
            const appDataNvm = process.env.APPDATA ? join(process.env.APPDATA, 'nvm') : ''
            const npmPath = join(appDataNvm, version, 'npm.cmd')
            const fs = require('node:fs')
            if (fs.existsSync(npmPath)) {
                if (onStream) onStream(`\n> npm install -g ${packages.join(' ')}\n`, 'system')
                await new Promise<void>(resolve => {
                    const cmd = spawn(`"${npmPath}" install -g ${packages.join(' ')}`, { shell: true })
                    cmd.stdout.on('data', d => { if (onStream) onStream(String(d), 'info') })
                    cmd.stderr.on('data', d => { if (onStream) onStream(String(d), 'error') })
                    cmd.on('exit', () => resolve())
                })
            }
        } else {
            const bashCmd = `source ~/.bash_profile 2>/dev/null || true; source ~/.bashrc 2>/dev/null || true; source ~/.nvm/nvm.sh 2>/dev/null || true; nvm use ${version}; npm install -g ${packages.join(' ')}`
            if (onStream) onStream(`\n> npm install -g ${packages.join(' ')}\n`, 'system')
            await new Promise<void>(resolve => {
                const cmd = spawn('bash', ['-c', bashCmd], { shell: false })
                cmd.stdout.on('data', d => { if (onStream) onStream(String(d), 'info') })
                cmd.stderr.on('data', d => { if (onStream) onStream(String(d), 'error') })
                cmd.on('exit', () => resolve())
            })
        }
        return true
    }
}

export function runNpmCommand(args: string[], onStream?: (msg: string, type: string) => void): Promise<{ result: string, error: string, code: number | null }> {
    return new Promise((resolve) => {
        let isFallback = currentMode === 'nvm-sh'
        
        let stdoutData = ''
        let stderrData = ''
        
        if (onStream) onStream(`\n> npm ${args.join(' ')}\n`, 'system')

        if (isFallback) {
            const bashCmd = `source ~/.bash_profile 2>/dev/null || true; source ~/.bashrc 2>/dev/null || true; source ~/.nvm/nvm.sh 2>/dev/null || true; npm ${args.join(' ')}`
            const cmd = spawn('bash', ['-c', bashCmd], { shell: false })
            cmd.stdout.on('data', d => {
                const msg = String(d)
                stdoutData += msg
                if (onStream) onStream(msg, 'info')
            })
            cmd.stderr.on('data', d => {
                const msg = String(d)
                stderrData += msg
                if (onStream) onStream(msg, 'error')
            })
            cmd.on('error', (err) => {
                resolve({ result: '', error: err.message, code: null })
            })
            cmd.on('exit', (code) => {
                resolve({ result: stdoutData, error: stderrData, code })
            })
        } else {
            // On Windows, if we just spawn 'npm', it might use a cached PATH resolution or C:\\Program Files\\nodejs\\npm.cmd
            // which might still point to the old version in the current process if the symlink change hasn't fully propagated to the env.
            // We can explicitly run the npm.cmd from the active version folder.
            let npmExecutable = 'npm'
            
            // Immediately execute an async IIFE to find the active version and spawn
            ;(async () => {
                if (process.platform === 'win32') {
                    try {
                        const installed = await getInstalledData()
                        const active = installed.nodes.find(n => n.isActive)
                        if (active) {
                            const appDataNvm = process.env.APPDATA ? join(process.env.APPDATA, 'nvm') : ''
                            if (appDataNvm) {
                                const npmPath = join(appDataNvm, active.version, 'npm.cmd')
                                const fs = require('node:fs')
                                if (fs.existsSync(npmPath)) {
                                    npmExecutable = `"${npmPath}"`
                                }
                            }
                        }
                    } catch (_e) {
                        // ignore error and fallback to 'npm'
                    }
                }
                
                const cmdStr = `${npmExecutable} ${args.join(' ')}`
                const cmd = spawn(cmdStr, { shell: true })
                cmd.stdout.on('data', d => {
                    const msg = String(d)
                    stdoutData += msg
                    if (onStream) onStream(msg, 'info')
                })
                cmd.stderr.on('data', d => {
                    const msg = String(d)
                    stderrData += msg
                    if (onStream) onStream(msg, 'error')
                })
                cmd.on('error', (err) => {
                    resolve({ result: '', error: err.message, code: null })
                })
                cmd.on('exit', (code) => {
                    resolve({ result: stdoutData, error: stderrData, code })
                })
            })();
        }
    })
}


export async function getAliases(): Promise<{ name: string, version: string }[]> {
    if (currentMode === 'nvm-sh') {
        const res = await runCommand(['alias'])
        const aliases: { name: string, version: string }[] = []
        for (const line of res.result) {
            // eslint-disable-next-line no-control-regex
            const cleanLine = line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim()
            if (cleanLine && cleanLine.includes('->')) {
                const parts = cleanLine.split('->')
                const name = parts[0].trim()
                let version = parts[1].trim()
                if (version.includes(' ')) {
                    version = version.split(' ')[0]
                }
                aliases.push({ name, version })
            }
        }
        return aliases
    } else {
        // nvm-windows does not natively support listing custom aliases easily, or maybe it doesn't have custom aliases.
        // For fallback, we will just return empty or read from a local file if needed.
        // We can just rely on app-level aliases for nvm-windows if requested.
        return []
    }
}

export async function setAlias(name: string, version: string): Promise<boolean> {
    const res = await runCommand(['alias', name, version])
    return res.result.some(line => line.toLowerCase().includes('default') || line.toLowerCase().includes('alias'))
}

export async function deleteAlias(name: string): Promise<boolean> {
    const res = await runCommand(['unalias', name])
    return res.result.some(line => line.toLowerCase().includes('deleted')) || true
}
