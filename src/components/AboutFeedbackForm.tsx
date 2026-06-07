import React, { useState } from "react";
import { Sparkles, Send, CheckCircle2 } from "lucide-react";

export default function AboutFeedbackForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setIsSubmitting(true);
    // Simulate real database ticket submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      // Reset
      setName("");
      setEmail("");
      setMessage("");
    }, 1200);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-850 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row gap-8 items-start justify-between">
      <div className="max-w-md w-full">
        <span className="text-[10px] bg-emerald-400/10 border border-emerald-500/20 text-emerald-400 font-mono uppercase tracking-widest font-bold px-2.5 py-1 rounded-md">
          COMMUNITY FEEDBACK
        </span>
        <h3 className="text-xl font-extrabold text-slate-100 mt-4 tracking-tight">
          Have Suggestions or Questions?
        </h3>
        <p className="text-slate-400 text-xs md:text-sm mt-2 leading-relaxed">
          Our curator engine improves based on user streaming reports. Submit a support inquiry or request custom syndication categories directly here.
        </p>
        
        <div className="mt-6 flex flex-col gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
            <span>Response time: &lt; 24 Hours</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span>Server region:</span>
            <span className="text-emerald-400 font-bold">Cloud Run Sandbox East</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl w-full max-w-lg transition-all relative overflow-hidden">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white tracking-tight">
              Feedback Safe on Server!
            </h4>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
              We received your technical ticket. It has been successfully logged with our curator team. Thank you for making VideoVerse better!
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-5 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/20 text-slate-300 hover:text-emerald-400 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer"
            >
              Send Another Ticket
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="Anonymous Viewer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3.5 py-2 bg-slate-900/60 border border-slate-800 focus:border-emerald-500/40 text-slate-100 rounded-xl text-xs font-sans placeholder-slate-600 focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3.5 py-2 bg-slate-900/60 border border-slate-800 focus:border-emerald-500/40 text-slate-100 rounded-xl text-xs font-sans placeholder-slate-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">
                Detailed Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Suggest a new design, streaming speed feedback, or bug report..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="px-3.5 py-2 bg-slate-900/60 border border-slate-800 focus:border-emerald-500/40 text-slate-100 rounded-xl text-xs font-sans placeholder-slate-600 focus:outline-none transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-600/50 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/15 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  <span>TRANSMITTING INQUIRY...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>SUBMIT GENERAL ENQUIRY</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
