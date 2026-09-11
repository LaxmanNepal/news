import fs from "node:fs/promises";
import path from "node:path";
import { FEEDS, SNAPSHOTS } from "./feeds.mjs";

const OUT = path.resolve("data");
const MAX_PER_SOURCE = 40;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 12000;
const CATEGORY_RULES = {
  rajaniti: ["सरकार", "मन्त्री", "मंत्री", "प्रधानमन्त्री", "संसद", "निर्वाचन", "चुनाव", "दल", "एमाले", "कांग्रेस", "माओवादी", "राजनीति", "राष्ट्रपति", "अदालत", "कानुन"],
  artha: ["नेप्से", "सेयर", "शेयर", "बैंक", "बजेट", "अर्थतन्त्र", "अर्थ", "व्यापार", "व्यवसाय", "कर", "राजस्व", "लगानी", "रुपैयाँ", "डलर", "बजार", "आयात", "निर्यात"],
  khelkud: ["क्रिकेट", "फुटबल", "खेल", "खेलाडी", "विश्वकप", "ओलम्पिक", "गोल", "रन", "विकेट", "टेनिस", "बास्केटबल"],
  manoranjan: ["फिल्म", "चलचित्र", "सिनेमा", "अभिनेता", "अभिनेत्री", "गायक", "गायिका", "गीत", "संगीत", "मनोरञ्जन", "टेलिभिजन", "कलाकार"],
  prabidhi: ["प्रविधि", "टेक", "मोबाइल", "स्मार्टफोन", "आईफोन", "एन्ड्रोइड", "एआई", "कृत्रिम बुद्धिमत्ता", "एप", "एप्लिकेसन", "इन्टरनेट", "सफ्टवेयर", "कम्प्युटर", "ग्याजेट", "डिजिटल"],
  bidesh: ["अमेरिका", "भारत", "चीन", "बेलायत", "ब्रिटेन", "विदेश", "अन्तर्राष्ट्रिय", "विश्व", "राष्ट्रसंघ", "रुस", "युक्रेन", "इजरायल", "गाजा", "पाकिस्तान", "दक्षिण एसिया"]
};
function stripHtml(value = "") { return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim(); }
function decodeXml(value = "") { return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))); }
function firstMatch(block, patterns) { for (const pattern of patterns) { const match = block.match(pattern); if (match?.[1]) return stripHtml(decodeXml(match[1])); } return ""; }
function normalizeUrl(value = "") { try { const u = new URL(value); u.hash = ""; ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "output", "amp"].forEach((key) => u.searchParams.delete(key)); return u.toString().replace(/\/$/, ""); } catch { return value.trim().toLowerCase(); } }
function normalizeText(value = "") { return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").trim(); }
function imageFrom(block) { const patterns = [/<(?:media:)?(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i, /<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i, /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i, /<image[^>]*>[\s\S]*?<url[^>]*>([\s\S]*?)<\/url>[\s\S]*?<\/image>/i]; for (const pattern of patterns) { const match = block.match(pattern)?.[1]; if (match) return decodeXml(match.trim()); } return undefined; }
function classifyArticle(title, description, sourceCategory) { const text = `${title} ${description}`; let best = sourceCategory === "taja" ? "taja" : sourceCategory; let bestScore = 0; for (const [category, keywords] of Object.entries(CATEGORY_RULES)) { const score = keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0); if (score > bestScore) { bestScore = score; best = category; } } return best; }
function parseFeed(xml, src) {
  const itemBlocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const entryBlocks = itemBlocks.length ? [] : [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
  const blocks = [...itemBlocks, ...entryBlocks].slice(0, MAX_PER_SOURCE);
  const now = Date.now();
  return blocks.map((block) => {
    const title = firstMatch(block, [/<title[^>]*>([\s\S]*?)<\/title>/i]);
    const description = firstMatch(block, [/<description[^>]*>([\s\S]*?)<\/description>/i, /<summary[^>]*>([\s\S]*?)<\/summary>/i, /<content[^>]*>([\s\S]*?)<\/content>/i]).slice(0, 700);
    const link = normalizeUrl(firstMatch(block, [/<link[^>]+href=["']([^"']+)["'][^>]*\/?\s*>/i, /<link[^>]*>([\s\S]*?)<\/link>/i]) || src.site);
    const dateRaw = firstMatch(block, [/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i, /<published[^>]*>([\s\S]*?)<\/published>/i, /<updated[^>]*>([\s\S]*?)<\/updated>/i, /<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i]);
    const parsedDate = Date.parse(dateRaw); const pubDate = Number.isFinite(parsedDate) ? parsedDate : now;
    const image = imageFrom(block); const category = classifyArticle(title, description, src.category);
    return { sourceId: src.id, title: title.slice(0, 240), description, link, ...(image ? { image } : {}), pubDate, category };
  }).filter((a) => a.title && now - a.pubDate < MAX_AGE_MS);
}
async function fetchWithTimeout(url) { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), TIMEOUT_MS); try { const response = await fetch(url, { signal: controller.signal, headers: { "user-agent": "KhabarDhara-NewsBot/3.0", accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8" } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return await response.text(); } finally { clearTimeout(timer); } }
async function loadSource(src) { try { const xml = await fetchWithTimeout(src.feed); const articles = parseFeed(xml, src); if (!articles.length) throw new Error("No articles parsed"); return { src, articles, ok: true }; } catch (error) { return { src, articles: [], ok: false, error: error instanceof Error ? error.message : String(error) }; } }
await fs.mkdir(OUT, { recursive: true });
const results = await Promise.all(FEEDS.map(loadSource));
const byUrl = new Map(); const byTitle = new Map(); const articles = []; const sources = [];
for (const result of results) {
  sources.push({ id: result.src.id, name: result.src.name, site: result.src.site, feed: result.src.feed, category: result.src.category, tag: result.src.tag, ok: result.ok, count: result.articles.length, ...(result.ok ? {} : { error: result.error }) });
  for (const article of result.articles) {
    const urlKey = normalizeUrl(article.link); const titleKey = normalizeText(article.title);
    if (urlKey && byUrl.has(urlKey)) continue;
    if (titleKey && byTitle.has(titleKey)) { const existing = byTitle.get(titleKey); if (article.pubDate > existing.pubDate) Object.assign(existing, article, { sourceId: existing.sourceId, id: existing.id }); continue; }
    const normalized = { ...article, id: `${article.sourceId}::${Buffer.from(urlKey || titleKey).toString("base64url").slice(0, 32)}` };
    articles.push(normalized); if (urlKey) byUrl.set(urlKey, normalized); if (titleKey) byTitle.set(titleKey, normalized);
  }
}
for (const src of FEEDS) { const result = results.find((r) => r.src.id === src.id); if (!result?.ok && SNAPSHOTS[src.id]) SNAPSHOTS[src.id].forEach((snap, index) => articles.push({ id: `${src.id}::snap-${index}`, sourceId: src.id, title: snap.t, description: snap.d, link: src.site, pubDate: Date.now() - index * 1800000, fromSnapshot: true, category: classifyArticle(snap.t, snap.d, src.category) })); }
articles.sort((a, b) => b.pubDate - a.pubDate);
const generatedAt = new Date().toISOString();
const categoryIds = ["rajaniti", "artha", "khelkud", "manoranjan", "prabidhi", "bidesh"];
const files = { "news.json": { generatedAt, articleCount: articles.length, sourceCount: FEEDS.length, articles }, "latest.json": { generatedAt, articles: articles.slice(0, 100) }, "taja.json": { generatedAt, articles: articles.slice(0, 100) }, "sources.json": { generatedAt, sources }, "meta.json": { generatedAt, sourceCount: FEEDS.length, successfulSources: results.filter((r) => r.ok).length, articleCount: articles.length, categories: categoryIds } };
for (const category of categoryIds) files[`${category}.json`] = { generatedAt, category, articles: articles.filter((a) => a.category === category).slice(0, 100) };
for (const [name, value] of Object.entries(files)) await fs.writeFile(path.join(OUT, name), JSON.stringify(value, null, 2) + "\n", "utf8");
console.log(`KhabarDhara ingestion complete: ${articles.length} unique articles from ${results.filter((r) => r.ok).length}/${FEEDS.length} sources.`);
