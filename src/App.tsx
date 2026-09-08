import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, FEED_MAP, FEEDS, np } from "./data/feeds";
import type { CategoryId } from "./data/feeds";
import { useNews } from "./hooks/useNews";
import type { Article } from "./lib/rss";
import Ticker from "./components/Ticker";
import Header from "./components/Header";
import CategoryBar from "./components/CategoryBar";
import Feed from "./components/Feed";
import LivePanel from "./components/LivePanel";
import DetailModal from "./components/DetailModal";
import SourceSheet from "./components/SourceSheet";
import TabBar from "./components/TabBar";
import Toast from "./components/Toast";
import type { ToastItem } from "./components/Toast";
import ClockWidget from "./components/ClockWidget";
import SourceStrip from "./components/SourceStrip";
import WeatherWidget from "./components/WeatherWidget";

export default function App() {
  const news = useNews();
  const [now, setNow] = useState(() => Date.now());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [selected, setSelected] = useState<Article | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "live" | "saved" | "sources">("home");
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (news.newIds.size === 0) return;
    const t = window.setTimeout(() => news.clearNew(), 8000);
    return () => window.clearTimeout(t);
  }, [news.newIds]);

  const pushToast = (title: string, msg: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, title, msg }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const visible = useMemo(() => {
    let list = news.articles.filter((a) => !news.disabled.includes(a.sourceId));
    if (savedOnly) list = list.filter((a) => news.saved.includes(a.id));
    if (sourceFilter) list = list.filter((a) => a.sourceId === sourceFilter);
    if (category !== "all") list = list.filter((a) => FEED_MAP[a.sourceId]?.category === category);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => {
        const src = FEED_MAP[a.sourceId];
        return a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || (src?.name.toLowerCase().includes(q) ?? false);
      });
    }
    return list;
  }, [news.articles, news.disabled, news.saved, savedOnly, sourceFilter, category, query]);

  const counts = useMemo(() => {
    const base = news.articles.filter((a) => !news.disabled.includes(a.sourceId));
    const c: Record<string, number> = { all: base.length };
    for (const cat of CATEGORIES) {
      c[cat.id] = base.filter((a) => FEED_MAP[a.sourceId]?.category === cat.id).length;
    }
    for (const f of FEEDS) {
      c[f.id] = base.filter((a) => a.sourceId === f.id).length;
    }
    return c;
  }, [news.articles, news.disabled]);

  const onlineCount = useMemo(() => FEEDS.filter((f) => news.status[f.id]?.state === "ok").length, [news.status]);

  const catLabel = category === "all" ? "सबै समाचार" : CATEGORIES.find((c) => c.id === category)?.label ?? "";
  const sourceLabel = sourceFilter ? FEED_MAP[sourceFilter]?.name : null;

  const handleTab = (t: "home" | "live" | "saved" | "sources") => {
    setActiveTab(t);
    if (t === "saved") {
      setSavedOnly(true);
      setSourceFilter(null);
      setCategory("all");
    } else if (t === "sources") {
      setSourcesOpen(true);
    } else if (t === "live") {
      liveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setSavedOnly(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="noise relative min-h-dvh">
      <div className="wallpaper" aria-hidden />
      <div className="wallpaper-veil" aria-hidden />

      <div className="relative z-10">
        <Ticker articles={news.articles} now={now} />

        <Header
          now={now}
          query={query}
          onQuery={setQuery}
          savedCount={news.saved.length}
          savedOnly={savedOnly}
          onToggleSaved={() => {
            setSavedOnly((s) => !s);
            setSourceFilter(null);
            if (!savedOnly) setActiveTab("saved");
            else setActiveTab("home");
          }}
          syncing={news.syncing}
          onRefresh={() => {
            void news.syncAll(true);
            pushToast("म्यानुअल सिंक", "सबै फिड ताजा गरिँदै…");
          }}
          lastSyncLabel={news.lastSyncLabel}
          lastSync={news.lastSync}
          remaining={news.remaining}
          intervalSec={news.intervalSec}
          onlineCount={onlineCount}
          articleCount={news.articles.length}
          onOpenSources={() => setSourcesOpen(true)}
        />

        <CategoryBar
          active={savedOnly ? "saved" : category}
          onChange={(c) => {
            setCategory(c);
            setSavedOnly(false);
            setSourceFilter(null);
            setActiveTab("home");
          }}
          counts={counts}
        />

        <main className="mx-auto max-w-[1600px] px-4 pb-28 pt-2 sm:px-6 md:pb-16">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cy">
                {savedOnly ? "सेभ गरिएको" : sourceLabel ? `${sourceLabel} बाट` : catLabel}
              </p>
              <h2 className="mt-1 font-display text-3xl font-black leading-none text-fog sm:text-4xl">
                {savedOnly ? "तपाईंको सङ्ग्रह" : sourceLabel ? `${sourceLabel} डेस्क` : `${catLabel} डेस्क`}
                <span className="ml-3 align-middle font-mono text-sm font-medium tabular-nums text-faint">{np(visible.length)}</span>
              </h2>
            </div>
            {!news.syncing && news.newCount > 0 && (
              <button onClick={news.clearNew} className="press shrink-0 rounded-full bg-wire/15 px-4 py-2 font-body text-[12px] font-bold text-wire transition-all hover:bg-wire/25 active:scale-95">
                {np(news.newCount)} नयाँ चिन्ह हटाउनुहोस्
              </button>
            )}
          </div>

          <SourceStrip status={news.status} disabled={news.disabled} counts={counts} active={sourceFilter} onPick={(id) => setSourceFilter(id)} onClear={() => setSourceFilter(null)} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Feed items={visible} now={now} saved={news.saved} onToggleSaved={news.toggleSaved} onOpen={setSelected} newIds={news.newIds} savedOnly={savedOnly} onClearSavedOnly={() => setSavedOnly(false)} sourceFilter={sourceFilter} category={category} />

            <aside className="hidden xl:block" ref={liveRef}>
              <div className="sticky top-[112px] flex flex-col gap-5">
                <ClockWidget now={now} onlineCount={onlineCount} articleCount={news.articles.length} />
                <WeatherWidget />
                <LivePanel log={news.log} syncing={news.syncing} status={news.status} articles={visible} newCount={news.newCount} />
              </div>
            </aside>
          </div>

          <section className="mt-10 xl:hidden">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-cy">प्रणाली</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ClockWidget now={now} onlineCount={onlineCount} articleCount={news.articles.length} />
              <WeatherWidget />
            </div>
            <div className="mt-4">
              <LivePanel log={news.log} syncing={news.syncing} status={news.status} articles={visible} newCount={news.newCount} />
            </div>
          </section>
        </main>

        <footer className="border-t border-white/[0.08] bg-ink/40 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-2 px-4 py-6 text-center sm:flex-row sm:justify-between sm:px-6">
            <p className="font-display text-lg font-extrabold text-fog">
              खबर<span className="text-cy">धारा</span>
              <span className="ml-3 font-body text-[12px] font-medium text-faint">नेपालका {np(FEEDS.length)} समाचार फिड — एकै डेस्कमा</span>
            </p>
            <p className="font-body text-[12px] font-medium text-faint">RSS स्रोतहरू सम्बन्धित प्रकाशकका हुन् · हरेक सेकेन्ड ताजा रहन्छ</p>
          </div>
        </footer>
      </div>

      {selected && (
        <DetailModal article={selected} now={now} saved={news.saved.includes(selected.id)} onToggleSaved={() => news.toggleSaved(selected.id)} onClose={() => setSelected(null)} />
      )}

      <SourceSheet open={sourcesOpen} onClose={() => setSourcesOpen(false)} status={news.status} disabled={news.disabled} onToggle={(id) => { news.toggleSource(id); pushToast("स्रोत परिवर्तन", `${FEED_MAP[id]?.name ?? id} ${news.disabled.includes(id) ? "खोलियो" : "बन्द गरियो"}`); }} onToggleAll={(enable) => { if (enable) news.disabled.forEach((id) => news.toggleSource(id)); else FEEDS.forEach((f) => { if (!news.disabled.includes(f.id)) news.toggleSource(f.id); }); pushToast("सबै स्रोत", enable ? "सबै फिड खोलियो" : "सबै फिड बन्द गरियो"); }} intervalSec={news.intervalSec} onInterval={(sec) => { news.setIntervalSec(sec); pushToast("सिंक गति", sec === 0 ? "अटो-सिंक बन्द गरियो" : `प्रत्येक ${np(sec)} सेकेन्डमा सिंक`); }} />

      <TabBar active={activeTab} onTab={handleTab} savedCount={news.saved.length} newCount={news.newCount} />

      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
