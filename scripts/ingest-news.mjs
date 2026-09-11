import fs from "node:fs/promises";
import path from "node:path";
import { FEEDS, SNAPSHOTS } from "./feeds.mjs";

const OUT = path.resolve("data");
const MAX_PER_SOURCE = 25;
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 12000;

function stripHtml(value = "") {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, " ").trim();
}
function firstMatch(block, patterns) { for (const pattern of patterns) { const match = block.match(pattern); if (match?.[1]) return stripHtml(match[1]); } return ""; }
function decodeXml(value = "") { return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }
function imageFrom(block) {
  const direct = block.match(/<(?:media:)?(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i)?.[1];
  if (direct) return decodeXml(direct);
  const enclosure = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1];
  if (enclosure) return decodeXml(enclosure);
  const html = block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  return html ? decodeXml(html) : undefined;
}
function parseFeed(xml, src) {
  const itemBlocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const entryBlocks = itemBlocks.length ? [] : [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
  const blocks = [...itemBlocks, ...entryBlocks].slice(0, MAX_PER_SOURCE);
  const now = Date.now();
  return blocks.map((block, index) => {
    const title = firstMatch(block, [/<title[^>]*>([\s\S]*?)<\/title>/i]);
    const description = firstMatch(block, [/<description[^>]*>([\s\S]*?)<\/description>/i, /<summary[^>]*>([\s\S]*?)<\/summary>/i, /<content[^>]*>([\s\S]*?)<\/content>/i]).slice(0, 600);
    const link = decodeXml(firstMatch(block, [/<link[^>]+href=["']([^"']+)["'][^>]*\/?\s*>/i, /<link[^>]*>([\s\S]*?)<\/link>/i]) || src.site);
    const dateRaw = firstMatch(block, [/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i, /<published[^>]*>([\s\S]*?)<\/published>/i, /<updated[^>]*>([\s\S]*?)<\/updated>/i, /<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i]);
    const parsedDate = Date.parse(dateRaw);
    const pubDate = Number.isFinite(parsedDate) ? parsedDate : now;
    const image = imageFrom(block);
    return { id: `${src.id}::${link || title}-${index}`, sourceId: src.id, title: title.slice(0, 220), description, link, ...(image ? { image } : {}), pubDate };
  }).filter((a) => a.title && now - a.pubDate < MAX_AGE_MS);
}
async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try { const response = await fetch(url, { signal: controller.signal, headers: { "user-agent": "KhabarDhara-NewsBot/2.0" } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return await response.text(); }
  finally { clearTimeout(timer); }
}
async function loadSource(src) {
  try { const xml = await fetchWithTimeout(src.feed); const articles = parseFeed(xml, src); if (!articles.length) throw new Error("No articles parsed"); return { src, articles, ok: true }; }
  catch (error) { return { src, articles: [], ok: false, error: error instanceof Error ? error.message : String(error) }; }
}
await fs.mkdir(OUT, { recursive: true });
const results = await Promise.all(FEEDS.map(loadSource));
const seen = new Set();
const articles = [];
const sources = [];
for (const result of results) {
  sources.push({ id: result.src.id, name: result.src.name, site: result.src.site, feed: result.src.feed, category: result.src.category, tag: result.src.tag, ok: result.ok, count: result.articles.length, ...(result.ok ? {} : { error: result.error }) });
  for (const article of result.articles) { if (seen.has(article.id)) continue; seen.add(article.id); articles.push({ ...article, category: result.src.category }); }
}
for (const src of FEEDS) {
  const result = results.find((r) => r.src.id === src.id);
  if (!result?.ok && SNAPSHOTS[src.id]) SNAPSHOTS[src.id].forEach((snap, index) => {
    const id = `${src.id}::snap-${index}`;
    if (seen.has(id)) return;
    articles.push({ id, sourceId: src.id, title: snap.t, description: snap.d, link: src.site, pubDate: Date.now() - index * 1800000, fromSnapshot: true, category: src.category });
  });
}
articles.sort((a, b) => b.pubDate - a.pubDate);
const generatedAt = new Date().toISOString();
const files = {
  "news.json": { generatedAt, articleCount: articles.length, sourceCount: FEEDS.length, articles },
  "latest.json": { generatedAt, articles: articles.slice(0, 100) },
  "sources.json": { generatedAt, sources },
  "meta.json": { generatedAt, sourceCount: FEEDS.length, successfulSources: results.filter((r) => r.ok).length, articleCount: articles.length },
};
for (const category of ["rajaniti", "artha", "khelkud", "manoranjan", "prabidhi", "bidesh"]) files[`${category}.json`] = { generatedAt, articles: articles.filter((a) => a.category === category).slice(0, 100) };
for (const [name, value] of Object.entries(files)) await fs.writeFile(path.join(OUT, name), JSON.stringify(value, null, 2) + "\n", "utf8");
console.log(`KhabarDhara ingestion complete: ${articles.length} articles from ${results.filter((r) => r.ok).length}/${FEEDS.length} sources.`);
