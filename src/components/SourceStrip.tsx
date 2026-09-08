import { X } from "lucide-react";
import { CAT_GRADIENTS, FEEDS, np } from "../data/feeds";
import type { FeedStatus } from "../lib/rss";

interface Props {
  status: Record<string, FeedStatus>;
  disabled: string[];
  counts: Record<string, number>;
  active: string | null;
  onPick: (id: string) => void;
  onClear: () => void;
}

export default function SourceStrip({ status, disabled, counts, active, onPick, onClear }: Props) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-faint">स्रोत छान्नुहोस्</p>
        {active && (
          <button onClick={onClear} className="press flex items-center gap-1 rounded-full bg-cy/15 px-2.5 py-1 font-body text-[11px] font-bold text-cy">
            <X size={11} /> फिल्टर हटाउनुहोस्
          </button>
        )}
        <span className="h-px flex-1 bg-white/[0.07]" />
      </div>
      <div className="no-scrollbar flex items-start gap-3 overflow-x-auto pb-1">
        {FEEDS.map((f) => {
          const st = status[f.id];
          const off = disabled.includes(f.id);
          const on = active === f.id;
          const dot = st?.state === "ok" ? "bg-ok" : st?.state === "err" ? "bg-wire" : st?.state === "loading" ? "bg-gold animate-pulse" : "bg-faint";
          return (
            <button key={f.id} onClick={() => !off && onPick(f.id)} disabled={off} title={off ? `${f.name} बन्द छ — स्रोत सिटबाट खोल्नुहोस्` : f.name} className={`press group flex w-[74px] shrink-0 flex-col items-center gap-1.5 ${off ? "opacity-35" : ""}`}>
              <span className="relative">
                <span className={`flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br font-mono text-[11px] font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_16px_rgba(0,0,0,0.35)] transition-transform ${CAT_GRADIENTS[f.category]} ${on ? "ring-2 ring-cy ring-offset-2 ring-offset-[rgba(10,13,31,0.8)]" : "group-hover:scale-105"}`}>
                  {f.tag}
                </span>
                <span className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#0a0d1f] ${dot}`} />
              </span>
              <span className={`w-full truncate text-center font-body text-[10px] font-bold leading-tight ${on ? "text-cy" : "text-dim"}`}>{f.name}</span>
              <span className="font-mono text-[9px] tabular-nums text-faint">{off ? "बन्द" : `${np(counts[f.id] ?? 0)} खबर`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
