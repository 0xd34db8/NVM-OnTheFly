import React from 'react';
import logo from '../assets/LOGO_Long.png';

export default function Navbar({ downloadUrl }) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-2xl border-b border-border/50">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <div className="text-sm font-semibold tracking-wide text-foreground uppercase flex items-center gap-2">
          <img src={logo} alt="NVM-OnTheFly" className="h-[53px] w-auto" />
        </div>
        <div className="flex items-center gap-8 text-sm font-medium">
          <a href={downloadUrl} className="text-muted hover:text-foreground transition-colors">Download</a>
          <a href="#how-it-works" className="text-muted hover:text-foreground transition-colors">How it works</a>
          <a href="#contact" className="text-muted hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>
    </nav>
  );
}
