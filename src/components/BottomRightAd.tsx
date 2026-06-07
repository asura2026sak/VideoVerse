import React, { useState, useEffect } from "react";
import { X, ExternalLink, Sparkles, AlertCircle, Share2, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function BottomRightAd() {
  const [isVisible, setIsVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Stagger entry slightly for realistic attention grabbing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-4 right-4 z-[9999] max-w-[360px] w-[calc(100vw-32px)] pointer-events-none">
        
        {minimized ? (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setMinimized(false)}
            className="pointer-events-auto ml-auto flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold rounded-full shadow-2xl hover:bg-slate-900 transition-all cursor-pointer float-right animate-pulse"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>1 SPONSORED AD MINIMIZED</span>
          </motion.button>
        ) : (
          <motion.div
            initial={{ y: 50, x: 20, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, x: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.95, opacity: 0 }}
            className="pointer-events-auto w-full bg-slate-950/95 border border-emerald-500/30 rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.15)] flex flex-col p-4 md:p-5 relative overflow-hidden backdrop-blur-lg"
          >
            {/* Top Border Glow gradient */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500" />
            
            {/* Header info */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-900/80">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  Social Bar Ad
                </span>
                <span className="text-[9px] text-slate-505 font-mono">1.1k Views/Hr</span>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setMinimized(true)}
                  className="text-slate-500 hover:text-slate-350 p-1 rounded-md text-[10px] font-mono hover:bg-slate-900 transition-all cursor-pointer"
                  title="Minimize"
                >
                  MINIMIZE
                </button>
                <button 
                  onClick={() => setIsVisible(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-900 transition-all cursor-pointer"
                  aria-label="Close Ad"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Interactive Ad Body Content mimicking the CPM network style but looking cleaner */}
            <div className="flex gap-3.5 mt-3">
              {/* Fake High CTR thumbnail */}
              <div className="w-16 h-16 shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center border border-slate-800 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-all" />
                <Award className="w-8 h-8 text-slate-950 stroke-[2.5] relative z-10 animate-bounce" />
                <div className="absolute bottom-0 right-0 left-0 bg-slate-950/80 text-[8px] text-center text-amber-400 font-mono py-0.5 font-bold">
                  HOT DEAL
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs md:text-sm font-extrabold text-white leading-tight tracking-tight hover:text-emerald-450 transition-all cursor-pointer">
                    Win up to $1,500 Daily Premium Play Token!
                  </h4>
                  <p className="text-[10px] text-slate-440 mt-1 leading-relaxed">
                    Verify stream speed and claim your instant CPM network lucky slot reward. No CC required.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-900">
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Sponsored by EffectiveCPM</span>
              </div>
              
              <a
                href="https://pl29655754.effectivecpmnetwork.com/93/be/cc/93becc01d3563510dfc5c523ccc704c2.js"
                target="_blank"
                referrerPolicy="no-referrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-slate-950 text-[10px] font-bold rounded-xl transition-all hover:scale-[1.03] shadow-md hover:shadow-emerald-500/20 shadow-emerald-500/10 cursor-pointer pointer-events-auto"
              >
                <span>CLAIM REWARD</span>
                <ExternalLink className="w-2.5 h-2.5 stroke-[2.5]" />
              </a>
            </div>
          </motion.div>
        )}

      </div>
    </AnimatePresence>
  );
}
