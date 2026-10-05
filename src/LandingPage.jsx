import React, { useEffect, useRef } from 'react';
import LocomotiveScroll from 'locomotive-scroll';
import 'locomotive-scroll/dist/locomotive-scroll.css';
import { Download, Terminal, Zap, HardDrive, PackageCheck, Layers, Globe, Code, ArrowRight } from 'lucide-react';

import logo from './assets/header-logo.png';
import heroLogo from './assets/hero-logo.png';

export default function LandingPage() {
  const scrollRef = useRef(null);

  useEffect(() => {
    const scroll = new LocomotiveScroll({
      el: scrollRef.current,
      smooth: true,
      multiplier: 0.8,
      class: 'is-reveal',
    });

    return () => {
      if (scroll) scroll.destroy();
    };
  }, []);

  const features = [
    {
      title: "Project Auto-Detection",
      description: "Instantly analyzes package.json to identify and install the exact Node.js version required by your workspace.",
      icon: <Layers strokeWidth={1} className="w-8 h-8 text-muted group-hover:text-foreground transition-colors duration-500" />
    },
    {
      title: "Optimistic UI",
      description: "Intelligent command stream parsing updates local state instantly, entirely bypassing slow redundant shell polling.",
      icon: <Zap strokeWidth={1} className="w-8 h-8 text-muted group-hover:text-foreground transition-colors duration-500" />
    },
    {
      title: "Storage Insights",
      description: "Automatically calculates disk space occupied by local versions, global packages, and remote downloads.",
      icon: <HardDrive strokeWidth={1} className="w-8 h-8 text-muted group-hover:text-foreground transition-colors duration-500" />
    },
    {
      title: "Global Package Migration",
      description: "Seamlessly migrate globally installed NPM packages from older versions during new installations.",
      icon: <PackageCheck strokeWidth={1} className="w-8 h-8 text-muted group-hover:text-foreground transition-colors duration-500" />
    }
  ];

  return (
    <div data-scroll-container ref={scrollRef} className="min-h-screen bg-background text-foreground selection:bg-brand-green selection:text-black font-sans">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-2xl border-b border-border/50">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="text-sm font-semibold tracking-wide text-foreground uppercase flex items-center gap-2">
            <img src={logo} alt="NVM-OnTheFly" className="h-[53px] w-auto" />
          </div>
          <div className="flex items-center gap-8 text-sm font-medium">
            <a href="#" className="text-muted hover:text-foreground transition-colors">Download</a>
            <a href="#how-it-works" className="text-muted hover:text-foreground transition-colors">How it works</a>
            <a href="#contact" className="text-muted hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section - Asymmetric Split */}
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
                <button className="relative flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-full font-medium group-hover:bg-brand-green group-hover:text-white active:scale-[0.98] transition-all overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    <Download strokeWidth={2} className="w-4 h-4" />
                    Download Now
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent group-hover:animate-shimmer z-0"></div>
                </button>
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

      {/* Features Section - Editorial List Pattern */}
      <section id="how-it-works" className="py-32 relative border-t border-border/30" data-scroll-section>
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">
          
          {/* Sticky Left Header */}
          <div className="lg:col-span-4" data-scroll data-scroll-speed="0.5">
            <div className="lg:sticky lg:top-32">
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-6">
                Mechanics.<br/>
                <span className="text-muted">Of The Application.</span>
              </h2>
              <p className="text-muted leading-relaxed font-light mb-8 max-w-[30ch]">
                It acts as a seamless GUI wrapper for NVM. Instead of creating isolated folders, it hooks directly into your existing system installations via native shell execution.
              </p>
              <a href="#" className="inline-flex items-center gap-2 text-sm font-medium text-brand-green hover:text-brand-secondary transition-colors">
                Read the documentation <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right Editorial List */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="border-t border-border/50">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="group flex flex-col sm:flex-row gap-8 py-12 border-b border-border/50 hover:bg-surface/30 transition-colors duration-500 px-6 -mx-6 sm:mx-0 sm:px-8 rounded-2xl"
                >
                  <div className="flex-shrink-0 mt-1">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium tracking-tight text-foreground mb-4 group-hover:text-brand-green transition-colors duration-500">{feature.title}</h3>
                    <p className="text-muted leading-relaxed font-light max-w-[50ch]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
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
    </div>
  );
}
