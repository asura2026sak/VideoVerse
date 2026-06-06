import { useEffect, useRef } from "react";
import { ExternalLink, Sparkles } from "lucide-react";

export default function SponsorAd() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Ensure the container is empty before appending to prevent duplicate renders on re-mounts
    containerRef.current.innerHTML = "";

    // Set configuration options globally for the ad script
    (window as any).atOptions = {
      'key': '38080c1c4102c7a84c9f875ea70181c7',
      'format': 'iframe',
      'height': 60,
      'width': 468,
      'params': {}
    };

    // Create script element to trigger invoke.js
    const script = document.createElement("script");
    script.src = "https://www.highperformanceformat.com/38080c1c4102c7a84c9f875ea70181c7/invoke.js";
    script.async = true;

    // Append script to the targeted div
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-8 items-center justify-between bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/20 border-2 border-emerald-500/30 p-8 md:p-10 rounded-3xl mt-8 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient lights */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex-1 flex flex-col gap-4 relative z-10 w-full">
        <span className="text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono uppercase tracking-widest font-black px-3.5 py-1.5 rounded-full w-fit shadow-sm">
          🔥 Featured Premium Offer
        </span>
        <h4 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-emerald-400 animate-pulse" />
          <span>Recommended Content Partner</span>
        </h4>
        <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl font-medium">
          Unlock the ultimate high-speed premium content network. Get exclusive offers, unlimited streaming boosters, ad-free enhancements, and fully customized modern video curation panels right now!
        </p>
        <a
          href="https://www.effectivecpmnetwork.com/hswm92uqx?key=910b8f90bb4e41f71cf53632f2325bcb"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 font-extrabold text-sm md:text-base px-8 py-4 rounded-2xl hover:scale-[1.03] active:scale-95 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center sm:justify-start gap-2.5 w-full sm:w-fit mt-2 border border-emerald-400/20 uppercase tracking-wider"
          id="sponsor-link"
        >
          <span>Claim Your Free Sponsor Access Here</span>
          <ExternalLink className="w-5 h-5 stroke-[2.5]" />
        </a>
      </div>

      <div className="flex flex-col items-center gap-2.5 shrink-0 bg-slate-950/60 border border-slate-850 p-4 rounded-2xl relative z-10 w-full lg:w-auto">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">
          High Performance Partner Ad Banner
        </span>
        <div 
          ref={containerRef} 
          className="w-full lg:w-[468px] min-w-[280px] h-[60px] bg-slate-900/40 rounded-xl flex items-center justify-center text-slate-500 text-[11px] font-mono border border-slate-800/60 overflow-hidden" 
          id="ad-banner-placement"
        >
          Loading Partner Banner...
        </div>
      </div>
    </div>
  );
}
