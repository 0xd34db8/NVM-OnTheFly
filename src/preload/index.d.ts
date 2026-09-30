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
      detectProjectVersion: (dirPath: string) => Promise<{ requiredVersion: string | null; source: string | null; dependencies: { name: string, version: string, size?: number, isDev: boolean }[] }>
      openDirectory: () => Promise<string | null>
      cancelInstall: () => Promise<void>
      runNpmCommand: (args: string[]) => Promise<{ result: string; error: string; code: number | null }>
      listAliases: () => Promise<{ name: string, version: string }[]>
      setAlias: (name: string, version: string) => Promise<boolean>
      deleteAlias: (name: string) => Promise<boolean>
      checkOutdatedPackages: () => Promise<Record<string, { current: string, wanted: string, latest: string, location: string }>>
      cleanNpmCache: () => Promise<{ result: string; error: string; code: number | null }>
      runCustomCommand: (command: string) => Promise<{ result: string; error: string; code: number | null }>
      getGlobalPackagesSizes: (packages: string[]) => Promise<Record<string, number>>
      getNodeSizes: (type: 'installed' | 'download', versions: string[]) => Promise<Record<string, number>>
      onStream: (callback: (data: { msg: string; type: string }) => void) => void
      removeStreamListener: () => void
      onRefreshRequested: (callback: () => void) => void
      removeRefreshListener: () => void
    }
  }
}
