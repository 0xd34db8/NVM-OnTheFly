import { create } from 'zustand'

export type Mode = 'nvm-windows' | 'nvm-sh' | 'Error'

export interface NodeVersion {
  version: string
  isActive: boolean
}

export interface InstalledNode {
  version: string
  isActive: boolean
}

export interface NpmPackage {
  name: string
  version: string
}

interface NvmState {
  modes: Mode[]
  currentMode: Mode | null
  installedData: NodeVersion[]
  remoteData: any[]
  globalPackages: NpmPackage[]
  isFetching: boolean
  isFetchingPackages: boolean
  hasFetchedPackages: boolean
  logs: { msg: string; type: string }[]
  theme: 'light' | 'dark'
  showTerminalOnVersions: boolean
  showTerminalOnPackages: boolean
  fetchState: () => Promise<void>
  fetchRemoteData: () => Promise<void>
  fetchPackages: () => Promise<void>
  setMode: (mode: Mode) => void
  setGlobalPackages: (packages: NpmPackage[]) => void
  addLog: (log: { msg: string; type: string }) => void
  clearLogs: () => void
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setShowTerminalOnVersions: (show: boolean) => void
  setShowTerminalOnPackages: (show: boolean) => void
}

export const useNvmStore = create<NvmState>((set, get) => ({
  modes: [],
  currentMode: null,
  installedData: [],
  remoteData: [],
  globalPackages: [],
  isFetching: false,
  isFetchingPackages: false,
  hasFetchedPackages: false,
  logs: [],
  theme: (localStorage.getItem('nvm-theme') as 'light' | 'dark') || 'dark',
  showTerminalOnVersions: localStorage.getItem('show-terminal-versions') !== 'false',
  showTerminalOnPackages: localStorage.getItem('show-terminal-packages') !== 'false',

  fetchState: async () => {
    set({ isFetching: true })
    try {
      let modes = get().modes
      if (modes.length === 0) {
        modes = await window.nvmAPI.checkAvailableModes()
      }
      // getMode is mostly a fallback now, getInstalledData gives the real execution mode
      const result = await window.nvmAPI.getInstalledData()
      set({ modes, currentMode: result.mode, installedData: result.nodes, isFetching: false, hasFetchedPackages: false })
    } catch (e) {
      console.error('Failed to fetch NVM state', e)
      set({ isFetching: false })
    }
  },

  fetchRemoteData: async () => {
    try {
      const remoteData = await window.nvmAPI.getRemoteData()
      set({ remoteData })
    } catch (e) {
      console.error('Failed to fetch remote Node data', e)
    }
  },

  fetchPackages: async () => {
    set({ isFetchingPackages: true })
    try {
      const res = await window.nvmAPI.runNpmCommand(['ls', '-g', '--depth=0'])
      const parsed: NpmPackage[] = []
      // eslint-disable-next-line no-control-regex
      const cleanResult = res.result.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').replace(/\r/g, '')
      const lines = cleanResult.split('\n')
      
      for (const line of lines) {
        if (line.includes('-- ') || line.includes('├── ') || line.includes('└── ')) {
          const clean = line.replace(/.*(?:-- |├── |└── )/, '').trim()
          if (clean && clean !== 'empty') {
            const parts = clean.split('@')
            if (parts.length >= 2) {
              const name = parts.slice(0, -1).join('@')
              const version = parts[parts.length - 1].split(' ')[0]
              parsed.push({ name, version })
            }
          }
        }
      }
      set({ globalPackages: parsed.filter(p => p.name !== 'npm' && p.name !== 'corepack'), hasFetchedPackages: true })
    } catch (e) {
      console.error('Failed to fetch global packages', e)
    }
    set({ isFetchingPackages: false })
  },

  setMode: async (mode) => {
    window.nvmAPI.setMode(mode)
    set({ currentMode: mode })
    // Re-fetch data for the new mode
    get().fetchState()
  },

  setGlobalPackages: (packages) => set({ globalPackages: packages }),

  addLog: (log) => {
    set((state) => ({ logs: [...state.logs, log] }))
  },

  clearLogs: () => set({ logs: [] }),
  
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('nvm-theme', newTheme)
    set({ theme: newTheme })
  },
  
  setTheme: (theme) => {
    localStorage.setItem('nvm-theme', theme)
    set({ theme })
  },
  
  setShowTerminalOnVersions: (show) => {
    localStorage.setItem('show-terminal-versions', String(show))
    set({ showTerminalOnVersions: show })
  },
  
  setShowTerminalOnPackages: (show) => {
    localStorage.setItem('show-terminal-packages', String(show))
    set({ showTerminalOnPackages: show })
  }
}))

// Setup listeners for stream logs and system changes
if (typeof window !== 'undefined' && window.nvmAPI) {
  window.nvmAPI.onStream((data) => {
    const cleanMsg = data.msg
      // eslint-disable-next-line no-control-regex
      .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
    useNvmStore.getState().addLog({ msg: cleanMsg, type: data.type })
    
    // Fast state update based on stream output to make UI feel instant
    const lines = cleanMsg.split('\n')
    let foundNewVersion = false
    const currentInstalled = [...useNvmStore.getState().installedData]
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue
      
      // Active version detection
      if (trimmedLine.startsWith('default ->') || trimmedLine.startsWith('Now using node')) {
        const match = trimmedLine.match(/v?\d+\.\d+\.\d+/)
        if (match) {
          const version = match[0].startsWith('v') ? match[0] : `v${match[0]}`
          currentInstalled.forEach(v => v.isActive = v.version === version)
          foundNewVersion = true
        }
      } 
      // Installed nodes detection
      else if (trimmedLine.startsWith('->') || trimmedLine.startsWith('*') || /^\s*v?\d+\.\d+\.\d+/.test(line)) {
        const match = trimmedLine.match(/\d+\.\d+\.\d+/)
        if (match) {
          const version = `v${match[0]}`
          const isActive = trimmedLine.startsWith('->') || trimmedLine.startsWith('*')
          
          if (isActive) {
            currentInstalled.forEach(v => v.isActive = false)
          }
          
          const existing = currentInstalled.find(v => v.version === version)
          if (existing) {
            if (isActive && !existing.isActive) {
              existing.isActive = true
              foundNewVersion = true
            }
          } else {
            // It's a new version we haven't seen yet in the stream
            // Skip remote versions which are listed with aliases
            if (trimmedLine.includes('->') && !trimmedLine.startsWith('->')) continue
            
            currentInstalled.push({
              version,
              isActive
            })
            foundNewVersion = true
          }
        }
      }
    }
    
    if (foundNewVersion) {
      useNvmStore.setState({ installedData: currentInstalled })
    }
  })
}
