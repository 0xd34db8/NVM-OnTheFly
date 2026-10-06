import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar({ downloadUrl }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-2xl border-b border-border/50">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-end md:justify-center">
        {/* Desktop Links */}
        <div className="hidden md:flex w-full items-center justify-center gap-12 text-sm font-medium">
          <a href={downloadUrl} className="text-muted hover:text-foreground transition-colors">Download</a>
          <a href="#how-it-works" className="text-muted hover:text-foreground transition-colors">How it works</a>
          <a href="#contact" className="text-muted hover:text-foreground transition-colors">Contact</a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-foreground p-2 -mr-2 z-50 relative cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Links Overlay */}
        <div
          className={`absolute top-0 left-0 w-full h-screen bg-background/95 backdrop-blur-3xl flex flex-col items-center justify-center gap-8 text-xl font-medium transition-all duration-300 ease-in-out md:hidden ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
            }`}
        >
          <a href={downloadUrl} onClick={() => setIsOpen(false)} className="text-muted hover:text-foreground transition-colors">Download</a>
          <a href="#how-it-works" onClick={() => setIsOpen(false)} className="text-muted hover:text-foreground transition-colors">How it works</a>
          <a href="#contact" onClick={() => setIsOpen(false)} className="text-muted hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>
    </nav>
  );
}
