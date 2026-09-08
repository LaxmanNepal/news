import { Cloud } from "lucide-react";
import { np } from "../data/feeds";

export default function WeatherWidget() {
  // Simulated Kathmandu weather
  const temp = 22;
  const condition = "cloudy" as const;
  const humidity = 65;
  const wind = 12;

  return (
    <section className="glass overflow-hidden rounded-[24px]">
      <div className="relative bg-gradient-to-br from-[#5e5ce6] via-[#0a84ff] to-[#64d2ff] p-5">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/15 blur-xl" />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <p className="font-body text-[11px] font-bold uppercase tracking-wider text-white/70">काठमाडौँ</p>
            <p className="mt-1 font-display text-5xl font-black text-white tabular-nums">{np(temp)}°</p>
            <p className="mt-1 font-body text-[12px] font-semibold text-white/80">बादल लागेको</p>
          </div>
          <div className="relative">
            <Cloud size={64} className="text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-white/[0.07]">
        <div className="border-r border-white/[0.07] px-5 py-3">
          <p className="font-display text-xl font-black text-cy tabular-nums">{np(humidity)}%</p>
          <p className="font-body text-[11px] font-semibold text-faint">आर्द्रता</p>
        </div>
        <div className="px-5 py-3">
          <p className="font-display text-xl font-black text-cy tabular-nums">{np(wind)} कि.मि./घ.</p>
          <p className="font-body text-[11px] font-semibold text-faint">हावाको गति</p>
        </div>
      </div>
    </section>
  );
}
