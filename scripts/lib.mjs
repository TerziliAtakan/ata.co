// Shared helpers for build.mjs and translate.mjs. No external dependencies.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
export const rel = (...p) => path.join(ROOT, ...p);

export function slugify(s) {
  const map = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  return String(s || "")
    .replace(/İ/g, "i").replace(/I/g, "i").toLowerCase()
    .replace(/[çğıöşüâîû]/g, (c) => map[c])
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
}

export const hash = (obj) => crypto.createHash("sha1").update(JSON.stringify(obj)).digest("hex").slice(0, 16);

const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- Markdown (small, safe subset) ----------
   If the text already contains HTML blocks (rich-text editors often save HTML), it is passed through. */
function inline(s) {
  s = escHtml(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, a, u) => `<img src="${u}" alt="${a}" loading="lazy">`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>").replace(/(^|\W)_([^_\s][^_]*)_(?=\W|$)/g, "$1<em>$2</em>");
  return s;
}
export function md(src) {
  src = String(src || "").replace(/\r\n?/g, "\n").trim();
  if (!src) return "";
  if (/^\s*<(p|h[1-6]|ul|ol|div|blockquote|figure|img|table)\b/i.test(src)) return sanitize(src);
  const out = [];
  const blocks = src.split(/\n{2,}/);
  for (let b of blocks) {
    const lines = b.split("\n");
    if (/^#{1,6}\s/.test(b)) {
      const lvl = Math.min(6, Math.max(2, b.match(/^#+/)[0].length));
      out.push(`<h${lvl}>${inline(b.replace(/^#+\s*/, ""))}</h${lvl}>`);
    } else if (lines.every((l) => /^\s*[-*+]\s+/.test(l))) {
      out.push("<ul>" + lines.map((l) => `<li>${inline(l.replace(/^\s*[-*+]\s+/, ""))}</li>`).join("") + "</ul>");
    } else if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
      out.push("<ol>" + lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("") + "</ol>");
    } else if (lines.every((l) => /^>\s?/.test(l))) {
      out.push(`<blockquote><p>${inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "))}</p></blockquote>`);
    } else if (/^(-{3,}|\*{3,})$/.test(b.trim())) {
      out.push("<hr>");
    } else {
      out.push(`<p>${lines.map(inline).join("<br>")}</p>`);
    }
  }
  return out.join("\n");
}
// Strip scripts, inline handlers and javascript: URLs from editor HTML.
export function sanitize(html) {
  return String(html)
    .replace(/<\s*(script|style|iframe|object|embed)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}

/* ---------- YAML front matter (the subset Pages CMS writes) ---------- */
function scalar(v) {
  v = v.trim();
  if (v === "" || v === "~" || v === "null") return "";
  if (/^(true|false)$/i.test(v)) return v.toLowerCase() === "true";
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if ((v.startsWith('"') && v.endsWith('"'))) { try { return JSON.parse(v); } catch { return v.slice(1, -1); } }
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  if (v.startsWith("[") && v.endsWith("]")) return v.slice(1, -1).split(",").map((x) => scalar(x)).filter((x) => x !== "");
  return v;
}
export function frontmatter(text) {
  text = String(text).replace(/\r\n?/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = {}; let key = null, block = null, blockLines = [];
  const flush = () => { if (key && block) { data[key] = block === "|" ? blockLines.join("\n") : blockLines.join(" ").trim(); } block = null; blockLines = []; };
  for (const line of m[1].split("\n")) {
    if (block && (/^\s+/.test(line) || line === "")) { blockLines.push(line.replace(/^\s{2}/, "")); continue; }
    if (block) flush();
    const li = line.match(/^\s+-\s+(.*)$/);
    if (li && key) { if (!Array.isArray(data[key])) data[key] = []; data[key].push(scalar(li[1])); continue; }
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      if (/^[|>][-+]?$/.test(kv[2].trim())) { block = kv[2].trim()[0]; blockLines = []; data[key] = ""; }
      else data[key] = kv[2].trim() === "" ? [] : scalar(kv[2]);
    }
  }
  flush();
  for (const k in data) if (Array.isArray(data[k]) && data[k].length === 0) data[k] = "";
  return { data, body: m[2] };
}

/* ---------- content readers ---------- */
const readJSON = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
export const readSite = () => readJSON(rel("content/site.json"), {});
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => (typeof x === "object" && x ? x.image || x.src || x.url || "" : x)).filter(Boolean);
const SCENE = { projeden: "night", "ikinci-el": "villa", kiralik: "interior", arsa: "land" };

export function readListings({ includeSamples = false } = {}) {
  const dir = rel("content/listings");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f, i) => {
    const d = readJSON(path.join(dir, f), null);
    if (!d) { console.warn("! okunamadı:", f); return null; }
    if (d.sample && !includeSamples) return null;
    const slug = slugify(f.replace(/\.json$/, ""));
    const category = SCENE[d.category] ? d.category : "ikinci-el";
    return {
      slug, sample: !!d.sample,
      title: String(d.title || slug), status: ["aktif", "satildi", "kiralandi"].includes(d.status) ? d.status : "aktif",
      featured: !!d.featured, order: Number(d.order) || 99, category, type: d.type || "",
      location: String(d.location || ""), rooms: String(d.rooms || ""), size_m2: Number(d.size_m2) || 0, bathrooms: Number(d.bathrooms) || 0,
      price: Number(String(d.price || 0).replace(/[^\d.]/g, "")) || 0, currency: d.currency || "GBP", price_on_request: !!d.price_on_request,
      rent_period: d.rent_period || "", summary: String(d.summary || ""), description_html: md(d.description),
      photos: asList(d.photos), video_url: String(d.video_url || "").trim(), portal_url: String(d.portal_url || "").trim(),
      scene: SCENE[category], seed: 100 + i,
    };
  }).filter(Boolean);
}

export function readPosts({ includeSamples = false } = {}) {
  const dir = rel("content/blog");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.(md|markdown)$/.test(f)).map((f) => {
    const { data, body } = frontmatter(fs.readFileSync(path.join(dir, f), "utf8"));
    if (data.sample && !includeSamples) return null;
    if (data.draft === true) return null;
    const base = f.replace(/\.(md|markdown)$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
    let date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = (f.match(/^\d{4}-\d{2}-\d{2}/) || [new Date().toISOString().slice(0, 10)])[0];
    const html = md(data.body || body);
    return { slug: slugify(base), title: String(data.title || base), date, cover: asList(data.cover)[0] || "", excerpt: String(data.excerpt || ""), body_html: html, sample: !!data.sample };
  }).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date));
}

export const translationPath = (kind, slug) => rel("content/translations", kind, slug + ".json");
export const readTranslation = (kind, slug) => readJSON(translationPath(kind, slug), null);
