import React from 'react';
import { Download, Terminal } from 'lucide-react';
import heroLogo from '../assets/Hero.png';

export default function Hero({ downloadUrl }) {
  return (
    <section className="relative min-h-[100dvh] pt-32 pb-24 overflow-hidden flex items-center" data-scroll-section>
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-brand-green/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 -z-10 pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
        
        {/* Text Content */}
        <div className="lg:col-span-7 flex flex-col items-start z-10">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[1.05] text-foreground mb-8">
            Version<br />
            Management<br />
            <span className="text-muted">Reimagined.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted max-w-[45ch] mb-12 leading-relaxed font-light">
            Bridge the gap between terminal automation and visual management. Instantly switch environments, migrate global packages, and reclaim storage space.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
            <div className="relative group rounded-full">
              {/* Button Ambient Glow */}
              <div className="absolute inset-0 bg-[#4EE8AF] rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"></div>
              <a href={downloadUrl} className="relative flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-full font-medium group-hover:bg-brand-green group-hover:text-white active:scale-[0.98] transition-all overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  <Download strokeWidth={2} className="w-4 h-4" />
                  Download Now
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent group-hover:animate-shimmer z-0"></div>
              </a>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted">
              <span className="w-px h-8 bg-border hidden sm:block"></span>
              <p>Available on Windows <br className="hidden sm:block"/> & Git Bash</p>
            </div>
          </div>
        </div>

        {/* Right Visual / Logo */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
            {/* Ambient Glow */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] opacity-40 blur-[80px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, transparent 25%, #4EE8AF 45%, #4EE8AF 100%)' }}
            ></div>
            
            <div className="absolute inset-0 flex items-center justify-center animate-float">
              <img 
                src={heroLogo} 
                alt="NVM-OnTheFly Logo" 
                className="w-[412px] h-[412px] sm:w-[549px] sm:h-[549px] max-w-none object-contain drop-shadow-[0_0_80px_rgba(78,232,175,0.4)]"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-48 h-48 rounded-full bg-surface border border-border/50 flex-col items-center justify-center shadow-2xl">
                 <Terminal strokeWidth={1} className="w-16 h-16 text-muted mb-2" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
