import { Zap, HardDrive, PackageCheck, Layers, ArrowRight } from 'lucide-react';

export default function Features() {
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
    <section id="how-it-works" className="py-32 relative border-t border-border/30" data-scroll-section>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">

        {/* Sticky Left Header */}
        <div className="lg:col-span-4" data-scroll data-scroll-speed="0.5">
          <div className="lg:sticky lg:top-32 flex flex-col items-center text-center lg:items-start lg:text-left">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4 md:mb-6">
              Features.<br />
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
                className="group flex flex-col sm:flex-row items-center text-center sm:items-start sm:text-left gap-6 sm:gap-8 py-8 sm:py-12 border-b border-border/50 hover:bg-surface/30 transition-colors duration-500 px-6 -mx-6 sm:mx-0 sm:px-8 rounded-2xl"
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
  );
}
