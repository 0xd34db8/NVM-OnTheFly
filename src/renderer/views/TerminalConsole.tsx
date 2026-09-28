import { useEffect, useRef, useState } from 'react'
import { useNvmStore } from '../store/nvmStore'
import { Terminal, Check, Copy } from 'lucide-react'

export default function TerminalConsole() {
  const { logs } = useNvmStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-destructive'
      case 'success': return 'text-green-500 dark:text-green-400 font-bold'
      case 'system': return 'text-blue-500 dark:text-blue-400 italic'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-lg border border-border shadow-xl overflow-hidden font-mono animate-in fade-in zoom-in-95 duration-200">
      <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-white/5 backdrop-blur-md text-white/70 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span>Console Output</span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(logs.map(l => l.msg).join(''))
            setCopied(true)
            setTimeout(() => setCopied(false), 3000)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 hover:bg-secondary text-white/90 hover:text-white rounded-md transition-colors border border-white/10"
          title="Copy Logs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy Logs'}
        </button>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-auto p-4 text-[13px] leading-relaxed space-y-1"
      >
        {logs.length === 0 ? (
          <div className="text-white/30 italic">Awaiting terminal output...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`${getLogColor(log.type)} whitespace-pre-wrap break-words`}>
              {log.msg}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
