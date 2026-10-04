import { useState } from 'react'
import { Terminal, Download, Settings, X, Loader2 } from 'lucide-react'
import { useNvmStore } from '../store/nvmStore'
import TerminalConsole from './TerminalConsole'

export default function EngineSetup() {
  const { fetchState, isFetching } = useNvmStore()
  const [installing, setInstalling] = useState<string | null>(null)
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)

  const handleInstall = async (engine: 'nvm-windows' | 'nvm-sh') => {
    setInstalling(engine)
    setIsTerminalOpen(true)
    try {
      await (window as any).nvmAPI.installEngine(engine)
      await fetchState()
    } catch (e) {
      console.error(e)
    } finally {
      setInstalling(null)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 relative overflow-hidden">
      <div className="max-w-2xl w-full bg-card border border-border rounded-xl shadow-lg p-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 z-10">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
          <Settings className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold mb-3">No NVM Engine Detected</h2>
        <p className="text-muted-foreground mb-8">
          NVM: OnTheFly requires a Node Version Manager to function. We couldn't detect any supported engine on your system.
          Please select an engine to install below.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* nvm-windows Option */}
          <div className="border border-border rounded-lg p-6 flex flex-col items-center bg-muted/20 hover:bg-muted/40 transition-colors">
            <h3 className="font-semibold text-lg mb-2">nvm-windows</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center flex-1">
              The standard Node Version Manager for Windows.
            </p>
            <button
              onClick={() => handleInstall('nvm-windows')}
              disabled={installing !== null}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {installing === 'nvm-windows' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Install nvm-windows
            </button>
          </div>

          {/* nvm-sh Option */}
          <div className="border border-border rounded-lg p-6 flex flex-col items-center bg-muted/20 hover:bg-muted/40 transition-colors">
            <h3 className="font-semibold text-lg mb-2">nvm-sh</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center flex-1">
              The original Node Version Manager. Suitable for macOS, Linux, and Windows (via Git Bash/WSL).
            </p>
            <button
              onClick={() => handleInstall('nvm-sh')}
              disabled={installing !== null}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {installing === 'nvm-sh' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
              Install nvm-sh
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border w-full flex flex-col items-center">
          <p className="text-sm text-muted-foreground mb-4">
            Already installed it manually?
          </p>
          <button
            onClick={() => fetchState()}
            disabled={isFetching}
            className="text-sm font-medium text-primary hover:underline flex items-center gap-2"
          >
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Check Again
          </button>
        </div>
      </div>

      {/* Slide-up Terminal Drawer */}
      <div
        className={`absolute bottom-0 left-0 right-0 shadow-2xl transition-all duration-300 ease-in-out z-30 ${isTerminalOpen ? 'h-[60%] translate-y-0 opacity-100' : 'h-[60%] translate-y-full opacity-0 pointer-events-none'
          }`}
      >
        <TerminalConsole />
        <button
          onClick={() => setIsTerminalOpen(false)}
          className="absolute top-4 right-4 p-2 bg-background/80 hover:bg-background border border-border rounded-full backdrop-blur-sm z-50 text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
