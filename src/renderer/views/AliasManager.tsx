import { useState, useEffect } from 'react'
import { useNvmStore } from '../store/nvmStore'
import { Bookmark, Plus, Trash2, Loader2, Play } from 'lucide-react'
import Preloader from '../components/Preloader'

export default function AliasManager() {
  const { currentMode, addLog, aliases, fetchAliases, hasFetchedAliases } = useNvmStore()
  const [isFetching, setIsFetching] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [newAliasName, setNewAliasName] = useState('')
  const [newAliasVersion, setNewAliasVersion] = useState('')

  const handleFetch = async () => {
    setIsFetching(true)
    await fetchAliases()
    setIsFetching(false)
  }

  useEffect(() => {
    if (!hasFetchedAliases && currentMode === 'nvm-sh') {
      handleFetch()
    }
  }, [hasFetchedAliases, currentMode])

  const handleCreateAlias = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAliasName || !newAliasVersion) return
    setLoadingAction('create')
    try {
      await window.nvmAPI.setAlias(newAliasName, newAliasVersion)
      await handleFetch()
      setNewAliasName('')
      setNewAliasVersion('')
      window.alert(`Alias '${newAliasName}' created successfully!`)
    } catch (e: any) {
      addLog({ msg: `Failed to create alias: ${e.message}`, type: 'error' })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleDeleteAlias = async (name: string) => {
    if (!window.confirm(`Are you sure you want to delete alias '${name}'?`)) return
    setLoadingAction(`delete-${name}`)
    try {
      await window.nvmAPI.deleteAlias(name)
      await handleFetch()
      window.alert(`Alias '${name}' deleted successfully!`)
    } catch (e: any) {
      addLog({ msg: `Failed to delete alias: ${e.message}`, type: 'error' })
    } finally {
      setLoadingAction(null)
    }
  }

  if (currentMode !== 'nvm-sh') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-card rounded-lg border border-border">
        <Bookmark className="w-12 h-12 mb-4 opacity-50" />
        <p>Alias management is only supported natively when using the nvm-sh engine (Unix/WSL/Git Bash).</p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full bg-card rounded-lg border border-border shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="p-4 border-b border-border bg-muted/30">
        <h2 className="font-semibold flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          Manage NVM Aliases
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Create easy-to-remember shortcuts for your Node.js versions.</p>
      </div>

      <div className="flex-1 p-6 overflow-auto flex flex-col gap-8">
        <form onSubmit={handleCreateAlias} className="flex flex-col gap-4 bg-muted/20 p-4 rounded-xl border border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Create New Alias</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 block">Alias Name (e.g. prod, default)</label>
              <input
                type="text"
                value={newAliasName}
                onChange={e => setNewAliasName(e.target.value)}
                placeholder="Name"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 block">Node Version (e.g. 18.0.0)</label>
              <input
                type="text"
                value={newAliasVersion}
                onChange={e => setNewAliasVersion(e.target.value)}
                placeholder="Version"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loadingAction === 'create' || !newAliasName || !newAliasVersion}
              className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 h-[38px]"
            >
              {loadingAction === 'create' ? <Preloader /> : <Plus className="w-4 h-4" />}
              Create Alias
            </button>
          </div>
        </form>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Existing Aliases</h3>
          
          {isFetching ? (
            <div className="flex items-center justify-center p-12">
              <div className="scale-150 text-primary"><Preloader /></div>
            </div>
          ) : aliases.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10">
              <Bookmark className="w-10 h-10 mb-2 opacity-50" />
              <p>No aliases found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aliases.map(alias => (
                <div key={alias.name} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background shadow-sm hover:border-primary/50 transition-colors group">
                  <div>
                    <h3 className="font-semibold text-lg">{alias.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Play className="w-3 h-3" />
                      Points to v{alias.version}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAlias(alias.name)}
                    disabled={loadingAction !== null}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete Alias"
                  >
                    {loadingAction === `delete-${alias.name}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
