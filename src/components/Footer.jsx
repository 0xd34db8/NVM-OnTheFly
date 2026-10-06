import React from 'react';
import { Globe, Code } from 'lucide-react';
import logo from '../assets/LOGO_Long.png';

export default function Footer() {
  return (
    <footer id="contact" className="pt-24 pb-32 border-t border-border/50 bg-surface/20" data-scroll-section>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        
        <div className="flex flex-col gap-6">
          <div className="text-sm font-semibold tracking-wide text-foreground uppercase flex items-center gap-2">
            <img src={logo} alt="NVM-OnTheFly" className="h-[53px] w-auto" />
          </div>
          <p className="text-sm text-muted max-w-[40ch] leading-relaxed">
            Bridge the gap between terminal automation and visual management.
          </p>
        </div>

        <div className="flex flex-col md:items-end gap-6 text-sm text-muted">
          <div className="flex items-center gap-8">
            <a href="https://github.com/0xd34db8" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors flex items-center gap-2">
              <Code className="w-4 h-4" />
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/apurv7gupta/" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors flex items-center gap-2">
              <Globe className="w-4 h-4" />
              LinkedIn
            </a>
          </div>
          <div>
            © {new Date().getFullYear()} NVM-OnTheFly. Built for developers.
          </div>
        </div>
      </div>
    </footer>
  );
}
