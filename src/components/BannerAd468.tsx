import { useEffect, useRef, useState } from "react";

interface BannerAdProps {
  inHeader?: boolean;
}

export default function BannerAd468({ inHeader = false }: BannerAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous elements
    containerRef.current.innerHTML = "";

    // Set configuration object on global context
    const anyWindow = window as any;
    anyWindow.atOptions = {
      'key' : '38080c1c4102c7a84c9f875ea70181c7',
      'format' : 'iframe',
      'height' : 60,
      'width' : 468,
      'params' : {}
    };

    // Load active banner source tag
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://www.highperformanceformat.com/38080c1c4102c7a84c9f875ea70181c7/invoke.js";
    script.async = true;

    // Inject to container element
    containerRef.current.appendChild(script);
  }, [inHeader]);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const handleResize = () => {
      if (wrapperRef.current) {
        const width = wrapperRef.current.getBoundingClientRect().width;
        if (width < 468) {
          setScale(width / 468);
        } else {
          setScale(1);
        }
      }
    };

    handleResize();

    const observer = new ResizeObserver(() => {
      handleResize();
    });
    observer.observe(wrapperRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Calculate adjusted height to prevent empty spacing layout gaps on mobile devices
  const adjustedHeight = 60 * scale;

  return (
    <div 
      ref={wrapperRef}
      className={`flex flex-col items-center justify-center select-none w-full max-w-full overflow-hidden ${
        inHeader ? "py-0 h-[60px]" : "py-3"
      }`} 
      id={inHeader ? "header-ad-banner" : "body-ad-banner"}
    >
      {!inHeader && (
        <span className="text-[9px] uppercase font-mono text-slate-500 tracking-widest mb-1.5 font-bold">
          Sponsored Ad
        </span>
      )}
      <div 
        className="w-[468px] h-[60px] min-w-[468px] min-h-[60px] bg-slate-950/90 rounded-xl border border-slate-800/80 shadow-2xl relative flex items-center justify-center overflow-hidden origin-center transition-transform"
        style={{
          transform: `scale(${scale})`,
          marginLeft: `-${Math.max(0, (1 - scale) * 468 / 2)}px`,
          marginRight: `-${Math.max(0, (1 - scale) * 468 / 2)}px`,
          marginTop: inHeader ? "0px" : `-${Math.max(0, (1 - scale) * 30)}px`,
          marginBottom: inHeader ? "0px" : `-${Math.max(0, (1 - scale) * 30)}px`
        }}
      >
        {/* Ad Container Node */}
        <div ref={containerRef} className="absolute inset-0 w-[468px] h-[60px]" />
      </div>
    </div>
  );
}
