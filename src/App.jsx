import React, { useEffect, useRef, useState } from 'react';
import LocomotiveScroll from 'locomotive-scroll';
import 'locomotive-scroll/dist/locomotive-scroll.css';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';

export default function App() {
  const scrollRef = useRef(null);
  const [downloadUrl, setDownloadUrl] = useState('#');

  useEffect(() => {
    fetch('https://api.github.com/repos/0xd34db8/NVM-OnTheFly/releases/latest')
      .then(res => res.json())
      .then(data => {
        if (data && data.assets) {
          const exeAsset = data.assets.find(asset => asset.name.endsWith('.exe'));
          if (exeAsset) {
            setDownloadUrl(exeAsset.browser_download_url);
          }
        }
      })
      .catch(err => console.error("Failed to fetch latest release:", err));

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

  return (
    <div data-scroll-container ref={scrollRef} className="min-h-screen bg-background text-foreground selection:bg-brand-green selection:text-black font-sans">
      <Navbar downloadUrl={downloadUrl} />
      <Hero downloadUrl={downloadUrl} />
      <Features />
      <Footer />
    </div>
  );
}
