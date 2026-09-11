import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Check, ChevronLeft, ChevronRight, Link2, Share2, X } from "lucide-react";
import { FEED_MAP } from "../data/feeds";
import type { Article } from "../lib/rss";
import { fullDateNe, np, timeAgoNe } from "../lib/rss";

interface Props {
  article: Article;
  now: number;
  saved: boolean;
  onToggleSaved: () => void;
  onClose: () => void;
  previous?: Article;
  next?: Article;
  related: Article[];
  onOpenArticle: (article: Article) => void;
}

function Meta({ article, now }: { article: Article; now: number }) {
  const source = FEED_MAP[article.sourceId];
  return <div className="flex min-w-0 items-center gap-2">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.1] font-mono text-[10px] font-black text-cy">{source?.tag ?? "?"}</span>
    <div className="min-w-0">
      <p className="truncate font-body text-[13px] font-bold text-fog">{source?.name ?? article.sourceId}</p>
      <p className="font-mono text-[10px] tabular-nums text-faint">{timeAgoNe(article.pubDate, now)} · {fullDateNe(article.pubDate)}</p>
    </div>
  </div>;
}

export default function ArticleReader({ article, now, saved, onToggleSaved, onClose, previous, next, related, onOpenArticle }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setProgress(0);
  }, [article.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && previous) onOpenArticle(previous);
      if (e.key === "ArrowRight" && next) onOpenArticle(next);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, onOpenArticle, previous, next]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 100);
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: article.title, text: article.description, url: article.link });
      else { await navigator.clipboard.writeText(article.link); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    } catch {}
  };

  const openSource = () => window.open(article.link, "_blank", "noopener,noreferrer");
  const source = FEED_MAP[article.sourceId];

  return <div className="fixed inset-0 z-[70] bg-ink/95 backdrop-blur-2xl">
    <div className="absolute left-0 right-0 top-0 z-20 h-1 bg-white/[0.08]"><div className="h-full bg-cy transition-[width] duration-150" style={{ width: `${progress}%` }} /></div>
    <header className="relative z-10 flex h-16 items-center gap-3 border-b border-white/[0.08] bg-ink/60 px-4 backdrop-blur-xl sm:px-7">
      <button onClick={onClose} className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-fog" aria-label="बन्द गर्नुहोस्"><X size={18}/></button>
      <div className="min-w-0 flex-1"><Meta article={article} now={now}/></div>
      <div className="hidden items-center gap-2 sm:flex"><span className="font-mono text-[10px] text-faint">{np(progress)}%</span><button onClick={onToggleSaved} className={`press flex h-10 items-center gap-2 rounded-full px-4 text-[12px] font-bold ${saved ? "bg-gold text-ink" : "bg-white/[0.08] text-fog"}`}><Bookmark size={15} fill={saved ? "currentColor" : "none"}/>{saved ? "सेभ गरिएको" : "सेभ"}</button><button onClick={share} className="press flex h-10 items-center gap-2 rounded-full bg-white/[0.08] px-4 text-[12px] font-bold text-fog">{copied ? <Check size={15}/> : <Share2 size={15}/>} {copied ? "लिङ्क कपी भयो" : "सेयर"}</button></div>
    </header>

    <main ref={scrollRef} onScroll={onScroll} onTouchStart={e => { touchStart.current = e.touches[0]?.clientX ?? null; }} onTouchEnd={e => { const start = touchStart.current; touchStart.current = null; if (start == null) return; const dx = (e.changedTouches[0]?.clientX ?? start) - start; if (Math.abs(dx) > 70) { if (dx < 0 && next) onOpenArticle(next); if (dx > 0 && previous) onOpenArticle(previous); } }} className="scroll-thin h-[calc(100dvh-4rem)] overflow-y-auto">
      <article className="mx-auto max-w-4xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <div className="mb-5 flex items-center justify-between gap-3 sm:hidden"><Meta article={article} now={now}/><span className="font-mono text-[10px] text-faint">{np(progress)}%</span></div>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {article.breaking && <span className="rounded-full bg-red-500/15 px-3 py-1 font-mono text-[10px] font-black text-red-300">BREAKING</span>}
          {source?.category && <span className="rounded-full bg-cy/10 px-3 py-1 font-body text-[11px] font-bold text-cy">{source.category}</span>}
          {article.trendingScore != null && <span className="rounded-full bg-white/[0.07] px-3 py-1 font-mono text-[10px] text-faint">TREND {np(Math.round(article.trendingScore))}</span>}
        </div>
        <h1 className="font-display text-[30px] font-black leading-[1.08] tracking-tight text-fog sm:text-[48px]">{article.title}</h1>
        <p className="mt-5 font-body text-[17px] font-medium leading-relaxed text-dim sm:text-[20px]">{article.description}</p>

        {article.image && <figure className="mt-8 overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.03] shadow-2xl"><img src={article.image} alt="" className="max-h-[560px] w-full object-cover" loading="eager" onError={e => { e.currentTarget.parentElement?.classList.add("hidden"); }}/><figcaption className="px-4 py-2 font-mono text-[9px] text-faint">{source?.name ?? article.sourceId}</figcaption></figure>}

        <div className="mt-8 flex flex-wrap gap-2 border-y border-white/[0.08] py-4">
          <button onClick={onToggleSaved} className={`press flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-bold ${saved ? "bg-gold text-ink" : "bg-white/[0.08] text-fog"}`}><Bookmark size={15} fill={saved ? "currentColor" : "none"}/>{saved ? "सेभ गरिएको" : "सेभ गर्नुहोस्"}</button>
          <button onClick={share} className="press flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2.5 text-[12px] font-bold text-fog">{copied ? <Check size={15}/> : <Share2 size={15}/>}सेयर</button>
          <button onClick={() => navigator.clipboard?.writeText(article.link).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800); })} className="press flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2.5 text-[12px] font-bold text-fog"><Link2 size={15}/>लिङ्क कपी</button>
          <button onClick={openSource} className="press flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0a84ff] to-[#64d2ff] px-4 py-2.5 text-[12px] font-bold text-white">मूल स्रोत <ArrowUpRight size={14}/></button>
        </div>

        <div className="mt-10 rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6"><p className="font-mono text-[9px] uppercase tracking-[0.25em] text-cy">स्रोत</p><div className="mt-3 flex items-center justify-between gap-4"><Meta article={article} now={now}/><button onClick={openSource} className="press rounded-full bg-white/[0.08] px-3 py-2 font-body text-[11px] font-bold text-fog">समाचार हेर्नुहोस् <ArrowUpRight size={13} className="ml-1 inline"/></button></div></div>

        {related.length > 0 && <section className="mt-12"><div className="mb-4 flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.25em] text-cy">खबरसँग सम्बन्धित</p><h2 className="mt-1 font-display text-2xl font-black text-fog">थप समाचार</h2></div><span className="font-mono text-[10px] text-faint">{np(related.length)} वटा</span></div><div className="grid gap-3 sm:grid-cols-2">{related.slice(0, 4).map(item => <button key={item.id} onClick={() => onOpenArticle(item)} className="press group flex gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.035] p-3 text-left"><div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/>}</div><div className="min-w-0"><p className="font-body text-[13px] font-bold leading-snug text-fog line-clamp-3">{item.title}</p><p className="mt-1 font-mono text-[9px] text-faint">{FEED_MAP[item.sourceId]?.name ?? item.sourceId}</p></div></button>)}</div></section>}

        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          <button disabled={!previous} onClick={() => previous && onOpenArticle(previous)} className="press flex items-center gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.035] p-4 text-left disabled:opacity-30"><ChevronLeft size={18}/><span className="min-w-0"><small className="block font-mono text-[9px] text-faint">अघिल्लो</small><strong className="mt-1 block line-clamp-2 font-body text-[12px] text-fog">{previous?.title ?? "अघिल्लो खबर छैन"}</strong></span></button>
          <button disabled={!next} onClick={() => next && onOpenArticle(next)} className="press flex items-center justify-end gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.035] p-4 text-right disabled:opacity-30"><span className="min-w-0"><small className="block font-mono text-[9px] text-faint">अर्को</small><strong className="mt-1 block line-clamp-2 font-body text-[12px] text-fog">{next?.title ?? "अर्को खबर छैन"}</strong></span><ChevronRight size={18}/></button>
        </div>
      </article>
    </main>
  </div>;
}
