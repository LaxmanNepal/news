import { useCallback, useEffect, useRef, useState } from "react";
import { FEEDS, np } from "../data/feeds";
import { timeAgoNe } from "../lib/rss";
import type { Article, FeedStatus } from "../lib/rss";

export interface LogEntry {
  id: number;
  at: number;
  kind: "info" | "warn" | "new";
  msg: string;
}

// The browser now reads generated static data. The GitHub Action is the news engine.
export const INTERVAL_OPTIONS: { sec: number; label: string }[] = [
  { sec: 0, label: "बन्द" },
  { sec: 60, label: "१ मि" },
  { sec: 300, label: "५ मि" },
  { sec: 600, label: "१० मि" },
  { sec: 1800, label: "३० मि" },
];

const LS = { disabled: "kd-disabled", saved: "kd-saved", interval: "kd-interval" };
const DATA_URL = `${import.meta.env.BASE_URL}data/news.json`;

function readLS<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch { return fallback; }
}
function writeLS(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

function emptyStatus() {
  return Object.fromEntries(FEEDS.map((f) => [f.id, { state: "idle" as const }])) as Record<string, FeedStatus>;
}

function buildStatus(items: Article[]): Record<string, FeedStatus> {
  const now = Date.now();
  const next = emptyStatus();
  for (const feed of FEEDS) {
    const count = items.filter((a) => a.sourceId === feed.id).length;
    next[feed.id] = count > 0 ? { state: "ok", count, at: now } : { state: "err", at: now };
  }
  return next;
}

export function useNews() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [status, setStatus] = useState<Record<string, FeedStatus>>(emptyStatus);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [disabled, setDisabled] = useState<string[]>(() => readLS<string[]>(LS.disabled, []));
  const [saved, setSaved] = useState<string[]>(() => readLS<string[]>(LS.saved, []));
  const [intervalSec, setIntervalSecState] = useState<number>(() => readLS<number>(LS.interval, 300));
  const [remaining, setRemaining] = useState<number>(() => readLS<number>(LS.interval, 300));
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [newCount, setNewCount] = useState(0);
  const logIdRef = useRef(0);
  const articlesRef = useRef<Article[]>([]);
  articlesRef.current = articles;

  const addLog = useCallback((kind: LogEntry["kind"], msg: string) => {
    setLog((prev) => [{ id: ++logIdRef.current, at: Date.now(), kind, msg }, ...prev].slice(0, 80));
  }, []);

  const setIntervalSec = useCallback((sec: number) => {
    setIntervalSecState(sec); setRemaining(sec); writeLS(LS.interval, sec);
  }, []);

  const toggleSource = useCallback((id: string) => {
    setDisabled((prev) => { const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]; writeLS(LS.disabled, next); return next; });
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => { const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]; writeLS(LS.saved, next); return next; });
  }, []);

  const clearNew = useCallback(() => { setNewIds(new Set()); setNewCount(0); }, []);

  const syncAll = useCallback(async (manual = false) => {
    if (syncing) return;
    setSyncing(true);
    if (manual) addLog("info", "केन्द्रीय समाचार डेटा ताजा गर्दै…");
    try {
      const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { generatedAt?: string; articles?: Article[] };
      const next = Array.isArray(json.articles) ? json.articles : [];
      const previous = new Set(articlesRef.current.map((a) => a.id));
      const fresh = next.filter((a) => !previous.has(a.id)).map((a) => a.id);
      setArticles(next);
      setStatus(buildStatus(next));
      const now = Date.now();
      setLastSync(now);
      if (fresh.length) { setNewIds(new Set(fresh)); setNewCount(fresh.length); addLog("new", `${np(fresh.length)} नयाँ खबर भेटियो`); }
      addLog("info", `केन्द्रीय डेटा सिंक पूरा — ${np(next.length)} खबर`);
    } catch (error) {
      addLog("warn", `डेटा सिंक असफल — ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      setSyncing(false);
      setRemaining(intervalSec);
    }
  }, [syncing, intervalSec, addLog]);

  useEffect(() => {
    if (intervalSec <= 0) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) { void syncAll(); return intervalSec; }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [intervalSec, syncAll]);

  useEffect(() => { void syncAll(); }, []);

  return {
    articles, status, log, syncing, lastSync,
    lastSyncLabel: lastSync ? timeAgoNe(lastSync, Date.now()) : null,
    disabled, saved, intervalSec, remaining, newIds, newCount,
    syncAll, toggleSource, toggleSaved, setIntervalSec, clearNew,
  };
}
