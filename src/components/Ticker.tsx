import type { Article } from "../lib/rss";
import { clockNe } from "../lib/rss";
import { FEED_MAP } from "../data/feeds";

export default function Ticker({ articles, now }: { articles: Article[]; now: number }) {
  const heads = articles.filter((a) => !a.fromSnapshot).slice(0, 14);
  const items = heads.length ? heads : articles.slice(0, 14);

  if (items.length === 0) {
    return (
      <div className="glass-strong relative z-30 border-x-0 border-t-0">
        <div className="mx-auto flex h-10 max-w-[1200px] items-center gap-3 px-4 font-body text-xs text-dim">
          <span className="h-2 w-2 rounded-full bg-wire pulse-dot" />
          <span className="blink-soft">फिड जडान हुँदैछ… पहिलो सिंक पर्खँदै</span>
        </div>
      </div>
    );
  }

  const dur = Math.max(60, items.length * 9);

  return (
    <div className="glass-strong ticker-shell relative z-30 overflow-hidden border-x-0 border-t-0">
      <div className="mx-auto flex h-10 max-w-[1600px] items-stretch">
        <div className="relative z-10 flex shrink-0 items-center gap-2 bg-wire px-3 sm:px-4">
          <span className="h-2 w-2 rounded-full bg-white pulse-dot" />
          <span className="font-body text-[13px] font-bold tracking-wide text-white">ब्रेकिङ</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-track absolute left-0 top-0 flex h-10 w-max items-center" style={{ ["--ticker-dur" as string]: `${dur}s` }}>
            {[0, 1].map((k) => (
              <div key={k} className="flex items-center" aria-hidden={k === 1}>
                {items.map((a, i) => (
                  <span key={`${k}-${a.id}-${i}`} className="flex items-center whitespace-nowrap">
                    <a href={a.link} target="_blank" rel="noreferrer" className="px-4 font-body text-[13px] font-medium text-fog/90 transition-colors hover:text-white sm:text-sm">
                      {a.title}
                    </a>
                    <span className="font-mono text-[10px] text-faint">
                      {FEED_MAP[a.sourceId]?.name} · {clockNe(a.pubDate)}
                    </span>
                    <span className="mx-3 h-1 w-1 shrink-0 rounded-full bg-wire" />
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[rgba(16,20,43,0.9)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[rgba(16,20,43,0.9)] to-transparent" />
        </div>
        <div className="hidden shrink-0 items-center gap-2 px-4 font-mono text-xs tabular-nums text-cy sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-cy blink-soft" />
          {clockNe(now)}
        </div>
      </div>
    </div>
  );
}
