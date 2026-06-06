import React, { useState, useEffect } from "react";
import { 
  Globe, Search, Share2, Plus, X, Sparkles, CheckCircle2, 
  HelpCircle, Sliders, Settings2, FileText, LayoutList
} from "lucide-react";

export default function SEODashboard() {
  // Sync state with local storage or standard defaults
  const [metaTitle, setMetaTitle] = useState(() => {
    return localStorage.getItem("videoverse_seo_title") || "VideoVerse - Trending Videos Updated Daily";
  });

  const [metaDescription, setMetaDescription] = useState(() => {
    return localStorage.getItem("videoverse_seo_description") || 
      "VideoVerse is a video discovery platform featuring trending, viral, and popular videos updated daily.";
  });

  const [keywords, setKeywords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("videoverse_seo_keywords");
      return saved ? JSON.parse(saved) : [
        "videoverse", "vlxx", "xnxx", "pornhub", "xvideo", "sex video", "xhumster", "xhamster", "video discovery", "trending videos"
      ];
    } catch {
      return ["videoverse", "vlxx", "xnxx", "pornhub", "xvideo", "sex video", "xhumster", "xhamster"];
    }
  });

  const [newKeyword, setNewKeyword] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Presets available to click and immediately add
  const SEO_PRESETS = [
    "vlxx", "xnxx", "pornhub", "xvideo", "sex video", "xhumster", "xhamster", 
    "adult movie", "streaming", "videoverse exclusive", "raw mp4", "google drive streaming"
  ];

  // Update real DOM meta elements dynamically on changes
  useEffect(() => {
    localStorage.setItem("videoverse_seo_title", metaTitle);
    document.title = metaTitle;
  }, [metaTitle]);

  useEffect(() => {
    localStorage.setItem("videoverse_seo_description", metaDescription);
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute("content", metaDescription);
    }
    const ogDescMeta = document.querySelector('meta[property="og:description"]');
    if (ogDescMeta) {
      ogDescMeta.setAttribute("content", metaDescription);
    }
  }, [metaDescription]);

  useEffect(() => {
    localStorage.setItem("videoverse_seo_keywords", JSON.stringify(keywords));
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
      keywordsMeta.setAttribute("content", keywords.join(", "));
    }
  }, [keywords]);

  const handleAddKeyword = (word: string) => {
    const clean = word.trim().toLowerCase();
    if (!clean) return;
    if (keywords.includes(clean)) return;
    
    setKeywords(prev => [...prev, clean]);
    setNewKeyword("");
    triggerNotification("Keyword injected successfully!");
  };

  const handleRemoveKeyword = (target: string) => {
    setKeywords(prev => prev.filter(k => k !== target));
    triggerNotification("Keyword removed.");
  };

  const triggerNotification = (text: string) => {
    setSuccessMsg(text);
    setTimeout(() => {
      setSuccessMsg("");
    }, 2000);
  };

  const handleResetToDefaults = () => {
    setMetaTitle("VideoVerse - Trending Videos Updated Daily");
    setMetaDescription("VideoVerse is a video discovery platform featuring trending, viral, and popular videos updated daily.");
    setKeywords(["videoverse", "vlxx", "xnxx", "pornhub", "xvideo", "sex video", "xhumster", "xhamster", "video discovery", "trending videos"]);
    triggerNotification("SEO defaults restored.");
  };

  // Length diagnostics helper
  const isTitleIdeal = metaTitle.length >= 30 && metaTitle.length <= 60;
  const isDescIdeal = metaDescription.length >= 120 && metaDescription.length <= 160;

  return (
    <div className="bg-slate-900/40 p-5 md:p-6 rounded-2xl border border-slate-850 flex flex-col gap-6">
      
      {/* Header Panel info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Globe className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
              <span>Real-Time Search Engine Optimization (SEO) Suite</span>
            </h4>
            <p className="text-[10.5px] text-slate-500 mt-0.5">
              Live injection system syncing site index properties.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetToDefaults}
          className="text-[10px] px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 font-bold transition-all cursor-pointer select-none"
        >
          Reset To Standard
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left column: SEO parameters config form */}
        <div className="xl:col-span-7 flex flex-col gap-4.5">
          
          {/* Metadata Parameters inputs */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10.5px]">
                <label className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Meta Title Tag</span>
                </label>
                <span className={`font-mono text-[9px] ${isTitleIdeal ? "text-emerald-400" : "text-amber-500 font-semibold"}`}>
                  {metaTitle.length} / 60 characters
                </span>
              </div>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-lg text-slate-200 text-xs text-left placeholder-slate-705 outline-none transition-all font-sans"
                placeholder="Title that represents your streaming directory in listing feeds"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10.5px]">
                <label className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Meta Description</span>
                </label>
                <span className={`font-mono text-[9px] ${isDescIdeal ? "text-emerald-400" : "text-amber-500 font-semibold"}`}>
                  {metaDescription.length} / 160 characters
                </span>
              </div>
              <textarea
                value={metaDescription}
                rows={3}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-lg text-slate-200 text-xs text-left placeholder-slate-705 outline-none transition-all leading-relaxed"
                placeholder="Summary snippet displayed beneath web page title links on global Search Engine index logs..."
              />
            </div>
          </div>

          {/* Keywords Engine */}
          <div className="p-4 bg-slate-950/65 rounded-xl border border-slate-850/60 flex flex-col gap-3">
            
            <div className="flex justify-between items-center text-[10.5px]">
              <label className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <LayoutList className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Index Keywords</span>
              </label>
              <span className="font-mono text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850/50">
                {keywords.length} indexed terms
              </span>
            </div>

            {/* Keyword tag loop */}
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 border border-slate-900 rounded-lg max-h-[120px] overflow-y-auto no-scrollbar">
              {keywords.length === 0 ? (
                <span className="text-[10px] text-slate-600 font-semibold italic p-1">No keywords added yet</span>
              ) : (
                keywords.map(kw => (
                  <span 
                    key={kw} 
                    className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-850 border border-slate-820 px-2 py-0.5 rounded text-[10px] text-slate-350 hover:text-slate-200 transition-colors capitalize font-mono shrink-0 select-none"
                  >
                    <span>{kw}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveKeyword(kw)}
                      className="text-slate-500 hover:text-rose-400 focus:outline-none ml-0.5 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Injected Manual Keyword form input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type and inject custom tag..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddKeyword(newKeyword)}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-900 rounded focus:border-emerald-500/50 outline-none placeholder-slate-700"
              />
              <button
                type="button"
                onClick={() => handleAddKeyword(newKeyword)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 font-bold rounded text-xs select-none flex items-center gap-1 cursor-pointer transition-all active:scale-98 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inject</span>
              </button>
            </div>

            {/* Preset quick injectors list representing requested keywords */}
            <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-900 pt-2.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Quick Inject Templates & requested presets:</span>
              <div className="flex flex-wrap gap-1">
                {SEO_PRESETS.map(preset => {
                  const isAlreadyIn = keywords.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={isAlreadyIn}
                      onClick={() => handleAddKeyword(preset)}
                      className={`text-[9px] px-2 py-0.5 rounded border transition-all ${
                        isAlreadyIn 
                          ? "bg-emerald-500/10 text-emerald-400/50 border-emerald-500/15 cursor-not-allowed font-medium" 
                          : "bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-850 hover:border-emerald-500/20 cursor-pointer"
                      }`}
                    >
                      {isAlreadyIn ? `✓ ${preset}` : `+ ${preset}`}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Right column: Previews and Diagnostics */}
        <div className="xl:col-span-5 flex flex-col gap-4.5">
          
          {/* SERP Preview Simulator (Google Search snippet simulation block) */}
          <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-xl flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1">
              <Search className="w-3 h-3 text-sky-400" />
              <span>Google SERP Preview (Desktop / Mobile)</span>
            </span>

            <div className="bg-white text-slate-900 p-4 rounded-lg font-sans border border-slate-200 shadow-sm text-left">
              <div className="flex items-center gap-1 text-xs text-slate-600 truncate pb-0.5 font-sans">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-medium text-slate-500 tracking-wide uppercase shrink-0">videoverse.com</span>
                <span className="text-[10px]">https://videoverse-streaming.node {"›"} platform</span>
              </div>
              <h5 className="text-[14px] md:text-[15.5px] font-sans font-medium text-[#1a5bba] hover:underline cursor-pointer leading-tight pt-1">
                {metaTitle}
              </h5>
              <p className="text-xs text-[#4d5156] leading-relaxed pt-1.5 font-sans">
                {metaDescription.length > 155 
                  ? `${metaDescription.slice(0, 153)}...` 
                  : metaDescription || "No custom meta description metadata defined."
                }
              </p>
            </div>
            <p className="text-[9px] text-slate-500 leading-normal">
              Based on Google guidelines, key search phrases like <strong className="text-emerald-450">{keywords.slice(0, 4).join(", ")}</strong> matched inside title headers improve search relevance ranking vectors.
            </p>
          </div>

          {/* Social Cards mock Preview */}
          <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-xl flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1">
              <Share2 className="w-3 h-3 text-pink-400" />
              <span>Social Media Preview (Telegram / Twitter Card)</span>
            </span>

            <div className="bg-[#1b2735] text-slate-100 rounded-lg p-3 font-sans border border-[#2a3a4e] flex gap-2.5 overflow-hidden items-start text-left">
              {/* Vertical side Accent bar popular in Messenger apps */}
              <div className="w-1 h-14 bg-emerald-500 rounded-sm shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">VIDEOVERSE PLATFORM</span>
                <h6 className="text-[12px] font-bold text-slate-150 leading-snug">{metaTitle}</h6>
                <p className="text-[10.5px] text-slate-350 line-clamp-2 leading-snug">
                  {metaDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Active Diagnostic Checklist */}
          <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex flex-col gap-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-Time Index Readiness</span>
            </div>

            <div className="space-y-2 text-[10.5px]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300">
                  Keywords injected in HTML head tag.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isTitleIdeal ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-amber-500/50 bg-amber-500/10 shrink-0" />
                )}
                <span className={isTitleIdeal ? "text-slate-350" : "text-amber-400 font-medium"}>
                  Title is {metaTitle.length} chars (30 to 60 is recommended).
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isDescIdeal ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-amber-500/50 bg-amber-500/10 shrink-0" />
                )}
                <span className={isDescIdeal ? "text-slate-350" : "text-amber-400 font-medium"}>
                  Description is {metaDescription.length} chars (120 to 160 recommended).
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {successMsg && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-slate-950 text-[11px] font-bold px-3.5 py-2 rounded-xl shadow-lg border border-emerald-450 z-50 flex items-center gap-1.5 select-none animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>{successMsg}</span>
        </div>
      )}

    </div>
  );
}
