import { useEffect, useRef } from "react";

export default function NativeBannerAd() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous scripts/ads if any to avoid duplicated rendering
    containerRef.current.innerHTML = "";

    // Create container element first
    const adContainer = document.createElement("div");
    adContainer.id = "container-8d1953d6f4153fe95020b7b22b3c6103";
    containerRef.current.appendChild(adContainer);

    // Create script element
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://pl29655755.effectivecpmnetwork.com/8d1953d6f4153fe95020b7b22b3c6103/invoke.js";
    script.async = true;
    script.setAttribute("data-cfasync", "false");

    // Inject to root container ref
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="w-full max-w-full flex flex-col items-center justify-center py-4 px-2 sm:px-0" id="sponsored-native-ad-wrapper">
      <span className="text-[9px] uppercase font-mono text-slate-500 tracking-widest mb-1.5 font-bold">
        Sponsored Spotlight
      </span>
      <div 
        ref={containerRef} 
        className="w-full max-w-2xl min-h-[100px] flex items-center justify-center bg-slate-950/70 border border-slate-800/80 rounded-2xl relative overflow-x-auto p-4 shadow-xl"
      />
    </div>
  );
}

