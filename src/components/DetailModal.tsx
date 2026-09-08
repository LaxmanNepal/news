import { useEffect } from "react";
import { ArrowUpRight, Bookmark, Share2, X } from "lucide-react";
import { FEED_MAP, np } from "../data/feeds";
import type { Article } from "../lib/rss";
import { fullDateNe, timeAgoNe } from "../lib/rss";

interface Props {
  article: Article;
  now: number;
  saved: boolean;
  onToggleSaved: () => void;
  onClose: () => void;
}

export default function DetailModal({ article, now, saved, onToggleSaved, onClose }: Props) {
  const src = FEED_MAP[article.sourceId];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, url: article.link });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(article.link);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <button className="fade-in absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="बन्द गर्नुहोस्" />
      <div className="glass-strong animate-sheet-up relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[28px] sm:max-w-3xl sm:animate-pop-in sm:rounded-[28px]">
        <div className="flex justify-center pb-1 pt-2.5 sm:hidden">
          <span className="h-1.5 w-12 rounded-full bg-white/25" />
        </div>

        <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.1] font-mono text-[10px] font-bold text-cy">
              {src?.tag ?? "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-[13px] font-bold text-fog">{src?.name ?? article.sourceId}</p>
              <p className="font-mono text-[10px] tabular-nums text-faint">{timeAgoNe(article.pubDate, now)} · {fullDateNe(article.pubDate)}</p>
            </div>
          </div>
          <button onClick={onClose} className="press flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.1] text-fog hover:bg-white/[0.18]" aria-label="बन्द गर्नुहोस्">
            <X size={16} />
          </button>
        </div>

        <div className="scroll-thin flex-1 overflow-y-auto">
          {article.image && (
            <div className="aspect-[16/9] overflow-hidden">
              <img src={article.image} alt={article.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="p-5 sm:p-7">
            <h1 className="font-display text-[24px] font-black leading-tight text-fog sm:text-[32px]">
              {article.title}
            </h1>
            {article.description && (
              <p className="mt-4 font-body text-[15px] font-medium leading-relaxed text-dim">
                {article.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-white/[0.08] px-5 py-3">
          <button onClick={onToggleSaved} className={`press flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 font-body text-[13px] font-bold ${saved ? "bg-gold text-ink" : "bg-white/[0.08] text-fog"}`}>
            <Bookmark size={15} fill={saved ? "currentColor" : "none"} /> {saved ? "सेभ गरिएको" : "सेभ गर्नुहोस्"}
          </button>
          <button onClick={handleShare} className="press flex flex-1 items-center justify-center gap-2 rounded-full bg-white/[0.08] py-2.5 font-body text-[13px] font-bold text-fog">
            <Share2 size={15} /> सेयर
          </button>
          <a href={article.link} target="_blank" rel="noreferrer" className="press flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0a84ff] to-[#64d2ff] py-2.5 font-body text-[13px] font-bold text-white">
            मूल लिङ्क <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
