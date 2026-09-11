import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Bookmark, Inbox, Newspaper } from "lucide-react";
import { CATEGORIES, FEED_MAP, np } from "../data/feeds";
import type { CategoryId } from "../data/feeds";
import type { Article } from "../lib/rss";
import { timeAgoNe } from "../lib/rss";

interface FeedProps {
  items: Article[]; now: number; saved: string[]; onToggleSaved: (id: string) => void; onOpen: (a: Article) => void;
  newIds: Set<string>; savedOnly: boolean; onClearSavedOnly: () => void; sourceFilter: string | null; category: CategoryId | "all";
}
const CAT_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = ref.current; if (!el) return; const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { el.classList.add("is-in"); io.unobserve(el); } }), { threshold: 0.04, rootMargin: "0px 0px -30px 0px" }); io.observe(el); return () => io.disconnect(); }, []);
  return <div ref={ref} className={`reveal ${className ?? ""}`}>{children}</div>;
}
function SmartImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false); useEffect(() => setFailed(false), [src]);
  if (!src || failed) return <div className={`flex items-center justify-center bg-gradient-to-br from-ink2 to-[#1a2040] ${className ?? ""}`}><Newspaper size={34} className="text-white/15" /></div>;
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover transition-transform duration-700 group-hover:scale-[1.04] ${className ?? ""}`} />;
}
function MetaRow({ a, now, saved, onToggleSaved }: { a: Article; now: number; saved: boolean; onToggleSaved: () => void }) {
  const src = FEED_MAP[a.sourceId];
  return <div className="flex items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.1] font-mono text-[9px] font-bold text-cy">{src?.tag ?? "?"}</span><span className="truncate font-body text-[11px] font-semibold text-dim">{src?.name ?? a.sourceId}</span><span className="shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 font-body text-[10px] font-semibold text-faint">{CAT_BY_ID[a.category as CategoryId]?.label ?? CAT_BY_ID[src?.category as CategoryId]?.label}</span><span className="ml-auto shrink-0 font-mono text-[10px] tabular-nums text-faint">{timeAgoNe(a.pubDate, now)}</span><button onClick={(e) => { e.stopPropagation(); onToggleSaved(); }} className={`press shrink-0 ${saved ? "text-gold" : "text-faint hover:text-gold"}`} aria-label={saved ? "सेभ हटाउनुहोस्" : "सेभ गर्नुहोस्"}><Bookmark size={14} fill={saved ? "currentColor" : "none"} /></button></div>;
}
function Card({ a, now, saved, onToggleSaved, onOpen, isNew }: { a: Article; now: number; saved: boolean; onToggleSaved: () => void; onOpen: () => void; isNew: boolean }) {
  return <article onClick={onOpen} className={`glass card-lift group relative cursor-pointer overflow-hidden rounded-[20px] ${isNew ? "card-new" : ""}`}>{isNew && <span className="absolute right-3 top-3 z-10 rounded-full bg-wire px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(255,59,48,0.5)]">नयाँ</span>}{a.image && <div className="aspect-[16/10] overflow-hidden"><SmartImage src={a.image} alt={a.title} className="h-full w-full" /></div>}<div className="p-4"><MetaRow a={a} now={now} saved={saved} onToggleSaved={onToggleSaved}/><h3 className="mt-2.5 font-display text-[17px] font-black leading-snug text-fog group-hover:text-cy">{a.title}</h3>{a.description && <p className="mt-2 line-clamp-3 font-body text-[12.5px] font-medium leading-relaxed text-dim">{a.description}</p>}<div className="mt-3 flex items-center gap-1.5 font-body text-[11px] font-bold text-cy">पढ्नुहोस् <ArrowUpRight size={12}/></div></div></article>;
}
function Hero({ a, now, saved, onToggleSaved, onOpen }: { a: Article; now: number; saved: boolean; onToggleSaved: () => void; onOpen: () => void }) {
  const src = FEED_MAP[a.sourceId];
  return <article onClick={onOpen} className="glass card-lift group relative cursor-pointer overflow-hidden rounded-[26px]"><div className="relative aspect-[16/10] overflow-hidden sm:aspect-[21/10]">{a.image ? <SmartImage src={a.image} alt={a.title} className="h-full w-full"/> : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink2 to-[#1a2040]"><Newspaper size={80} className="text-white/10"/></div>}<div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,13,31,0.97)] via-[rgba(10,13,31,0.42)] to-transparent"/><div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8"><div className="mb-3 flex items-center gap-2"><span className="rounded-full bg-wire px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-white">मुख्य समाचार</span>{src && <span className="rounded-full bg-white/[0.15] px-2.5 py-1 font-body text-[11px] font-bold text-fog backdrop-blur-sm">{src.name}</span>}<span className="ml-auto font-mono text-[11px] text-fog/70">{timeAgoNe(a.pubDate, now)}</span></div><h2 className="max-w-4xl font-display text-[26px] font-black leading-[1.15] text-fog sm:text-[38px]">{a.title}</h2>{a.description && <p className="mt-3 max-w-3xl line-clamp-2 font-body text-[13px] font-medium leading-relaxed text-fog/80 sm:text-[15px]">{a.description}</p>}<div className="mt-4 flex items-center gap-3"><button onClick={(e) => { e.stopPropagation(); onToggleSaved(); }} className={`press flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-[12px] font-bold ${saved ? "bg-gold text-ink" : "bg-white/[0.15] text-fog backdrop-blur-sm"}`}><Bookmark size={13} fill={saved ? "currentColor" : "none"}/>{saved ? "सेभ गरिएको" : "सेभ"}</button><span className="flex items-center gap-1.5 font-body text-[12px] font-bold text-cy">पूरा खबर <ArrowUpRight size={13}/></span></div></div></div></article>;
}
function Section({ id, items, now, saved, onToggleSaved, onOpen, newIds }: { id: CategoryId; items: Article[]; now: number; saved: string[]; onToggleSaved: (id: string) => void; onOpen: (a: Article) => void; newIds: Set<string> }) {
  const cat = CAT_BY_ID[id]; if (!items.length) return null;
  return <section className="pt-2"><div className="mb-4 flex items-end justify-between border-b border-white/[0.08] pb-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.3em] text-cy">KhabarDhara desk</p><h3 className="mt-1 font-display text-2xl font-black text-fog">{cat?.label}</h3></div><span className="font-mono text-[11px] text-faint">{np(items.length)} खबर</span></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.slice(0, 6).map((a) => <Reveal key={a.id}><Card a={a} now={now} saved={saved.includes(a.id)} onToggleSaved={() => onToggleSaved(a.id)} onOpen={() => onOpen(a)} isNew={newIds.has(a.id)}/></Reveal>)}</div></section>;
}
export default function Feed({ items, now, saved, onToggleSaved, onOpen, newIds, savedOnly, onClearSavedOnly, sourceFilter, category }: FeedProps) {
  if (!items.length) return <div className="glass flex min-h-[400px] flex-col items-center justify-center rounded-[24px] p-8 text-center"><Inbox size={48} className="mb-4 text-faint"/><p className="font-display text-xl font-black text-fog">कुनै खबर भेटिएन</p><p className="mt-2 font-body text-[13px] font-medium text-dim">{savedOnly ? "तपाईंले अहिलेसम्म कुनै खबर सेभ गर्नुभएको छैन।" : "फिल्टर परिवर्तन गर्नुहोस् वा पछि पुन: प्रयास गर्नुहोस्।"}</p>{(savedOnly || sourceFilter || category !== "all") && <button onClick={onClearSavedOnly} className="press mt-4 rounded-full bg-cy/15 px-4 py-2 font-body text-[12px] font-bold text-cy">फिल्टर हटाउनुहोस्</button>}</div>;
  const newsroom = !savedOnly && !sourceFilter && category === "all";
  if (newsroom) {
    const hero = items[0];
    const topStories = items.slice(1, 5);
    return <div className="flex flex-col gap-9"><Reveal><Hero a={hero} now={now} saved={saved.includes(hero.id)} onToggleSaved={() => onToggleSaved(hero.id)} onOpen={() => onOpen(hero)}/></Reveal><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{topStories.map((a) => <Reveal key={a.id}><Card a={a} now={now} saved={saved.includes(a.id)} onToggleSaved={() => onToggleSaved(a.id)} onOpen={() => onOpen(a)} isNew={newIds.has(a.id)}/></Reveal>)}</div><div className="h-px bg-white/[0.08]"/>{CATEGORIES.filter((c) => c.id !== "taja").map((c) => <Section key={c.id} id={c.id} items={items.filter((a) => a.category === c.id)} now={now} saved={saved} onToggleSaved={onToggleSaved} onOpen={onOpen} newIds={newIds}/>)}</div>;
  }
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((a) => <Reveal key={a.id}><Card a={a} now={now} saved={saved.includes(a.id)} onToggleSaved={() => onToggleSaved(a.id)} onOpen={() => onOpen(a)} isNew={newIds.has(a.id)}/></Reveal>)}</div>;
}
