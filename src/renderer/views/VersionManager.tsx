import { useState, useEffect } from 'react'
import { useNvmStore } from '../store/nvmStore'
import { Download, Trash2, Play, RefreshCw, Search, Terminal, X, ChevronRight, ChevronDown, Loader2, FolderSearch } from 'lucide-react'
import Preloader from '../components/Preloader'
import TerminalConsole from './TerminalConsole'
import ConfirmDialog from '../components/ConfirmDialog'

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default function VersionManager() {
  const { installedData, downloadData, isFetching, fetchState, fetchDownloadData, showTerminalOnVersions, addLog, nodeSizes, fetchNodeSizes } = useNvmStore()
  const [tab, setTab] = useState<'installed' | 'download' | 'project'>('installed')
  const [projectData, setProjectData] = useState<{ requiredVersion: string | null; source: string | null; dependencies: { name: string, version: string, size?: number, isDev: boolean }[], dirPath: string } | null>(null)
  const [search, setSearch] = useState('')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)
  const [installedPage, setInstalledPage] = useState(1)
  const [downloadPage, setDownloadPage] = useState(1)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const pageSize = 10

  // Reset pagination when searching
  useEffect(() => {
    setInstalledPage(1)
    setDownloadPage(1)
    setSelectedVersions([])
  }, [search, tab])

  // Clear loading action instantly when the stream parser updates installedData
  useEffect(() => {
    if (loadingAction?.startsWith('install-')) {
      const version = loadingAction.replace('install-', '')
      if (installedData.some(i => i.version === version)) {
        setLoadingAction(null)
      }
    } else if (loadingAction?.startsWith('uninstall-')) {
      const version = loadingAction.replace('uninstall-', '')
      if (!installedData.some(i => i.version === version)) {
        setLoadingAction(null)
      }
    } else if (loadingAction?.startsWith('use-')) {
      const version = loadingAction.replace('use-', '')
      const active = installedData.find(i => i.isActive)
      if (active?.version === version) {
        setLoadingAction(null)
      }
    }
  }, [installedData, loadingAction])
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
  
  const [expandedMigrationNode, setExpandedMigrationNode] = useState<string | null>(null)
  const [migrationPackages, setMigrationPackages] = useState<Record<string, string[]>>({})
  const [selectedMigrationPackages, setSelectedMigrationPackages] = useState<Record<string, Set<string>>>({})

  const handleExpandMigrationNode = async (e: React.MouseEvent, version: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (expandedMigrationNode === version) {
      setExpandedMigrationNode(null)
      return
    }
    setExpandedMigrationNode(version)
    if (!migrationPackages[version]) {
      const pkgs = await window.nvmAPI.getPackagesForVersion(version)
      setMigrationPackages(prev => ({ ...prev, [version]: pkgs }))
      setSelectedMigrationPackages(prev => ({ ...prev, [version]: new Set(pkgs) }))
    }
  }

  const togglePackageSelection = (version: string, pkg: string) => {
    setSelectedMigrationPackages(prev => {
      const newSet = new Set(prev[version])
      if (newSet.has(pkg)) newSet.delete(pkg)
      else newSet.add(pkg)
      return { ...prev, [version]: newSet }
    })
  }

  const handleInstall = async (version: string) => {
    if (installedData.length > 0) {
      setMigratingVersion(version)
    } else {
      executeInstall(version, 'none')
    }
  }

  const handleCancelInstall = async () => {
    await window.nvmAPI.cancelInstall()
    setLoadingAction(null)
  }

  const executeInstall = async (version: string, source: string) => {
    setLoadingAction(`install-${version}`)
    setMigratingVersion(null)
    try {
      let success = false
      if (source === 'none') {
        success = await window.nvmAPI.installVersion(version)
      } else {
        const availablePkgs = migrationPackages[source]
        const selectedPkgs = selectedMigrationPackages[source]
        
        if (availablePkgs && selectedPkgs) {
            if (selectedPkgs.size === 0) {
                success = await window.nvmAPI.installVersion(version)
            } else if (selectedPkgs.size < availablePkgs.length) {
                const pkgsToPass = Array.from(selectedPkgs)
                success = await window.nvmAPI.migratePackages(version, source, pkgsToPass)
            } else {
                success = await window.nvmAPI.migratePackages(version, source)
            }
        } else {
            success = await window.nvmAPI.migratePackages(version, source)
        }
      }
      if (!success) throw new Error('NVM command exited with an error.')
      // No need to run fetchState() as stream parser updates state instantly
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
      setSelectedVersions(prev => prev.filter(v => v !== version))
    } catch (e: any) {
      addLog({ msg: `Failed to uninstall version ${version}: ${e.message}`, type: 'error' })
      setIsTerminalOpen(true)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleBatchUninstall = async () => {
    if (selectedVersions.length === 0) return
    if (!window.confirm(`Are you sure you want to uninstall ${selectedVersions.length} selected version(s)?`)) return

    setLoadingAction('batch-uninstall')
    try {
      for (const version of selectedVersions) {
        const isActive = installedData.find(i => i.isActive)?.version === version
        if (isActive) {
          addLog({ msg: `Skipping active version ${version}`, type: 'info' })
          continue
        }
        await window.nvmAPI.uninstallVersion(version)
      }
      setSelectedVersions([])
      window.alert('Batch uninstall completed!')
    } catch (e: any) {
      addLog({ msg: `Batch uninstall failed: ${e.message}`, type: 'error' })
      setIsTerminalOpen(true)
    } finally {
      setLoadingAction(null)
    }
  }

  const filteredInstalled = installedData.filter(v => v.version.includes(search))
  const paginatedInstalled = filteredInstalled.slice((installedPage - 1) * pageSize, installedPage * pageSize)
  const totalInstalledPages = Math.max(1, Math.ceil(filteredInstalled.length / pageSize))

  const filteredDownload = downloadData.filter(v => v.version.includes(search))
  const paginatedDownload = filteredDownload.slice((downloadPage - 1) * pageSize, downloadPage * pageSize)
  const totalDownloadPages = Math.max(1, Math.ceil(filteredDownload.length / pageSize))

  useEffect(() => {
    const visibleNodes = tab === 'installed' ? paginatedInstalled : paginatedDownload
    const versions = visibleNodes.map(n => n.version)
    if (versions.length > 0) {
      fetchNodeSizes(tab, versions)
    }
  }, [tab, installedPage, downloadPage, search, installedData, downloadData])

  const handleDetectProject = async (path?: string) => {
    try {
      const dirPath = path || await window.nvmAPI.openDirectory()
      if (!dirPath) return
      
      setTab('project')
      setLoadingAction('detecting')
      const res = await window.nvmAPI.detectProjectVersion(dirPath)
      
      setProjectData({ ...res, dirPath })
      setLoadingAction(null)
    } catch (e) {
      console.error(e)
      setLoadingAction(null)
    }
  }

  return (
    <div 
      className="relative flex flex-col h-full bg-card rounded-lg border border-border shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      onDrop={async (e) => {
        e.preventDefault()
        e.stopPropagation()
        const path = e.dataTransfer.files[0]?.path
        if (path) handleDetectProject(path)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
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
            onClick={() => setTab('download')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'download'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'hover:bg-secondary text-muted-foreground'
              }`}
          >
            Download
          </button>
          <button
            onClick={() => setTab('project')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'project'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'hover:bg-secondary text-muted-foreground'
              }`}
          >
            Project
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setLoadingAction('refresh')
              await fetchState()
              await fetchDownloadData()
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
        {tab === 'project' && (
          <div className="p-8 h-full flex flex-col">
            <div 
              onClick={() => handleDetectProject()}
              className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer bg-muted/10 hover:bg-muted/30 mb-8"
            >
              {loadingAction === 'detecting' ? (
                <div className="text-primary scale-150 mb-4"><Preloader /></div>
              ) : (
                <FolderSearch className="w-12 h-12 text-muted-foreground mb-4" />
              )}
              <h3 className="text-lg font-semibold mb-2">Drag & Drop Project Folder Here</h3>
              <p className="text-sm text-muted-foreground">Or click to browse and select a folder</p>
            </div>

            {projectData && (
              <div className="bg-card rounded-lg border border-border shadow-sm p-6 flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Project Path</h3>
                  <p className="font-mono text-sm">{projectData.dirPath}</p>
                </div>

                {projectData.requiredVersion && (
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Required Node.js</h3>
                      <p className="text-lg font-medium flex items-center gap-2">
                        {projectData.requiredVersion}
                        <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-background rounded-full border border-border">
                          via {projectData.source}
                        </span>
                      </p>
                    </div>
                    <div>
                      {(() => {
                        const version = projectData.requiredVersion.replace(/^v/, '').trim()
                        const isInstalled = installedData.some(i => i.version === version)
                        const isActive = installedData.find(i => i.isActive)?.version === version
                        
                        if (isActive) {
                          return <span className="px-4 py-2 bg-primary/20 text-primary rounded-md font-bold text-sm">Active Engine</span>
                        } else if (isInstalled) {
                          return (
                            <button
                              onClick={() => handleUse(version)}
                              disabled={loadingAction !== null}
                              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                            >
                              {loadingAction === `use-${version}` ? <Preloader /> : <Play className="w-4 h-4" />}
                              Switch to {version}
                            </button>
                          )
                        } else {
                          return (
                            <button
                              onClick={() => handleInstall(version)}
                              disabled={loadingAction !== null}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                            >
                              {loadingAction === `install-${version}` ? <Preloader /> : <Download className="w-4 h-4" />}
                              Install {version}
                            </button>
                          )
                        }
                      })()}
                    </div>
                  </div>
                )}

                {projectData.dependencies && projectData.dependencies.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Project Dependencies</h3>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 font-medium">Package</th>
                            <th className="px-4 py-3 font-medium text-center">Type</th>
                            <th className="px-4 py-3 font-medium">Version</th>
                            <th className="px-4 py-3 font-medium text-right">Local Size</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {projectData.dependencies.map(dep => (
                            <tr key={dep.name} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-medium">{dep.name}</td>
                              <td className="px-4 py-3 text-muted-foreground text-center">
                                {dep.isDev ? (
                                  <span className="px-2 py-0.5 bg-secondary/80 rounded-md text-[10px]">Dev</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px]">Dep</span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs">{dep.version}</td>
                              <td className="px-4 py-3 text-right text-muted-foreground">
                                {dep.size !== undefined && dep.size !== null ? (
                                  dep.size > 0 ? formatBytes(dep.size) : 'Not Installed'
                                ) : (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab !== 'project' && (
        <div className="flex-1 overflow-auto relative">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 sticky top-0 backdrop-blur-md z-10">
              <tr>
                {tab === 'installed' && (
                  <th className="px-6 py-3 w-12">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                      checked={selectedVersions.length > 0 && selectedVersions.length === paginatedInstalled.filter(i => !i.isActive).length && paginatedInstalled.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVersions(paginatedInstalled.filter(i => !i.isActive).map(i => i.version))
                        } else {
                          setSelectedVersions([])
                        }
                      }}
                    />
                  </th>
                )}
                <th className="px-6 py-3 font-medium text-muted-foreground w-1/3">Version</th>
                <th className="px-6 py-3 font-medium text-muted-foreground w-1/3">Release Date</th>
                <th className="px-6 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-border">
            {tab === 'installed' && filteredInstalled.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
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
              <tr key={node.version} className={`transition-colors hover:bg-muted/30 ${node.isActive ? 'bg-primary/5' : ''} ${selectedVersions.includes(node.version) ? 'bg-muted/50' : ''}`}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    disabled={node.isActive}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background disabled:opacity-50"
                    checked={selectedVersions.includes(node.version)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVersions(prev => [...prev, node.version])
                      } else {
                        setSelectedVersions(prev => prev.filter(v => v !== node.version))
                      }
                    }}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${node.isActive ? 'text-primary' : ''}`}>
                      {node.version}
                    </span>
                    {nodeSizes[node.version] !== undefined && (
                      <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                        {formatBytes(nodeSizes[node.version])}
                      </span>
                    )}
                    {node.isActive && (
                      <span className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                        Active
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {/* Local nodes don't easily have release date unless joined with download data */}
                  {downloadData.find(r => r.version === node.version)?.date || 'Unknown'}
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

            {tab === 'download' && filteredDownload.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                  {isFetching || loadingAction === 'refresh' ? (
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="text-primary scale-150"><Preloader /></div>
                      <p>Loading download versions...</p>
                    </div>
                  ) : (
                    "No download versions found. Click Refresh to load versions."
                  )}
                </td>
              </tr>
            )}

            {tab === 'download' && paginatedDownload.map(node => {
              const isInstalled = installedData.some(i => i.version === node.version)
              return (
                <tr key={node.version} className="transition-colors hover:bg-muted/30 relative">
                  <td className="px-6 py-4">
                    <span className="font-medium">{node.version}</span>
                    {nodeSizes[node.version] !== undefined && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatBytes(nodeSizes[node.version])}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{node.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (loadingAction === `install-${node.version}`) {
                          handleCancelInstall()
                        } else {
                          handleInstall(node.version)
                        }
                      }}
                      disabled={isInstalled || (loadingAction !== null && loadingAction !== `install-${node.version}`) || isFetching}
                      className={`flex ml-auto items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${isInstalled || isFetching || (loadingAction !== null && loadingAction !== `install-${node.version}`)
                        ? 'bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed'
                        : loadingAction === `install-${node.version}` ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-brand text-white bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                      {loadingAction === `install-${node.version}` ? <X className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                      {isInstalled ? 'Installed' : (loadingAction === `install-${node.version}` ? 'Cancel' : 'Install')}
                    </button>
                  </td>
                  {loadingAction === `install-${node.version}` && (
                    <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full overflow-hidden">
                      <div className="h-full bg-primary w-1/3 animate-[slide_1.5s_ease-in-out_infinite]" />
                    </div>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
        )}

        {/* Pagination Controls */}
        {tab === 'installed' && filteredInstalled.length > pageSize && (
          <div className="grid grid-cols-3 items-center px-6 py-3 border-t border-border sticky bottom-0 bg-background">
            <div className="flex justify-start">
              <span className="text-sm text-muted-foreground">
                Showing {(installedPage - 1) * pageSize + 1} to {Math.min(installedPage * pageSize, filteredInstalled.length)} of {filteredInstalled.length}
              </span>
            </div>
            <div className="flex gap-2 justify-center">
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
            <div className="flex justify-end"></div>
          </div>
        )}

        {tab === 'download' && filteredDownload.length > pageSize && (
          <div className="grid grid-cols-3 items-center px-6 py-3 border-t border-border sticky bottom-0 bg-background">
            <div className="flex justify-start">
              <span className="text-sm text-muted-foreground">
                Showing {(downloadPage - 1) * pageSize + 1} to {Math.min(downloadPage * pageSize, filteredDownload.length)} of {filteredDownload.length}
              </span>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDownloadPage(p => Math.max(1, p - 1))}
                disabled={downloadPage === 1}
                className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 hover:bg-muted"
              >
                Previous
              </button>
              <button
                onClick={() => setDownloadPage(p => Math.min(totalDownloadPages, p + 1))}
                disabled={downloadPage === totalDownloadPages}
                className="px-3 py-1 border border-border rounded-md text-sm disabled:opacity-50 hover:bg-muted"
              >
                Next
              </button>
            </div>
            <div className="flex justify-end">
              {(showTerminalOnVersions || isTerminalOpen) && (
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
              )}
            </div>
          </div>
        )}

        {/* Batch Operations Bar */}
        {tab === 'installed' && selectedVersions.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background border border-border shadow-lg rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4 z-20">
            <span className="text-sm font-medium">
              {selectedVersions.length} version{selectedVersions.length > 1 ? 's' : ''} selected
            </span>
            <div className="h-4 w-px bg-border"></div>
            <button
              onClick={handleBatchUninstall}
              disabled={loadingAction !== null}
              className="flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
            >
              {loadingAction === 'batch-uninstall' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Uninstall Selected
            </button>
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
                <div key={node.version} className="flex flex-col border border-border rounded-lg overflow-hidden transition-colors">
                  <div 
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      if (migrationSource !== node.version) setMigrationSource(node.version)
                    }}
                  >
                    <input
                      type="radio"
                      name="migration"
                      value={node.version}
                      checked={migrationSource === node.version}
                      onChange={(e) => setMigrationSource(e.target.value)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium flex-1">Migrate from {node.version}</span>
                    <button 
                      onClick={(e) => handleExpandMigrationNode(e, node.version)}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                    >
                      {expandedMigrationNode === node.version ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                  {expandedMigrationNode === node.version && (
                    <div className="bg-muted/30 border-t border-border p-3 max-h-[150px] overflow-y-auto">
                      {!migrationPackages[node.version] ? (
                        <div className="flex justify-center p-2"><Preloader /></div>
                      ) : migrationPackages[node.version].length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">No global packages found.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 mb-1 pb-2 border-b border-border/50">
                            <input 
                              type="checkbox"
                              className="accent-primary rounded"
                              checked={selectedMigrationPackages[node.version]?.size === migrationPackages[node.version].length}
                              onChange={(e) => {
                                const checked = e.target.checked
                                setSelectedMigrationPackages(prev => ({
                                  ...prev,
                                  [node.version]: checked ? new Set(migrationPackages[node.version]) : new Set()
                                }))
                              }}
                            />
                            <span className="text-xs font-semibold">Select All</span>
                          </label>
                          {migrationPackages[node.version].map(pkg => (
                            <label key={pkg} className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="checkbox"
                                className="accent-primary rounded"
                                checked={selectedMigrationPackages[node.version]?.has(pkg) || false}
                                onChange={() => togglePackageSelection(node.version, pkg)}
                              />
                              <span className="text-xs group-hover:text-primary transition-colors">{pkg}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
          {(tab !== 'download' || isTerminalOpen) && (
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
          )}

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
