import { Newspaper } from "lucide-react";

export interface ToastItem {
  id: number;
  title: string;
  msg: string;
}

export default function ToastHost({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-14 z-[80] flex w-[min(92vw,380px)] -translate-x-1/2 flex-col gap-2 sm:top-16">
      {toasts.map((t, i) => (
        <button key={t.id} onClick={() => onDismiss(t.id)} className="glass-strong animate-banner-in press pointer-events-auto flex items-center gap-3 rounded-[20px] p-3 text-left shadow-[0_20px_50px_rgba(2,4,14,0.6)]" style={{ animationDelay: `${i * 60}ms` }}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#ff3b30] to-[#ff9500] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <Newspaper size={18} className="text-white" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className="font-body text-[13px] font-extrabold text-fog">{t.title}</span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-faint">अहिले</span>
            </span>
            <span className="mt-0.5 block truncate font-body text-[13px] font-medium leading-snug text-dim">{t.msg}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
