import { Cpu, FolderSearch, ListTree, PackageOpen, TerminalSquare, HardDrive, Zap } from 'lucide-react';
import { useEffect, useRef } from 'react';
import consoleImg from '../assets/screenshots/Console.png';
import downloadImg from '../assets/screenshots/Download.png';
import settingsImg from '../assets/screenshots/Settings.png';
import versionManagerImg from '../assets/screenshots/Version Manager.png';

export default function Features() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-reveal');
          observer.unobserve(entry.target);
        }
      });
    }, { 
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    });

    if (sectionRef.current) {
      const elements = sectionRef.current.querySelectorAll('.reveal-target');
      elements.forEach(el => observer.observe(el));
    }

    return () => observer.disconnect();
  }, []);
  const features = [
    {
      title: "Native Engine Integration",
      description: "Hooks directly into your existing nvm-sh and nvm-windows installations. Zero lock-in and 100% compatibility—what you see is what your terminal gets.",
      icon: <Cpu strokeWidth={1.5} className="w-6 h-6 text-brand-green" />,
      colSpan: "lg:col-span-8",
      bgGradient: "from-brand-green/20 to-transparent",
      image: settingsImg
    },
    {
      title: "Project Auto-Detection",
      description: "Drag and drop a project directory to instantly parse package.json, analyze dependencies, and one-click switch to the required Node.js version.",
      icon: <FolderSearch strokeWidth={1.5} className="w-6 h-6 text-brand-green" />,
      colSpan: "lg:col-span-4",
      bgGradient: "from-brand-green/10 to-transparent"
    },
    {
      title: "Visual Version Management",
      description: "View remote releases, install new versions, and efficiently batch-uninstall multiple Node versions via a sleek floating action bar.",
      icon: <ListTree strokeWidth={1.5} className="w-6 h-6 text-brand-green" />,
      colSpan: "lg:col-span-4",
      bgGradient: "from-brand-green/10 to-transparent",
      image: versionManagerImg
    },
    {
      title: "Global Package Manager",
      description: "List, update, and uninstall global packages. Seamlessly migrate your favorite packages from older Node versions during new installations.",
      icon: <PackageOpen strokeWidth={1.5} className="w-6 h-6 text-brand-green" />,
      colSpan: "lg:col-span-4",
      bgGradient: "from-brand-green/10 to-transparent",
      image: downloadImg
    },
    {
      title: "Interactive Console",
      description: "A slide-up terminal console streams real-time logs from tasks and lets you execute arbitrary shell commands across engines.",
      icon: <TerminalSquare strokeWidth={1.5} className="w-6 h-6 text-brand-green" />,
      colSpan: "lg:col-span-4",
      bgGradient: "from-brand-green/10 to-transparent",
      image: consoleImg
    },
    {
      title: "Storage Insights",
      description: "Automatically calculates and displays the precise disk space occupied by your local Node versions, remote downloads, and global packages.",
      icon: <HardDrive strokeWidth={1.5} className="w-6 h-6 text-brand-green" />,
      colSpan: "lg:col-span-5",
      bgGradient: "from-brand-green/10 to-transparent"
    },
    {
      title: "Lightning Fast Optimistic UI",
      description: "Intelligent command stream parsing updates local state instantly, entirely bypassing slow redundant shell polling to keep the application buttery smooth.",
      icon: <Zap strokeWidth={1.5} className="w-6 h-6 text-brand-green" />,
      colSpan: "lg:col-span-7",
      bgGradient: "from-brand-green/20 to-transparent"
    }
  ];

  return (
    <section ref={sectionRef} id="features" className="py-32 relative border-t border-border/30 bg-background overflow-hidden" data-scroll-section>
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-green/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="reveal-target text-center mb-20 opacity-0 translate-y-12 scale-95 transition-all duration-1000 ease-out [&.is-reveal]:opacity-100 [&.is-reveal]:translate-y-0 [&.is-reveal]:scale-100">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6">
            Powerful Features.<br />
            <span className="text-muted">Designed for Productivity.</span>
          </h2>
          <p className="text-muted leading-relaxed font-light max-w-2xl mx-auto">
            Experience a modern GUI wrapper for NVM that hooks directly into your existing system installations via native shell execution.
          </p>
        </div>

        <div className="flex flex-col gap-24 lg:gap-32">
          {features.map((feature, index) => {
            const isEven = index % 2 === 0;
            return (
              <div 
                key={index}
                className={`reveal-target flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-20 opacity-0 translate-y-16 transition-all duration-[800ms] ease-out [&.is-reveal]:opacity-100 [&.is-reveal]:translate-y-0`}
              >
                {/* Text Content */}
                <div className="flex-1 lg:max-w-md xl:max-w-lg space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-surface border border-border/50 flex items-center justify-center shadow-sm group">
                    <div className="transition-transform duration-500 group-hover:scale-110">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-medium tracking-tight text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-muted leading-relaxed font-light max-w-xl">
                    {feature.description}
                  </p>
                </div>
                
                {/* Visual Content */}
                <div className="flex-1 w-full relative z-10">
                  <div className={`relative w-full ${feature.image ? '' : 'aspect-[4/3]'} rounded-3xl border border-border/50 bg-surface/30 backdrop-blur-sm overflow-hidden flex items-center justify-center group hover:border-border transition-colors duration-500`}>
                    {feature.image ? (
                      <div className="relative w-full group-hover:scale-[1.02] transition-transform duration-700 ease-out">
                         <div className="absolute inset-0 bg-gradient-to-tr from-brand-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 pointer-events-none" />
                         <img src={feature.image} alt={feature.title} className="w-full h-auto object-cover rounded-3xl shadow-2xl" />
                      </div>
                    ) : (
                      <>
                        {/* Background glow for the visual box */}
                        <div className={`absolute inset-0 bg-gradient-to-tr ${feature.bgGradient} opacity-20 group-hover:opacity-40 transition-opacity duration-700`} />
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-bl ${feature.bgGradient} opacity-10 blur-3xl pointer-events-none`} />
                        
                        {/* Huge Icon */}
                        <div className="scale-[4] sm:scale-[5] lg:scale-[6] text-brand-green/30 drop-shadow-2xl transition-transform duration-700 group-hover:scale-[4.5] sm:group-hover:scale-[5.5] lg:group-hover:scale-[6.5]">
                          {feature.icon}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
