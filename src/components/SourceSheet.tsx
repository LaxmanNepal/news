import { useEffect } from "react";
import { Power, X } from "lucide-react";
import { CATEGORIES, CAT_GRADIENTS, FEEDS, np } from "../data/feeds";
import type { FeedStatus } from "../lib/rss";
import { INTERVAL_OPTIONS } from "../hooks/useNews";

interface Props {
  open: boolean;
  onClose: () => void;
  status: Record<string, FeedStatus>;
  disabled: string[];
  onToggle: (id: string) => void;
  onToggleAll: (enable: boolean) => void;
  intervalSec: number;
  onInterval: (sec: number) => void;
}

export default function SourceSheet({ open, onClose, status, disabled, onToggle, onToggleAll, intervalSec, onInterval }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const onCount = FEEDS.length - disabled.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <button className="fade-in absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="बन्द गर्नुहोस्" />
      <div className="glass-strong animate-sheet-up relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-[28px] sm:max-w-xl sm:animate-pop-in sm:rounded-[28px]">
        <div className="flex justify-center pb-1 pt-2.5 sm:hidden">
          <span className="h-1.5 w-12 rounded-full bg-white/25" />
        </div>
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
          <h2 className="font-display text-[22px] font-black text-fog">स्रोत व्यवस्थापन</h2>
          <span className="rounded-full bg-ok/15 px-2.5 py-1 font-mono text-[10px] font-bold text-ok tabular-nums">
            {np(onCount)}/{np(FEEDS.length)} सक्रिय
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => onToggleAll(true)} className="press rounded-full bg-white/[0.08] px-3 py-1.5 font-body text-[11px] font-bold text-dim hover:text-ok">
              सबै खोल्नुहोस्
            </button>
            <button onClick={onClose} className="press flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.1] text-fog hover:bg-white/[0.18]" aria-label="बन्द गर्नुहोस्">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">
          <p className="px-1 pb-2 font-body text-[11px] font-extrabold uppercase tracking-wider text-faint">स्वतः सिंक गति</p>
          <div className="mb-5 flex rounded-[16px] bg-white/[0.06] p-1">
            {INTERVAL_OPTIONS.map((o) => (
              <button key={o.sec} onClick={() => onInterval(o.sec)} className={`flex-1 rounded-[12px] px-1 py-2 font-body text-[12px] font-bold transition-all ${intervalSec === o.sec ? "bg-white/[0.16] text-fog shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" : "text-faint hover:text-dim"}`}>
                {o.label}
              </button>
            ))}
          </div>

          <p className="px-1 pb-2 font-body text-[11px] font-extrabold uppercase tracking-wider text-faint">समाचार स्रोतहरू</p>
          <div className="overflow-hidden rounded-[18px] border border-white/[0.08] bg-[rgba(28,28,33,0.6)]">
            {FEEDS.map((f, i) => {
              const off = disabled.includes(f.id);
              const st = status[f.id];
              const cat = CATEGORIES.find((c) => c.id === f.category);
              return (
                <div key={f.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-white/[0.06]" : ""} ${off ? "opacity-50" : ""}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br font-mono text-[9.5px] font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ${CAT_GRADIENTS[f.category]}`}>
                    {f.tag}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-[14px] font-bold text-fog">{f.name}</p>
                    <p className="flex items-center gap-1.5 font-body text-[11px] font-semibold text-faint">
                      {cat?.label}
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${st?.state === "ok" ? "bg-ok" : st?.state === "err" ? "bg-wire" : st?.state === "loading" ? "bg-gold animate-pulse" : "bg-faint"}`} />
                      {st?.state === "ok" ? `${np(st.count)} खबर` : st?.state === "err" ? "जडान असफल" : st?.state === "loading" ? "लोड हुँदै" : "पर्खँदै"}
                    </p>
                  </div>
                  <button onClick={() => onToggle(f.id)} className={`ioswitch ${off ? "" : "on"}`} role="switch" aria-checked={!off} aria-label={`${f.name} ${off ? "खोल्नुहोस्" : "बन्द गर्नुहोस्"}`} />
                </div>
              );
            })}
          </div>

          {onCount === 0 && (
            <button onClick={() => onToggleAll(true)} className="press mx-auto mt-5 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#30d158] to-[#a8e063] px-5 py-2.5 font-body text-[13px] font-extrabold text-ink shadow-[0_8px_24px_rgba(48,209,88,0.4)]">
              <Power size={15} /> सबै फिड खोल्नुहोस्
            </button>
          )}
        </div>

        <p className="border-t border-white/[0.08] px-5 py-3 text-center font-body text-[11px] font-medium text-faint">
          RSS फिडहरू सम्बन्धित प्रकाशकका हुन् · सेटिङ यही ब्राउजरमा सुरक्षित रहन्छ
        </p>
      </div>
    </div>
  );
}
