import { useState, useEffect } from 'react'
import { useNvmStore } from '../store/nvmStore'
import { Package, RefreshCw, Trash2, Terminal, X } from 'lucide-react'
import Preloader from '../components/Preloader'
import TerminalConsole from './TerminalConsole'
import ConfirmDialog from '../components/ConfirmDialog'

export default function GlobalPackages() {
  const { isFetching, isFetchingPackages, hasFetchedPackages, globalPackages: packages, fetchPackages, showTerminalOnPackages, addLog } = useNvmStore()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 12 // 3 columns * 4 rows

  // Reset page if packages change significantly
  useEffect(() => {
    setPage(1)
  }, [packages.length])



  const [uninstallingPackage, setUninstallingPackage] = useState<string | null>(null)

  const handleUninstall = (pkgName: string) => {
    setUninstallingPackage(pkgName)
  }

  const executeUninstall = async () => {
    if (!uninstallingPackage) return
    const pkgName = uninstallingPackage
    setUninstallingPackage(null)
    setLoadingAction(`uninstall-${pkgName}`)
    try {
      await window.nvmAPI.runNpmCommand(['uninstall', '-g', pkgName])
      await fetchPackages()
    } catch (e: any) {
      addLog({ msg: `Failed to uninstall package ${pkgName}: ${e.message}`, type: 'error' })
      setIsTerminalOpen(true)
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-card rounded-lg border border-border shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <h2 className="font-semibold flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Installed Global Packages
        </h2>
        <button
          onClick={fetchPackages}
          disabled={isFetchingPackages || isFetching}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
        >
          {isFetchingPackages ? <Preloader /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {isFetchingPackages && packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <div className="mb-4 text-primary scale-150"><Preloader /></div>
            <p>Scanning global packages...</p>
          </div>
        ) : isFetching && packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/20">
            <div className="mb-4 opacity-50 scale-150"><Preloader /></div>
            <p>Waiting for NVM to initialize... Please wait.</p>
          </div>
        ) : !hasFetchedPackages ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/20">
            <Package className="w-10 h-10 mb-2 opacity-50" />
            <p>Click Refresh to load global packages for the current Node version.</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/20">
            <Package className="w-10 h-10 mb-2 opacity-50" />
            <p>No global packages found (excluding npm).</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {packages.slice((page - 1) * pageSize, page * pageSize).map(pkg => (
                <div key={pkg.name} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background shadow-sm hover:border-primary/50 transition-colors group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-medium text-sm truncate">{pkg.name}</h3>
                      <p className="text-xs text-muted-foreground">v{pkg.version}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUninstall(pkg.name)}
                    disabled={loadingAction !== null}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Uninstall Package"
                  >
                    {loadingAction === `uninstall-${pkg.name}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {packages.length > pageSize && (
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, packages.length)} of {packages.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 hover:bg-muted"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(Math.ceil(packages.length / pageSize), p + 1))}
                    disabled={page === Math.ceil(packages.length / pageSize)}
                    className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 hover:bg-muted"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Terminal Toggle */}
      {showTerminalOnPackages && (
        <>
          <div className="absolute bottom-6 right-6 z-40">
            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={`p-3 rounded-full shadow-lg transition-all flex items-center justify-center ${
                isTerminalOpen 
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
            className={`absolute bottom-0 left-0 right-0 shadow-2xl transition-all duration-300 ease-in-out z-30 ${
              isTerminalOpen ? 'h-[50%] translate-y-0 opacity-100' : 'h-[50%] translate-y-full opacity-0 pointer-events-none'
            }`}
          >
            <TerminalConsole />
          </div>
        </>
      )}

      {/* Uninstall Confirmation */}
      <ConfirmDialog
        isOpen={uninstallingPackage !== null}
        title="Uninstall Global Package"
        message={`Are you sure you want to uninstall the global package ${uninstallingPackage}?`}
        confirmText="Uninstall"
        onConfirm={executeUninstall}
        onCancel={() => setUninstallingPackage(null)}
      />
    </div>
  )
}
