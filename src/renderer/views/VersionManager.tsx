import { useState, useEffect } from 'react'
import { useNvmStore } from '../store/nvmStore'
import { Download, Trash2, Play, RefreshCw, Search, Terminal, X } from 'lucide-react'
import Preloader from '../components/Preloader'
import TerminalConsole from './TerminalConsole'
import ConfirmDialog from '../components/ConfirmDialog'

export default function VersionManager() {
  const { installedData, remoteData, isFetching, fetchState, fetchRemoteData, showTerminalOnVersions, addLog } = useNvmStore()
  const [tab, setTab] = useState<'installed' | 'remote'>('installed')
  const [search, setSearch] = useState('')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)
  const [installedPage, setInstalledPage] = useState(1)
  const [remotePage, setRemotePage] = useState(1)
  const pageSize = 10

  // Reset pagination when searching
  useEffect(() => {
    setInstalledPage(1)
    setRemotePage(1)
  }, [search, tab])



  const handleUse = async (version: string) => {
    setLoadingAction(`use-${version}`)
    try {
      const success = await window.nvmAPI.useVersion(version)
      if (!success) throw new Error('NVM command exited with an error.')
      // We don't need to run nvm ls (fetchState) because the stream parser 
      // instantly updates the active version in the UI. 
      // We only need to reset packages so they refetch on the next tab visit.
      useNvmStore.setState({ hasFetchedPackages: false })
    } catch (e: any) {
      addLog({ msg: `Failed to use version ${version}: ${e.message}`, type: 'error' })
      setIsTerminalOpen(true)
    } finally {
      setLoadingAction(null)
    }
  }

  const [migratingVersion, setMigratingVersion] = useState<string | null>(null)
  const [migrationSource, setMigrationSource] = useState<string>('none')

  const handleInstall = async (version: string) => {
    if (installedData.length > 0) {
      setMigratingVersion(version)
    } else {
      executeInstall(version, 'none')
    }
  }

  const executeInstall = async (version: string, source: string) => {
    setLoadingAction(`install-${version}`)
    setMigratingVersion(null)
    try {
      let success = false
      if (source === 'none') {
        success = await window.nvmAPI.installVersion(version)
      } else {
        success = await window.nvmAPI.migratePackages(version, source)
      }
      if (!success) throw new Error('NVM command exited with an error.')
      await fetchState()
    } catch (e: any) {
      addLog({ msg: `Failed to install version ${version}: ${e.message}`, type: 'error' })
      setIsTerminalOpen(true)
    } finally {
      setLoadingAction(null)
    }
  }

  const [uninstallingVersion, setUninstallingVersion] = useState<string | null>(null)

  const handleUninstall = (version: string) => {
    setUninstallingVersion(version)
  }

  const executeUninstall = async () => {
    if (!uninstallingVersion) return
    const version = uninstallingVersion
    setUninstallingVersion(null)
    setLoadingAction(`uninstall-${version}`)
    try {
      const success = await window.nvmAPI.uninstallVersion(version)
      if (!success) throw new Error('NVM command exited with an error.')
      await fetchState()
    } catch (e: any) {
      addLog({ msg: `Failed to uninstall version ${version}: ${e.message}`, type: 'error' })
      setIsTerminalOpen(true)
    } finally {
      setLoadingAction(null)
    }
  }

  const filteredInstalled = installedData.filter(v => v.version.includes(search))
  const paginatedInstalled = filteredInstalled.slice((installedPage - 1) * pageSize, installedPage * pageSize)
  const totalInstalledPages = Math.max(1, Math.ceil(filteredInstalled.length / pageSize))

  const filteredRemote = remoteData.filter(v => v.version.includes(search))
  const paginatedRemote = filteredRemote.slice((remotePage - 1) * pageSize, remotePage * pageSize)
  const totalRemotePages = Math.max(1, Math.ceil(filteredRemote.length / pageSize))

  return (
    <div className="relative flex flex-col h-full bg-card rounded-lg border border-border shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('installed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'installed'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'hover:bg-secondary text-muted-foreground'
              }`}
          >
            Installed
          </button>
          <button
            onClick={() => setTab('remote')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'remote'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'hover:bg-secondary text-muted-foreground'
              }`}
          >
            Download
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setLoadingAction('refresh')
              await fetchState()
              await fetchRemoteData()
              setLoadingAction(null)
            }}
            disabled={isFetching || loadingAction !== null}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-4xl hover:bg-secondary/80 transition-colors h-[38px]"
          >
            {isFetching || loadingAction === 'refresh' ? <Preloader /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search By Version"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-background border border-border rounded-4xl text-sm focus:outline-none focus:ring-2 focus:ring-primary w-50 h-[38px]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 sticky top-0 backdrop-blur-md">
            <tr>
              <th className="px-6 py-3 font-medium text-muted-foreground w-1/3">Version</th>
              <th className="px-6 py-3 font-medium text-muted-foreground w-1/3">Release Date</th>
              <th className="px-6 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tab === 'installed' && filteredInstalled.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                  {isFetching || loadingAction === 'refresh' ? (
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="text-primary scale-150"><Preloader /></div>
                      <p>Loading installed versions...</p>
                    </div>
                  ) : (
                    "No installed versions found. Click Refresh to load versions."
                  )}
                </td>
              </tr>
            )}

            {tab === 'installed' && paginatedInstalled.map(node => (
              <tr key={node.version} className={`transition-colors hover:bg-muted/30 ${node.isActive ? 'bg-primary/5' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${node.isActive ? 'text-primary' : ''}`}>
                      {node.version}
                    </span>
                    {node.isActive && (
                      <span className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                        Active
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {/* Local nodes don't easily have release date unless joined with remote data */}
                  {remoteData.find(r => r.version === node.version)?.date || 'Unknown'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleUse(node.version)}
                      disabled={node.isActive || loadingAction !== null}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${node.isActive
                        ? 'opacity-50 cursor-not-allowed bg-secondary'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                    >
                      {loadingAction === `use-${node.version}` ? <Preloader /> : <Play className="w-3.5 h-3.5" />}
                      Use
                    </button>
                    <button
                      onClick={() => handleUninstall(node.version)}
                      disabled={node.isActive || loadingAction !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingAction === `uninstall-${node.version}` ? <Preloader /> : <Trash2 className="w-3.5 h-3.5" />}
                      Uninstall
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {tab === 'remote' && filteredRemote.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                  {isFetching || loadingAction === 'refresh' ? (
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="text-primary scale-150"><Preloader /></div>
                      <p>Loading remote versions...</p>
                    </div>
                  ) : (
                    "No remote versions found. Click Refresh to load versions."
                  )}
                </td>
              </tr>
            )}

            {tab === 'remote' && paginatedRemote.map(node => {
              const isInstalled = installedData.some(i => i.version === node.version)
              return (
                <tr key={node.version} className="transition-colors hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium">{node.version}</td>
                  <td className="px-6 py-4 text-muted-foreground">{node.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleInstall(node.version)}
                      disabled={isInstalled || loadingAction !== null || isFetching}
                      className={`flex ml-auto items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${isInstalled || isFetching || loadingAction !== null
                        ? 'bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed'
                        : 'bg-brand text-white bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                      {loadingAction === `install-${node.version}` ? <Preloader /> : <Download className="w-3.5 h-3.5" />}
                      {isInstalled ? 'Installed' : 'Install'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {tab === 'installed' && filteredInstalled.length > pageSize && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border sticky bottom-0 bg-background">
            <span className="text-sm text-muted-foreground">
              Showing {(installedPage - 1) * pageSize + 1} to {Math.min(installedPage * pageSize, filteredInstalled.length)} of {filteredInstalled.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setInstalledPage(p => Math.max(1, p - 1))}
                disabled={installedPage === 1}
                className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 hover:bg-muted"
              >
                Previous
              </button>
              <button
                onClick={() => setInstalledPage(p => Math.min(totalInstalledPages, p + 1))}
                disabled={installedPage === totalInstalledPages}
                className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 hover:bg-muted"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {tab === 'remote' && filteredRemote.length > pageSize && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border sticky bottom-0 bg-background">
            <span className="text-sm text-muted-foreground">
              Showing {(remotePage - 1) * pageSize + 1} to {Math.min(remotePage * pageSize, filteredRemote.length)} of {filteredRemote.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setRemotePage(p => Math.max(1, p - 1))}
                disabled={remotePage === 1}
                className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 hover:bg-muted"
              >
                Previous
              </button>
              <button
                onClick={() => setRemotePage(p => Math.min(totalRemotePages, p + 1))}
                disabled={remotePage === totalRemotePages}
                className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 hover:bg-muted"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Migration Dialog */}
      {migratingVersion && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in zoom-in duration-200">
          <div className="bg-card w-[400px] border border-border rounded-xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold mb-2">Migrate Global Packages</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Do you want to reinstall global packages (like yarn, pm2) from an existing version into Node.js {migratingVersion}?
            </p>
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="migration"
                  value="none"
                  checked={migrationSource === 'none'}
                  onChange={(e) => setMigrationSource(e.target.value)}
                  className="accent-primary"
                />
                <span className="text-sm font-medium">None (Clean install)</span>
              </label>
              {installedData.map(node => (
                <label key={node.version} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="migration"
                    value={node.version}
                    checked={migrationSource === node.version}
                    onChange={(e) => setMigrationSource(e.target.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">Migrate from {node.version}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMigratingVersion(null)}
                className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeInstall(migratingVersion, migrationSource)}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Terminal Toggle */}
      {(showTerminalOnVersions || isTerminalOpen) && (
        <>
          <div className="absolute bottom-6 right-6 z-40">
            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={`p-3 rounded-full shadow-lg transition-all flex items-center justify-center ${isTerminalOpen
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              title="Toggle Terminal Console"
            >
              {isTerminalOpen ? <X className="w-5 h-5" /> : <Terminal className="w-5 h-5" />}
            </button>
          </div>

          {/* Slide-up Terminal Drawer */}
          <div
            className={`absolute bottom-0 left-0 right-0 shadow-2xl transition-all duration-300 ease-in-out z-30 ${isTerminalOpen ? 'h-[50%] translate-y-0 opacity-100' : 'h-[50%] translate-y-full opacity-0 pointer-events-none'
              }`}
          >
            <TerminalConsole />
          </div>
        </>
      )}

      {/* Uninstall Confirmation */}
      <ConfirmDialog
        isOpen={uninstallingVersion !== null}
        title="Uninstall Node.js"
        message={`Are you sure you want to uninstall Node.js ${uninstallingVersion}? This action cannot be undone.`}
        confirmText="Uninstall"
        onConfirm={executeUninstall}
        onCancel={() => setUninstallingVersion(null)}
      />
    </div>
  )
}
