import { np } from "../data/feeds";
import { fullDateNe } from "../lib/rss";

interface Props {
  now: number;
  onlineCount: number;
  articleCount: number;
}

function AnalogDial({ now }: { now: number }) {
  const d = new Date(now);
  const s = d.getSeconds();
  const m = d.getMinutes() + s / 60;
  const h = (d.getHours() % 12) + m / 60;

  return (
    <svg viewBox="0 0 100 100" className="h-[72px] w-[72px] shrink-0 drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]">
      <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={i} x1="50" y1="7" x2="50" y2={i % 3 === 0 ? "14" : "11"} stroke={i % 3 === 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)"} strokeWidth={i % 3 === 0 ? 2.4 : 1.4} strokeLinecap="round" transform={`rotate(${i * 30} 50 50)`} />
      ))}
      <line x1="50" y1="54" x2="50" y2="30" stroke="#f2f5ff" strokeWidth="4" strokeLinecap="round" transform={`rotate(${h * 30} 50 50)`} />
      <line x1="50" y1="55" x2="50" y2="18" stroke="#f2f5ff" strokeWidth="2.6" strokeLinecap="round" transform={`rotate(${m * 6} 50 50)`} />
      <line x1="50" y1="58" x2="50" y2="14" stroke="#ffd60a" strokeWidth="1.4" strokeLinecap="round" transform={`rotate(${s * 6} 50 50)`} />
      <circle cx="50" cy="50" r="3.2" fill="#ffd60a" />
      <circle cx="50" cy="50" r="1.2" fill="#0a0d1f" />
    </svg>
  );
}

export default function ClockWidget({ now, onlineCount, articleCount }: Props) {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="glass overflow-hidden rounded-[26px]">
      <div className="flex items-center gap-5 p-5">
        <AnalogDial now={now} />
        <div className="min-w-0">
          <p className="font-display text-[44px] font-black leading-none tracking-tight text-fog tabular-nums">
            {np(p(d.getHours()))}:{np(p(d.getMinutes()))}
            <span className="ml-1 text-[20px] font-bold text-gold">{np(p(d.getSeconds()))}</span>
          </p>
          <p className="mt-1.5 truncate font-body text-[12px] font-semibold text-dim">{fullDateNe(now)}</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-faint">नेपाल समय · लाइभ</p>
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-white/[0.07]">
        <div className="border-r border-white/[0.07] px-5 py-3">
          <p className="font-display text-2xl font-black text-ok tabular-nums">{np(onlineCount)}</p>
          <p className="font-body text-[11px] font-semibold text-faint">स्रोत लाइभ</p>
        </div>
        <div className="px-5 py-3">
          <p className="font-display text-2xl font-black text-cy tabular-nums">{np(articleCount)}</p>
          <p className="font-body text-[11px] font-semibold text-faint">खबर इन्डेक्स</p>
        </div>
      </div>
    </section>
  );
}
