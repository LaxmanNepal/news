import { Activity, Bookmark, Home, Rss } from "lucide-react";
import { np } from "../data/feeds";

export type TabId = "home" | "live" | "saved" | "sources";

interface Props {
  active: TabId;
  onTab: (t: TabId) => void;
  savedCount: number;
  newCount: number;
}

export default function TabBar({ active, onTab, savedCount, newCount }: Props) {
  const tabs: { id: TabId; label: string; icon: typeof Home; badge?: number }[] = [
    { id: "home", label: "होम", icon: Home, badge: newCount || undefined },
    { id: "live", label: "लाइभ", icon: Activity },
    { id: "saved", label: "सेभ", icon: Bookmark, badge: savedCount || undefined },
    { id: "sources", label: "स्रोत", icon: Rss },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[rgba(13,16,33,0.82)] backdrop-blur-2xl md:hidden">
      <div className="grid grid-cols-4 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
        {tabs.map((t) => {
          const on = active === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => onTab(t.id)} className="press relative flex flex-col items-center gap-0.5 py-1">
              <span className={`relative transition-colors ${on ? "text-cy" : "text-faint"}`}>
                <Icon size={21} strokeWidth={on ? 2.4 : 2} />
                {t.badge !== undefined && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-wire px-1 font-mono text-[9px] font-bold text-white">
                    {np(t.badge)}
                  </span>
                )}
              </span>
              <span className={`font-body text-[10px] font-bold ${on ? "text-cy" : "text-faint"}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
