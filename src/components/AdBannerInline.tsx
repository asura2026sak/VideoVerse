import { useEffect, useRef } from "react";

const AD_KEY = "8d1953d6f4153fe95020b7b22b3c6103";

export default function AdBannerInline() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing contents to avoid duplicates during hot reloads or state shifts
    containerRef.current.innerHTML = "";

    // Create the target container div the invoke script fills
    const adContainer = document.createElement("div");
    adContainer.id = `container-${AD_KEY}`;
    adContainer.className = "flex items-center justify-center max-w-full overflow-hidden";
    containerRef.current.appendChild(adContainer);

    // Create the script tag pointing to the invocation script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://pl29655755.effectivecpmnetwork.com/${AD_KEY}/invoke.js`;
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div id="sponsored-ad-inline" className="w-full flex flex-col items-center justify-center py-2 animate-fadeIn">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-extrabold bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800/50">
          Sponsored Ad
        </span>
      </div>
      <div
        ref={containerRef}
        className="w-full max-w-[468px] min-h-[60px] flex items-center justify-center overflow-hidden bg-slate-950/20 border border-slate-900/50 rounded-xl shadow-inner"
      />
    </div>
  );
}
