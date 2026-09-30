type Mode = 'nvm-windows' | 'nvm-sh' | 'Error'

interface InstalledNode {
  version: string
  isActive: boolean
}
declare global {
  interface Window {
    context: {
      windowMinimize: () => void
      windowMaximize: () => void
      windowClose: () => void
    }
    nvmAPI: {
      checkAvailableModes: () => Promise<Mode[]>
      getMode: () => Promise<Mode>
      setMode: (mode: Mode) => void
      getInstalledData: () => Promise<InstalledNode[]>
      getDownloadData: () => Promise<any[]>
      installVersion: (version: string) => Promise<boolean>
      uninstallVersion: (version: string) => Promise<boolean>
      useVersion: (version: string) => Promise<boolean>
      migratePackages: (version: string, fromVersion: string, packages?: string[]) => Promise<boolean>
      getPackagesForVersion: (version: string) => Promise<string[]>
      cancelInstall: () => Promise<void>
      runNpmCommand: (args: string[]) => Promise<{ result: string; error: string; code: number | null }>
      runCustomCommand: (command: string) => Promise<{ result: string; error: string; code: number | null }>
      getGlobalPackagesSizes: (packages: string[]) => Promise<Record<string, number>>
      getNodeSizes: (type: 'installed' | 'download', versions: string[]) => Promise<Record<string, number>>
      onStream: (callback: (data: { msg: string; type: string }) => void) => void
      removeStreamListener: () => void
    }
  }
}
