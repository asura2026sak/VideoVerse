import { useEffect, useRef } from "react";

export default function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing contents to avoid duplicates during hot reloads or state shifts
    containerRef.current.innerHTML = "";

    // 1. Set the global options Object required by the script
    (window as any).atOptions = {
      key: "38080c1c4102c7a84c9f875ea70181c7",
      format: "iframe",
      height: 60,
      width: 468,
      params: {},
    };

    // 2. Create the ad wrapper element
    const wrapper = document.createElement("div");
    wrapper.id = "ad-wrapper-38080c1c4102c7a84c9f875ea70181c7";
    wrapper.className = "flex items-center justify-center max-w-full overflow-hidden";
    containerRef.current.appendChild(wrapper);

    // 3. Create the script tag pointing to full invocation script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://www.highperformanceformat.com/38080c1c4102c7a84c9f875ea70181c7/invoke.js";
    script.async = true;

    // 4. Append script inside the wrapper container so it injects the iframe in the exact correct position
    wrapper.appendChild(script);

    return () => {
      // Clean up variables and clear the script container when the component unmounts
      try {
        delete (window as any).atOptions;
      } catch (e) {
        (window as any).atOptions = undefined;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div id="sponsored-ad-banner" className="w-full flex flex-col items-center justify-center py-2 animate-fadeIn">
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
