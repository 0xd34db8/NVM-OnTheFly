import React from 'react';
import { Globe, Code } from 'lucide-react';
import logo from '../assets/LOGO_Single.png';

export default function Footer() {
  return (
    <footer id="contact" className="pt-24 pb-32 border-t border-border/50 bg-surface/20" data-scroll-section>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 flex flex-col gap-12">
        {/* Top Section: Logo, Tagline and Links */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
            <img src={logo} alt="NVM-OnTheFly" className="h-[90px] md:h-[130px] lg:h-[160px] w-auto drop-shadow-xl" />
            <p className="max-w-[40ch] leading-relaxed text-muted text-base md:text-lg">
              Bridge the gap between terminal automation and visual management.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-base md:text-lg text-muted md:mt-8">
            <a href="https://github.com/0xd34db8" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors flex items-center gap-2">
              <Code className="w-5 h-5 md:w-6 md:h-6" />
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/apurv7gupta/" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors flex items-center gap-2">
              <Globe className="w-5 h-5 md:w-6 md:h-6" />
              LinkedIn
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border/50"></div>

        {/* Bottom Section: Copyright */}
        <div className="flex justify-center md:justify-start items-center text-center md:text-left text-muted">
          <div className="text-sm md:text-base">
            © {new Date().getFullYear()} NVM-OnTheFly. Built for developers.
          </div>
        </div>
      </div>
    </footer>
  );
}
