import { Clapperboard, Cpu, Flame, Globe2, Landmark, Newspaper, TrendingUp, Trophy } from "lucide-react";
import { CATEGORIES, CAT_GRADIENTS, np } from "../data/feeds";
import type { CategoryId } from "../data/feeds";

interface Props {
  active: CategoryId | "all" | "saved";
  onChange: (c: CategoryId | "all") => void;
  counts: Record<string, number>;
}

const ICONS: Record<CategoryId | "all", typeof Flame> = {
  all: Newspaper,
  taja: Flame,
  rajaniti: Landmark,
  artha: TrendingUp,
  khelkud: Trophy,
  manoranjan: Clapperboard,
  prabidhi: Cpu,
  bidesh: Globe2,
};

const LABELS: Record<CategoryId | "all", string> = {
  all: "सबै",
  taja: "ताजा",
  rajaniti: "राजनीति",
  artha: "अर्थ",
  khelkud: "खेलकुद",
  manoranjan: "मनोरञ्जन",
  prabidhi: "प्रविधि",
  bidesh: "विदेश",
};

export default function CategoryBar({ active, onChange, counts }: Props) {
  const tabs: { id: CategoryId | "all"; label: string; n: number }[] = [
    { id: "all", label: "सबै", n: counts.all ?? 0 },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, n: counts[c.id] ?? 0 })),
  ];

  return (
    <div className="sticky top-[170px] z-30 border-b border-white/[0.06] bg-[rgba(10,13,31,0.5)] backdrop-blur-xl md:top-[100px]">
      <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
        <div className="no-scrollbar flex items-center gap-3 overflow-x-auto pb-1">
          {tabs.map((t) => {
            const on = active === t.id;
            const Icon = ICONS[t.id];
            const grad = t.id === "all" ? "from-[#ff3b30] to-[#ff9500]" : CAT_GRADIENTS[t.id];
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={`press group flex shrink-0 items-center gap-2.5 rounded-2xl border px-3 py-2 transition-all ${
                  on ? "border-cy/40 bg-cy/10 shadow-[0_4px_16px_rgba(100,210,255,0.2)]" : "border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.08]"
                }`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-[11px] bg-gradient-to-br ${grad} shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]`}>
                  <Icon size={16} className="text-white" />
                </span>
                <div className="flex flex-col items-start">
                  <span className={`font-body text-[12px] font-bold ${on ? "text-cy" : "text-fog"}`}>{t.label}</span>
                  <span className="font-mono text-[9px] tabular-nums text-faint">{np(t.n)} खबर</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
