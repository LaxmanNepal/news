import { useCallback, useEffect, useRef, useState } from "react";
import { FEEDS, SNAPSHOTS, np } from "../data/feeds";
import { loadFeed, timeAgoNe } from "../lib/rss";
import type { Article, FeedStatus } from "../lib/rss";

export interface LogEntry {
  id: number;
  at: number;
  kind: "info" | "warn" | "new";
  msg: string;
}

export const INTERVAL_OPTIONS: { sec: number; label: string }[] = [
  { sec: 0, label: "बन्द" },
  { sec: 15, label: "१५से" },
  { sec: 30, label: "३०से" },
  { sec: 60, label: "१ मि" },
  { sec: 120, label: "२ मि" },
];

const LS = {
  disabled: "kd-disabled",
  saved: "kd-saved",
  interval: "kd-interval",
};

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function useNews() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [status, setStatus] = useState<Record<string, FeedStatus>>(() =>
    Object.fromEntries(FEEDS.map((f) => [f.id, { state: "idle" as const }]))
  );
  const [log, setLog] = useState<LogEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [disabled, setDisabled] = useState<string[]>(() => readLS<string[]>(LS.disabled, []));
  const [saved, setSaved] = useState<string[]>(() => readLS<string[]>(LS.saved, []));
  const [intervalSec, setIntervalSecState] = useState<number>(() => readLS<number>(LS.interval, 30));
  const [remaining, setRemaining] = useState<number>(() => readLS<number>(LS.interval, 30));
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [newCount, setNewCount] = useState(0);

  const logIdRef = useRef(0);
  const articlesRef = useRef<Article[]>([]);
  articlesRef.current = articles;

  const addLog = useCallback((kind: LogEntry["kind"], msg: string) => {
    const entry: LogEntry = { id: ++logIdRef.current, at: Date.now(), kind, msg };
    setLog((prev) => [entry, ...prev].slice(0, 80));
  }, []);

  const setIntervalSec = useCallback((sec: number) => {
    setIntervalSecState(sec);
    setRemaining(sec);
    writeLS(LS.interval, sec);
  }, []);

  const toggleSource = useCallback((id: string) => {
    setDisabled((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeLS(LS.disabled, next);
      return next;
    });
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeLS(LS.saved, next);
      return next;
    });
  }, []);

  const clearNew = useCallback(() => {
    setNewIds(new Set());
    setNewCount(0);
  }, []);

  const syncAll = useCallback(
    async (manual = false) => {
      if (syncing) return;
      setSyncing(true);
      if (manual) addLog("info", "म्यानुअल सिंक सुरु…");
      setStatus((prev) => ({ ...prev, ...Object.fromEntries(FEEDS.map((f) => [f.id, { state: "loading" as const }])) }));

      const results = await Promise.allSettled(FEEDS.map((f) => loadFeed(f)));
      const all: Article[] = [];
      const seen = new Set<string>();
      const newOnes: string[] = [];
      const existingIds = new Set(articlesRef.current.map((a) => a.id));

      results.forEach((r, i) => {
        const src = FEEDS[i];
        if (r.status === "fulfilled" && r.value.length > 0) {
          const items = r.value.filter((a) => {
            if (seen.has(a.id)) return false;
            seen.add(a.id);
            return true;
          });
          all.push(...items);
          setStatus((prev) => ({ ...prev, [src.id]: { state: "ok", count: items.length, at: Date.now() } }));
          items.forEach((a) => {
            if (!existingIds.has(a.id)) newOnes.push(a.id);
          });
        } else {
          setStatus((prev) => ({ ...prev, [src.id]: { state: "err", at: Date.now() } }));
        }
      });

      /* fill in snapshots for sources with no live data */
      FEEDS.forEach((src) => {
        const st = status[src.id];
        if (st?.state !== "ok") {
          const snaps = SNAPSHOTS[src.id];
          if (snaps) {
            const now = Date.now();
            snaps.forEach((s, i) => {
              const id = `${src.id}::snap-${i}`;
              if (!seen.has(id)) {
                seen.add(id);
                all.push({
                  id,
                  sourceId: src.id,
                  title: s.t,
                  description: s.d,
                  link: src.site,
                  pubDate: now - i * 1800_000,
                  fromSnapshot: true,
                });
              }
            });
          }
        }
      });

      all.sort((a, b) => b.pubDate - a.pubDate);
      setArticles(all);
      const now = Date.now();
      setLastSync(now);

      if (newOnes.length > 0) {
        setNewIds(new Set(newOnes));
        setNewCount(newOnes.length);
        addLog("new", `${np(newOnes.length)} नयाँ खबर भेटियो`);
      }

      const okCount = results.filter((r) => r.status === "fulfilled" && (r.value as Article[]).length > 0).length;
      addLog("info", `सिंक पूरा — ${np(okCount)}/${np(FEEDS.length)} स्रोत सक्रिय`);

      setSyncing(false);
      setRemaining(intervalSec);
    },
    [syncing, addLog, intervalSec, status]
  );

  /* auto-sweep */
  useEffect(() => {
    if (intervalSec <= 0) return;
    const t = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          void syncAll();
          return intervalSec;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [intervalSec, syncAll]);

  /* initial sync */
  useEffect(() => {
    void syncAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    articles,
    status,
    log,
    syncing,
    lastSync,
    lastSyncLabel: lastSync ? timeAgoNe(lastSync, Date.now()) : null,
    disabled,
    saved,
    intervalSec,
    remaining,
    newIds,
    newCount,
    syncAll,
    toggleSource,
    toggleSaved,
    setIntervalSec,
    clearNew,
  };
}
