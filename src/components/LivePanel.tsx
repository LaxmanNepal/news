import { Activity } from "lucide-react";
import { CATEGORIES, CAT_GRADIENTS, FEEDS, np } from "../data/feeds";
import type { CategoryId } from "../data/feeds";
import type { Article, FeedStatus } from "../lib/rss";
import { hhmmssNe } from "../lib/rss";
import type { LogEntry } from "../hooks/useNews";

interface Props {
  log: LogEntry[];
  syncing: boolean;
  status: Record<string, FeedStatus>;
  articles: Article[];
  newCount: number;
}

export default function LivePanel({ log, syncing, status, articles, newCount }: Props) {
  const catCounts = CATEGORIES.map((c) => ({
    c,
    n: articles.filter((a) => {
      const src = FEEDS.find((f) => f.id === a.sourceId);
      return src?.category === c.id;
    }).length,
  }));
  const maxCat = Math.max(1, ...catCounts.map((x) => x.n));

  return (
    <div className="flex flex-col gap-4">
      <section className="glass rounded-[24px] p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-cy/15 text-cy ${syncing ? "animate-pulse" : ""}`}>
            <Activity size={15} />
          </span>
          <h3 className="font-display text-lg font-extrabold text-fog">लाइभ फिड</h3>
          {newCount > 0 && (
            <span className="ml-auto rounded-full bg-wire/15 px-2.5 py-1 font-mono text-[10px] font-bold text-wire tabular-nums">
              +{np(newCount)} नयाँ
            </span>
          )}
        </div>
        <div className="scroll-thin max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
          {log.length === 0 && (
            <p className="py-6 text-center font-body text-[12px] text-faint">लग खाली छ — सिंक पर्खँदै…</p>
          )}
          {log.map((e) => (
            <div key={e.id} className="row-in flex items-start gap-2 rounded-xl bg-white/[0.04] px-2.5 py-1.5">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${e.kind === "new" ? "bg-ok" : e.kind === "warn" ? "bg-gold" : "bg-cy"}`} />
              <p className="min-w-0 flex-1 font-body text-[11.5px] font-medium leading-snug text-dim">{e.msg}</p>
              <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-faint">{hhmmssNe(e.at)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-[24px] p-4">
        <h3 className="mb-3 font-display text-lg font-extrabold text-fog">डेस्क तथ्यांक</h3>
        <div className="grid grid-cols-2 gap-2">
          {catCounts.map(({ c, n }) => (
            <div key={c.id} className="rounded-2xl bg-white/[0.05] p-3">
              <div className="flex items-center justify-between">
                <span className="font-body text-[12px] font-bold text-fog">{c.label}</span>
                <span className="font-mono text-[11px] font-bold text-cy tabular-nums">{np(n)}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                <div className={`h-full rounded-full bg-gradient-to-r ${CAT_GRADIENTS[c.id as CategoryId]} transition-[width] duration-700`} style={{ width: `${(n / maxCat) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
