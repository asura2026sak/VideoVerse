import React, { useState, useEffect } from "react";
import { 
  Globe, Search, Share2, Plus, X, Sparkles, CheckCircle2, 
  HelpCircle, Sliders, Settings2, FileText, LayoutList,
  Download, Copy, ChevronDown, ChevronUp, Check, AlertCircle, RefreshCw
} from "lucide-react";
import { Video } from "../types";

interface SEODashboardProps {
  videos?: Video[];
}

export default function SEODashboard({ videos = [] }: SEODashboardProps) {
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
  
  // Interactive UI toggles
  const [showSitemap, setShowSitemap] = useState(false);
  const [showSEOManual, setShowSEOManual] = useState(true);
  const [showSchemaPreview, setShowSchemaPreview] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Presets available to click and immediately add
  const SEO_PRESETS = [
    "vlxx", "xnxx", "pornhub", "xvideo", "sex video", "xhumster", "xhamster", 
    "adult movie", "streaming", "videoverse exclusive", "raw mp4", "google drive streaming"
  ];

  // Update real DOM meta elements dynamically on changes
  useEffect(() => {
    localStorage.setItem("videoverse_seo_title", metaTitle);
    const titleElem = document.querySelector("title");
    if (titleElem) titleElem.innerText = metaTitle;
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

  // XML Sitemap Generator
  const generateSitemapXml = () => {
    const baseUrl = window.location.origin || "https://videoverse-streaming.org";
    const dateStr = new Date().toISOString().split("T")[0];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;
    
    // Main homepage
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${dateStr}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // Dynamic Pages for each Video index item
    videos.forEach(v => {
      const videoCleanTitle = encodeURIComponent(v.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      const videoLoc = `${baseUrl}/?video=${v.id}`;
      const uploadDateClean = v.uploadDate || dateStr;
      
      xml += `  <url>\n`;
      xml += `    <loc>${videoLoc}</loc>\n`;
      xml += `    <lastmod>${uploadDateClean}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      
      // Google Video Sitemap extension markup! Highly prized by search bots
      xml += `    <video:video>\n`;
      xml += `      <video:thumbnail_loc>${v.thumbnailUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"}</video:thumbnail_loc>\n`;
      xml += `      <video:title><![CDATA[${v.title}]]></video:title>\n`;
      xml += `      <video:description><![CDATA[${v.description || "Watch viral trending video content"}]]></video:description>\n`;
      xml += `      <video:publication_date>${uploadDateClean}T00:00:00+00:00</video:publication_date>\n`;
      xml += `      <video:duration>${v.durationSeconds || 120}</video:duration>\n`;
      xml += `      <video:family_friendly>no</video:family_friendly>\n`;
      xml += `    </video:video>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;
    return xml;
  };

  const handleCopySitemap = () => {
    const xml = generateSitemapXml();
    navigator.clipboard.writeText(xml);
    setIsCopied(true);
    triggerNotification("Copied Sitemap to Clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadSitemap = () => {
    const xml = generateSitemapXml();
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sitemap.xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerNotification("sitemap.xml download started!");
  };

  // Mock Active Schema preview markup
  const activeSchemaJson = videos.length > 0 ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": videos[0].title,
    "description": videos[0].description,
    "thumbnailUrl": [videos[0].thumbnailUrl],
    "uploadDate": videos[0].uploadDate || "2026-06-01",
    "duration": `PT${videos[0].durationSeconds || 180}S`,
    "embedUrl": `${window.location.origin}/?video=${videos[0].id}`,
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": { "@type": "WatchAction" },
      "userInteractionCount": videos[0].views || 3421
    }
  }, null, 2) : "/* No videos uploaded to seed Schema object */";

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
              Live injection system syncing site index properties & sitemaps.
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

          {/* DYNAMIC XML SITEMAP section */}
          <div className="p-4 bg-slate-950/65 rounded-xl border border-slate-850/60 flex flex-col gap-3">
            <div 
              onClick={() => setShowSitemap(!showSitemap)}
              className="flex justify-between items-center cursor-pointer select-none"
            >
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dynamic Robots XML Sitemap Builder</span>
                <span className="bg-emerald-500/15 text-emerald-450 border border-emerald-500/20 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase">
                  Google compatible
                </span>
              </h5>
              {showSitemap ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {showSitemap && (
              <div className="flex flex-col gap-3 animate-fadeIn mt-1 pt-2 border-t border-slate-900">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Search engine bots index your platform much faster when you submit a structured <code className="bg-slate-900 text-emerald-400 px-1 py-0.5 rounded">sitemap.xml</code> mapping all videos. Our engine automatically nests active play URLs and thumbnail assets.
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 relative max-h-[180px] overflow-y-auto no-scrollbar">
                  <pre className="font-mono text-[9.5px] text-slate-400 text-left whitespace-pre-wrap">
                    {generateSitemapXml()}
                  </pre>
                </div>
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleCopySitemap}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 font-bold transition-all cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied!" : "Copy XML Schema"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSitemap}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download sitemap.xml</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DYNAMIC SCHEMA.ORG PREVIEW */}
          <div className="p-4 bg-slate-950/65 rounded-xl border border-slate-850/60 flex flex-col gap-3">
            <div 
              onClick={() => setShowSchemaPreview(!showSchemaPreview)}
              className="flex justify-between items-center cursor-pointer select-none"
            >
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Rich Snippets: Schema JSON-LD Checker</span>
                <span className="bg-sky-500/10 text-sky-400 border border-sky-500/15 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase">
                  Active in Background
                </span>
              </h5>
              {showSchemaPreview ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {showSchemaPreview && (
              <div className="flex flex-col gap-2 animate-fadeIn mt-1 pt-2 border-t border-slate-900">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  We dynamically inject **Schema.org VideoObject** JSON-LD blocks on video selection. This lets Google render rich thumbnail badges on search results. Check out the current raw active segment:
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 max-h-[150px] overflow-y-auto no-scrollbar">
                  <pre className="font-mono text-[9px] text-amber-400/80 text-left whitespace-pre-wrap">
                    {activeSchemaJson}
                  </pre>
                </div>
              </div>
            )}
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
                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-medium text-slate-500 tracking-wide uppercase shrink-0">videoverse.org</span>
                <span className="text-[10px]">{window.location.origin || "https://videoverse-streaming.org"} {"›"} watch</span>
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
              Based on search guidelines, key phrases like <strong className="text-emerald-450">{keywords.slice(0, 4).join(", ")}</strong> matched inside title tags improve organic CTR index results.
            </p>
          </div>

          {/* Handbook - Why site SEO decreases and how to make it shoot up */}
          <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex flex-col gap-2.5">
            <div 
              onClick={() => setShowSEOManual(!showSEOManual)}
              className="flex justify-between items-center cursor-pointer select-none"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Search Ranking Optimizer handbook</span>
              </div>
              {showSEOManual ? <ChevronUp className="w-3.5 h-3.5 text-slate-450" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-450" />}
            </div>

            {showSEOManual && (
              <div className="space-y-3.5 text-[11px] text-slate-300 leading-relaxed border-t border-slate-900 pt-2.5 animate-fadeIn">
                <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Dynamic Video SEO Applied!</span>
                  </span>
                  <p className="text-slate-450 text-[10px]">
                    We just implemented automatic SEO swapping! Now, whenever you or a reader opens a specific video, the page metadata (Title, Description, Keywords, and Open Graph Thumbnails) updates instantly. Search engine spiders and messaging bots index the video's details instead of just a generic homepage.
                  </p>
                </div>

                <div className="space-y-2">
                  <h6 className="font-bold text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-405" />
                    <span>Why did my search traffic drop?</span>
                  </h6>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-[10px]">
                    <li>
                      <strong className="text-slate-350">Missing Sitemap.xml:</strong> Spiders search blind without it. Expand the Sitemap panel above, click **Download sitemap.xml**, and upload it!
                    </li>
                    <li>
                      <strong className="text-slate-350">Intrusive Ads Penalty:</strong> Ads network scripts (like Popunders) are great, but dense popups can trigger Google SafeSearch/Page Experience filters. High bounce rates tell search algorithms the page lacks value. Keep ads balanced.
                    </li>
                    <li>
                      <strong className="text-slate-350">Stagnant Page Metadata:</strong> React Single Page Apps naturally serve only one document. Our dynamic metadata injector fixes this by rewriting head properties at run-time.
                    </li>
                    <li>
                      <strong className="text-slate-355">Slow Initial Paint (CLS):</strong> Unstructured elements cause layout shifts. Maintain proper video player containers to preserve search rankings.
                    </li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h6 className="font-extrabold text-slate-200">Action items to triple SEO search traffic:</h6>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[10px]">
                    <li>Go to <strong className="text-slate-300">Google Search Console</strong> and verify ownership using the HTML Meta Tag method (add your token to index.html).</li>
                    <li>Submit your exported <strong className="text-slate-300">sitemap.xml</strong> under Indexing {"›"} Sitemaps.</li>
                    <li>Keep adding customized categories and niche tags to videos to capture regional traffic.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Active Diagnostic Checklist */}
          <div className="p-4 bg-slate-950/45 border border-slate-850 rounded-xl flex flex-col gap-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-Time Index Readiness</span>
            </div>

            <div className="space-y-2 text-[10.5px]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-350 flex-1">
                  Keywords injected in HTML head tag.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isTitleIdeal ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-amber-500/50 bg-amber-500/10 shrink-0" />
                )}
                <span className={isTitleIdeal ? "text-slate-350 flex-1" : "text-amber-400 font-medium flex-1"}>
                  Title is {metaTitle.length} chars (30 to 60 is recommended).
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isDescIdeal ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-amber-500/50 bg-amber-500/10 shrink-0" />
                )}
                <span className={isDescIdeal ? "text-slate-350 flex-1" : "text-amber-400 font-medium flex-1"}>
                  Description is {metaDescription.length} chars (120 to 160 recommended).
                </span>
              </div>
              <div className="flex items-center gap-2 border-t border-slate-900 pt-1.5 mt-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400/90 font-medium flex-1">
                  Dynamic Video swapping metadata tag support active!
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-405/90 font-medium flex-1">
                  Google JSON-LD VideoObject rich snippet active!
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
