import { BatteryFull, Bookmark, Loader2, Newspaper, Rss, Search, Signal, Wifi, X } from "lucide-react";
import { FEEDS, np } from "../data/feeds";
import { hhmmssNe, timeAgoNe } from "../lib/rss";

interface HeaderProps {
  now: number;
  query: string;
  onQuery: (q: string) => void;
  savedCount: number;
  savedOnly: boolean;
  onToggleSaved: () => void;
  syncing: boolean;
  onRefresh: () => void;
  lastSyncLabel: string | null;
  lastSync: number | null;
  remaining: number;
  intervalSec: number;
  onlineCount: number;
  articleCount: number;
  onOpenSources: () => void;
}

function StatusBar({ now }: { now: number }) {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center justify-between px-5 pt-2.5 font-mono text-[13px] font-semibold text-fog/90">
      <span className="tabular-nums">{np(`${p(d.getHours())}:${p(d.getMinutes())}`)}</span>
      <span className="flex items-center gap-1.5">
        <Signal size={14} />
        <Wifi size={15} />
        <BatteryFull size={20} />
      </span>
    </div>
  );
}

function Island({ syncing, remaining, intervalSec, lastSyncLabel, onlineCount }: { syncing: boolean; remaining: number; intervalSec: number; lastSyncLabel: string | null; onlineCount: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1.5 z-50 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-black/90 px-4 py-1.5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        <span className="pulse-dot h-2 w-2 shrink-0 rounded-full bg-wire" />
        <span className="flex items-center gap-2 font-body text-[12px] font-bold text-fog">
          लाइभ
          <span className="font-mono text-[11px] font-semibold text-cy tabular-nums">
            {np(onlineCount)}/{np(FEEDS.length)}
          </span>
        </span>
        {!syncing && intervalSec > 0 && (
          <svg width="18" height="18" viewBox="0 0 20 20" className="shrink-0 -rotate-90">
            <circle cx="10" cy="10" r="7" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2.5" />
            <circle cx="10" cy="10" r="7" fill="none" stroke="#ffd60a" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={44} strokeDashoffset={44 * (1 - remaining / intervalSec)} style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
        )}
        {syncing && <Loader2 size={14} className="shrink-0 animate-spin text-gold" />}
      </div>
    </div>
  );
}

export default function Header(props: HeaderProps) {
  const { now, query, onQuery, savedCount, savedOnly, onToggleSaved, syncing, onRefresh, lastSyncLabel, lastSync, remaining, intervalSec, onlineCount, articleCount, onOpenSources } = props;

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[rgba(10,13,31,0.72)] backdrop-blur-2xl">
      <Island syncing={syncing} remaining={remaining} intervalSec={intervalSec} lastSyncLabel={lastSyncLabel} onlineCount={onlineCount} />
      <StatusBar now={now} />

      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 pb-3 pt-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-gradient-to-br from-[#ff3b30] to-[#ff9500] shadow-[0_6px_20px_rgba(255,59,48,0.4)]">
            <Newspaper size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-[22px] font-black leading-none tracking-tight text-fog sm:text-[26px]">
              खबर<span className="text-cy">धारा</span>
            </h1>
            <p className="mt-0.5 truncate font-body text-[10px] font-semibold tracking-wide text-faint sm:text-[11px]">
              नेपाली समाचार एग्रीगेटर · {np(FEEDS.length)} स्रोत
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="खोज्नुहोस्…" className="w-44 rounded-full border border-white/[0.08] bg-white/[0.06] py-2 pl-9 pr-8 font-body text-[13px] font-medium text-fog placeholder:text-faint focus:border-cy/60 focus:bg-white/[0.1] focus:outline-none lg:w-64" />
            {query && (
              <button onClick={() => onQuery("")} className="absolute right-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-faint hover:text-fog" aria-label="खोजी खाली गर्नुहोस्">
                <X size={10} />
              </button>
            )}
          </div>

          <button onClick={onToggleSaved} className={`press relative flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${savedOnly ? "border-gold/50 bg-gold/15 text-gold" : "border-white/[0.08] bg-white/[0.06] text-dim hover:text-gold"}`} aria-label="सेभ गरिएका खबर">
            <Bookmark size={16} fill={savedOnly ? "currentColor" : "none"} />
            {savedCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 font-mono text-[9px] font-bold text-ink">
                {np(savedCount)}
              </span>
            )}
          </button>

          <button onClick={onOpenSources} className="press flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] text-dim transition-colors hover:text-cy" aria-label="स्रोत व्यवस्थापन">
            <Rss size={16} />
          </button>

          <button onClick={onRefresh} disabled={syncing} className="press flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-[#0a84ff] to-[#64d2ff] px-4 font-body text-[13px] font-extrabold text-white shadow-[0_6px_20px_rgba(10,132,255,0.4)] disabled:opacity-60">
            <Loader2 size={14} className={syncing ? "animate-spin" : "hidden"} />
            <span className="hidden sm:inline">{syncing ? "सिंक हुँदै" : "सिंक"}</span>
            <span className="sm:hidden">{syncing ? "…" : "सिंक"}</span>
          </button>
        </div>
      </div>

      <div className="border-t border-white/[0.05] bg-black/20">
        <div className="no-scrollbar mx-auto flex max-w-[1600px] items-center gap-x-6 gap-y-1 overflow-x-auto px-4 py-2 font-mono text-[10px] tracking-wide sm:px-6">
          <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
            <span className={`h-1.5 w-1.5 rounded-full ${onlineCount > 0 ? "bg-ok" : "bg-wire"} ${syncing ? "animate-pulse" : ""}`} />
            <span className={onlineCount > 0 ? "text-ok" : "text-wire"}>
              {np(onlineCount)}/{np(FEEDS.length)} स्रोत लाइभ
            </span>
          </span>
          <span className="shrink-0 whitespace-nowrap text-dim">
            <span className="font-bold text-fog tabular-nums">{np(articleCount)}</span> खबर इन्डेक्स
          </span>
          <span className="shrink-0 whitespace-nowrap text-dim">
            अन्तिम सिंक <span className="tabular-nums text-fog">{lastSyncLabel ?? "--:--:--"}</span>
            {lastSync && <span className="text-faint"> · {timeAgoNe(lastSync, now)}</span>}
          </span>
          <span className="shrink-0 whitespace-nowrap text-dim">
            {intervalSec > 0 ? (
              <>अर्को सिंक <span className="font-bold text-gold tabular-nums">{syncing ? "…" : `${np(remaining)} से.`}</span></>
            ) : (
              <span className="text-faint">अटो-सिंक बन्द</span>
            )}
          </span>
          {syncing && (
            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-cy">
              <Loader2 size={10} className="animate-spin" /> {np(FEEDS.length)} फिड पोल हुँदै
            </span>
          )}
          <span className="ml-auto hidden shrink-0 whitespace-nowrap text-faint lg:block">
            {hhmmssNe(now)} · काठमाडौँ
          </span>
        </div>
      </div>

      <div className="border-t border-white/[0.05] px-4 pb-2.5 pt-2 sm:hidden">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="शीर्षक, स्रोत खोज्नुहोस्…" className="w-full rounded-full border border-white/[0.08] bg-white/[0.06] py-2 pl-9 pr-8 font-body text-[13px] font-medium text-fog placeholder:text-faint focus:border-cy/60 focus:outline-none" />
          {query && (
            <button onClick={() => onQuery("")} className="absolute right-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-faint" aria-label="खोजी खाली गर्नुहोस्">
              <X size={10} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
