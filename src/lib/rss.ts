import type { FeedSource, CategoryId } from "../data/feeds";
import { np } from "../data/feeds";

export interface Article {
  id: string;
  sourceId: string;
  title: string;
  description: string;
  link: string;
  image?: string;
  pubDate: number;
  category?: CategoryId | "taja";
  fromSnapshot?: boolean;
  trendingScore?: number;
  breaking?: boolean;
  clusterId?: string;
}

export type FeedStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok"; count: number; at: number }
  | { state: "err"; at: number };

const pad2 = (n: number) => String(n).padStart(2, "0");
export function clockNe(ts: number): string { const d = new Date(ts); return np(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`); }
export function hhmmssNe(ts: number): string { const d = new Date(ts); return np(`${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`); }
const NE_MONTHS = ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"];
const NE_DAYS = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
export function fullDateNe(ts: number): string { const d = new Date(ts); return `${NE_DAYS[d.getDay()]}, ${np(d.getDate())} ${NE_MONTHS[d.getMonth()]} ${np(d.getFullYear())}`; }
export function timeAgoNe(ts: number, now: number): string {
  const diff = Math.max(0, now - ts), s = Math.floor(diff / 1000);
  try { const rtf = new Intl.RelativeTimeFormat("ne", { numeric: "auto" }); if (s < 60) return rtf.format(-s, "second"); const m = Math.floor(s / 60); if (m < 60) return rtf.format(-m, "minute"); const h = Math.floor(m / 60); if (h < 24) return rtf.format(-h, "hour"); return rtf.format(-Math.floor(h / 24), "day"); } catch { if (s < 60) return `${np(s)} सेकेन्डअघि`; const m = Math.floor(s / 60); if (m < 60) return `${np(m)} मिनेटअघि`; return `${np(Math.floor(m / 3600))} घण्टाअघि`; }
}
const PROXIES: ((u: string) => string)[] = [(u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`];
async function fetchWithTimeout(url: string, ms = 11000): Promise<Response> { const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms); try { return await fetch(url, { signal: ctrl.signal }); } finally { clearTimeout(t); } }
function stripHtml(html: string): string { const div = document.createElement("div"); div.innerHTML = html; return (div.textContent ?? "").replace(/\s+/g, " ").trim(); }
function parseDate(raw: string | null | undefined): number { if (!raw) return Date.now(); const t = Date.parse(raw); return Number.isFinite(t) ? t : Date.now(); }
function findImage(item: Element): string | undefined { const media = item.getElementsByTagNameNS("*", "thumbnail")[0] ?? item.getElementsByTagNameNS("*", "content")[0]; if (media?.getAttribute("url")) return media.getAttribute("url") ?? undefined; const enclosure = item.querySelector("enclosure[type^='image']"); if (enclosure?.getAttribute("url")) return enclosure.getAttribute("url") ?? undefined; const content = item.getElementsByTagNameNS("*", "encoded")[0]?.textContent; const m = content?.match(/<img[^>]+src=["']([^"']+)["']/i); return m?.[1]; }
function parseFeedXml(xmlText: string, src: FeedSource): Article[] { const doc = new DOMParser().parseFromString(xmlText, "text/xml"); if (doc.querySelector("parsererror")) return []; const items = doc.querySelectorAll("item"); const entries = items.length ? Array.from(items) : Array.from(doc.querySelectorAll("entry")); const now = Date.now(); return entries.slice(0, 25).flatMap((el, i) => { const title = el.querySelector("title")?.textContent?.trim() ?? ""; if (!title) return []; const link = el.querySelector("link")?.getAttribute("href") ?? el.querySelector("link")?.textContent?.trim() ?? ""; const rawDesc = el.querySelector("description")?.textContent ?? el.getElementsByTagNameNS("*", "summary")[0]?.textContent ?? el.getElementsByTagNameNS("*", "content")[0]?.textContent ?? ""; const pubRaw = el.querySelector("pubDate")?.textContent ?? el.getElementsByTagNameNS("*", "date")[0]?.textContent ?? el.getElementsByTagNameNS("*", "updated")[0]?.textContent ?? el.getElementsByTagNameNS("*", "published")[0]?.textContent; return [{ id: `${src.id}::${link || title}-${i}`, sourceId: src.id, title: stripHtml(title).slice(0, 220), description: stripHtml(rawDesc).slice(0, 600), link: link || src.site, image: findImage(el), pubDate: parseDate(pubRaw), category: src.category }]; }).filter((a) => now - a.pubDate < 60 * 86400_000); }
async function viaRss2Json(src: FeedSource): Promise<Article[]> { const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(src.feed)}`; const res = await fetchWithTimeout(url); if (!res.ok) throw new Error("rss2json failed"); const json = (await res.json()) as { status?: string; items?: { title?: string; link?: string; description?: string; pubDate?: string; thumbnail?: string; enclosure?: { link?: string } }[] }; if (json.status !== "ok" || !json.items?.length) throw new Error("rss2json empty"); return json.items.slice(0, 25).map((it, i) => ({ id: `${src.id}::${it.link || it.title}-${i}`, sourceId: src.id, title: stripHtml(it.title ?? "").slice(0, 220), description: stripHtml(it.description ?? "").slice(0, 600), link: it.link || src.site, image: it.thumbnail || it.enclosure?.link, pubDate: parseDate(it.pubDate), category: src.category })); }
export async function loadFeed(src: FeedSource): Promise<Article[]> { for (const proxy of PROXIES) { try { const res = await fetchWithTimeout(proxy(src.feed)); if (!res.ok) continue; const text = await res.text(); const parsed = parseFeedXml(text, src); if (parsed.length) return parsed; } catch {} } try { return await viaRss2Json(src); } catch { throw new Error("all-proxies-failed"); } }
