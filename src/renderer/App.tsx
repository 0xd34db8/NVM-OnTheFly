import { useState, useEffect } from 'react'
import { Minus, Square, X, Home, Settings, Package, Terminal as TerminalIcon } from 'lucide-react'
import VersionManager from './views/VersionManager'
import GlobalPackages from './views/GlobalPackages'
import TerminalConsole from './views/TerminalConsole'
import SettingsView from './views/Settings'
import { useNvmStore } from './store/nvmStore'

import logoIco from './assets/img/logo-32x32.ico'
import heroDark from './assets/img/Hero-Dark.png'
import heroLight from './assets/img/Hero-Light.png'

function App() {
  const [activeTab, setActiveTab] = useState('versions')
  const { fetchState, fetchRemoteData, currentMode, theme } = useNvmStore()

  useEffect(() => {
    fetchState()
    fetchRemoteData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const minimize = () => (window as any).context.windowMinimize()
  const maximize = () => (window as any).context.windowMaximize()
  const close = () => (window as any).context.windowClose()

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Titlebar */}
      <div
        className="h-10 border-b border-border flex items-center justify-between select-none bg-muted/20"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="px-4 text-sm font-semibold tracking-wide text-muted-foreground flex items-center gap-3">
          <img src={logoIco} alt="Logo" className="w-4 h-4 opacity-80" />
          NVM: OnTheFly
          {currentMode && (
            <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
              {currentMode}
            </span>
          )}
        </div>
        <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button onClick={minimize} className="h-full px-4 hover:bg-secondary flex items-center justify-center transition-colors">
            <Minus className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={maximize} className="h-full px-4 hover:bg-secondary flex items-center justify-center transition-colors">
            <Square className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={close} className="h-full px-4 hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground hover:text-current" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card flex flex-col p-4 gap-2">
          <div className="mb-6 mt-2 flex justify-center">
            <img 
              src={theme === 'dark' ? heroDark : heroLight} 
              alt="NVM OnTheFly" 
              className="w-full max-w-[180px] h-auto object-contain" 
            />
          </div>
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Menu</h2>
            <nav className="flex flex-col gap-1">
              <SidebarItem
                icon={<Home className="w-4 h-4" />}
                label="Version Manager"
                active={activeTab === 'versions'}
                onClick={() => setActiveTab('versions')}
              />
              <SidebarItem
                icon={<Package className="w-4 h-4" />}
                label="Global Packages"
                active={activeTab === 'packages'}
                onClick={() => setActiveTab('packages')}
              />
            </nav>
          </div>
          <div className="mb-4 flex-1 flex flex-col justify-end">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Tools</h2>
            <nav className="flex flex-col gap-1">
              <SidebarItem
                icon={<TerminalIcon className="w-4 h-4" />}
                label="Console Drawer"
                active={activeTab === 'console'}
                onClick={() => setActiveTab('console')}
              />
            </nav>
          </div>
          <div className="mt-auto border-t border-border pt-4">
            <SidebarItem
              icon={<Settings className="w-4 h-4" />}
              label="Settings"
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-hidden bg-background p-6">
          {activeTab === 'versions' && <VersionManager />}
          {activeTab === 'packages' && <GlobalPackages />}
          {activeTab === 'console' && <TerminalConsole />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  )
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left
        ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}
    >
      {icon}
      {label}
    </button>
  )
}

export default App
