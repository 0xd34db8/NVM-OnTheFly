import { Cpu, FolderSearch, ListTree, PackageOpen, TerminalSquare, HardDrive, Zap } from 'lucide-react';

export default function Features() {
  const features = [
    {
      title: "Native Engine Integration",
      description: "Hooks directly into your existing nvm-sh and nvm-windows installations. Zero lock-in and 100% compatibility—what you see is what your terminal gets.",
      icon: <Cpu strokeWidth={1.5} className="w-6 h-6 text-brand-green" />,
      colSpan: "lg:col-span-8",
      bgGradient: "from-brand-green/20 to-transparent"
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
      bgGradient: "from-brand-green/10 to-transparent"
    },
    {
      title: "Global Package Manager",
      description: "List, update, and uninstall global packages. Seamlessly migrate your favorite packages from older Node versions during new installations.",
      icon: <PackageOpen strokeWidth={1.5} className="w-6 h-6 text-brand-green" />,
      colSpan: "lg:col-span-4",
      bgGradient: "from-brand-green/10 to-transparent"
    },
    {
      title: "Interactive Console",
      description: "A slide-up terminal console streams real-time logs from tasks and lets you execute arbitrary shell commands across engines.",
      icon: <TerminalSquare strokeWidth={1.5} className="w-6 h-6 text-brand-green" />,
      colSpan: "lg:col-span-4",
      bgGradient: "from-brand-green/10 to-transparent"
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
    <section id="features" className="py-32 relative border-t border-border/30 bg-background overflow-hidden" data-scroll-section>
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-green/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center mb-20" data-scroll data-scroll-speed="0.2">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6">
            Powerful Features.<br />
            <span className="text-muted">Designed for Productivity.</span>
          </h2>
          <p className="text-muted leading-relaxed font-light max-w-2xl mx-auto">
            Experience a modern GUI wrapper for NVM that hooks directly into your existing system installations via native shell execution.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-3xl border border-border/50 bg-surface/30 backdrop-blur-sm p-8 transition-all duration-500 hover:border-border hover:bg-surface/50 ${feature.colSpan}`}
              data-scroll
              data-scroll-speed={0.1 + (index * 0.05)}
            >
              {/* Subtle top-right gradient that appears on hover */}
              <div className={`absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-bl ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-bl-full pointer-events-none blur-3xl`} />
              
              <div className="relative z-10 h-full flex flex-col justify-start">
                <div className="w-12 h-12 rounded-2xl bg-surface border border-border/50 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:bg-brand-green/10 transition-all duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-medium tracking-tight text-foreground mb-3 group-hover:text-brand-green transition-colors duration-500">
                  {feature.title}
                </h3>
                <p className="text-muted leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
