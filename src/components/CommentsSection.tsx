import React, { useState } from "react";
import { MessageSquarePlus, MessageSquare, Send, Calendar } from "lucide-react";
import { Comment, Video } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface CommentsSectionProps {
  video: Video;
  comments: Comment[];
  onAddComment: (videoId: string, text: string, author: string) => void;
}

export default function CommentsSection({ video, comments, onAddComment }: CommentsSectionProps) {
  const [commentText, setCommentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedText = commentText.trim();
    const trimmedAuthor = authorName.trim() || "Anonymous Viewer";

    if (!trimmedText) {
      setErrorMsg("Please write some comment text before posting.");
      return;
    }

    if (trimmedText.length > 500) {
      setErrorMsg("Comments are restricted to 500 characters max.");
      return;
    }

    onAddComment(video.id, trimmedText, trimmedAuthor);
    setCommentText("");
    // We can keep the author name saved in the state so they don't have to retype it
  };

  // Helper to generate initials for avatar placeholders
  const getInitials = (name: string) => {
    const spaceIdx = name.indexOf(" ");
    if (spaceIdx === -1) return name.slice(0, 2).toUpperCase();
    return (name[0] + name[spaceIdx + 1]).toUpperCase();
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-lg flex flex-col gap-6">
      
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-slate-800/70 pb-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-emerald-450" />
          <span>Comments ({comments.length})</span>
        </h2>
        <span className="text-xs font-mono text-slate-400">
          Showing discussion for <span className="text-slate-205 font-bold">"{video.title}"</span>
        </span>
      </div>

      {/* Post a new Comment form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Your name (optional, defaults to Anonymous)"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value.slice(0, 30))}
            className="px-4 py-2 text-sm rounded-xl bg-slate-950/75 border border-slate-800 focus:border-emerald-500 focus:outline-none transition-colors outline-none text-slate-200 placeholder-slate-500 max-w-[280px]"
          />
        </div>

        <div className="relative">
          <textarea
            placeholder="Introduce yourself or share what you think about this film..."
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              if (errorMsg) setErrorMsg("");
            }}
            rows={2}
            className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-950/75 border border-slate-800 focus:border-emerald-500 focus:outline-none transition-colors outline-none text-slate-200 placeholder-slate-500 resize-none pr-12"
          />
          <button
            type="submit"
            className="absolute right-2 bottom-3.5 p-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors active:scale-90"
            title="Post Comment"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Display limit & Error messages */}
        <div className="flex justify-between items-center px-1">
          <span className={`text-[11px] ${commentText.length > 450 ? "text-rose-400 font-bold" : "text-slate-500"}`}>
            {commentText.length}/500 chars limit
          </span>
          {errorMsg && (
            <span className="text-xs font-semibold text-rose-450">{errorMsg}</span>
          )}
        </div>
      </form>

      {/* List / Feed of comments */}
      <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1">
        <AnimatePresence initial={false} mode="popLayout">
          {comments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-slate-500 flex flex-col items-center gap-1.5"
            >
              <MessageSquarePlus className="w-8 h-8 text-slate-600" />
              <p className="text-xs font-semibold">No comments posted yet.</p>
              <p className="text-[11px] text-slate-400">Be the first to start the discussion!</p>
            </motion.div>
          ) : (
            comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex gap-3.5 p-3.5 bg-slate-950/40 rounded-xl border border-slate-900"
              >
                {/* Avatar circle */}
                <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-500/80 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                  {comment.avatar ? (
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If avatar load fails, clear src to fallback on clean text design initials
                        (e.target as HTMLImageElement).src = "";
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : null}
                  <span className="truncate">{getInitials(comment.author)}</span>
                </div>

                {/* Text node */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-205 select-text">
                      {comment.author}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed break-words whitespace-pre-line select-text font-normal">
                    {comment.text}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
