// Builds the site into dist/ (production) or dist-preview/index.html (single-file preview).
//   node scripts/build.mjs            -> dist/  (TR at /, EN at /en/, RU at /ru/)
//   node scripts/build.mjs --preview  -> dist-preview/index.html (sample content, everything inlined)
import fs from "node:fs";
import path from "node:path";
import { rel, readSite, readListings, readPosts, readTranslation } from "./lib.mjs";

const PREVIEW = process.argv.includes("--preview");
const OUT = rel(PREVIEW ? "dist-preview" : "dist");
const I18N = JSON.parse(fs.readFileSync(rel("src/i18n.json"), "utf8"));
const LANGS = ["tr", "en", "ru"];
const site = readSite();
const domain = String(site.domain || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
const repo = process.env.REPO_NAME || "";
const BASE = PREVIEW ? "" : domain || !repo || repo.endsWith(".github.io") ? "/" : `/${repo}/`;
const ORIGIN = domain ? `https://${domain}` : repo && process.env.REPO_OWNER ? `https://${process.env.REPO_OWNER.toLowerCase()}.github.io` : "";
const tr = (k, l) => { const e = I18N[k]; return e ? e[LANGS.indexOf(l)] ?? e[0] : k; };

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

/* ---------- images ---------- */
let sharp = null;
if (!PREVIEW) { try { sharp = (await import("sharp")).default; } catch { console.log("sharp yok: görseller sıkıştırılmadan kopyalanır."); } }
const imgCache = new Map();
async function image(p) {
  if (!p) return "";
  if (/^https?:\/\//.test(p)) return p;
  const clean = p.replace(/^\/+/, "");
  const file = rel(clean);
  if (!fs.existsSync(file)) { console.warn("! görsel bulunamadı:", p); return ""; }
  if (PREVIEW) return "";
  if (imgCache.has(clean)) return imgCache.get(clean);
  let result = BASE + clean;
  if (sharp && /\.(jpe?g|png|webp|avif|heic|tiff?)$/i.test(clean)) {
    const name = clean.replace(/^uploads\//, "").replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-");
    fs.mkdirSync(path.join(OUT, "img"), { recursive: true });
    try {
      const meta = await sharp(file).metadata();
      const sizes = { s: 800, m: 1600, l: 2400 };
      const r = {};
      for (const [k, w] of Object.entries(sizes)) {
        if (k === "l" && (meta.width || 0) < 2000) continue;
        await sharp(file).rotate().resize({ width: Math.min(w, meta.width || w), withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(OUT, "img", `${name}-${w}.webp`));
        r[k] = `${BASE}img/${name}-${w}.webp`;
      }
      result = r;
    } catch (e) { console.warn("! görsel işlenemedi:", p, e.message); }
  }
  imgCache.set(clean, result);
  return result;
}
const fixInlineSrc = (html) => html.replace(/(src|href)="\/(uploads|files)\//g, `$1="${BASE}$2/`);

/* ---------- content ---------- */
const listings = readListings({ includeSamples: PREVIEW });
for (const l of listings) {
  l.photos = (await Promise.all(l.photos.map(image))).filter(Boolean);
  l.description_html = fixInlineSrc(l.description_html);
  const t = readTranslation("listings", l.slug);
  if (t) l.i18n = { en: t.en, ru: t.ru };
  if (l.i18n) for (const k of ["en", "ru"]) if (l.i18n[k]?.description_html) l.i18n[k].description_html = fixInlineSrc(l.i18n[k].description_html);
}
const posts = readPosts({ includeSamples: PREVIEW });
for (const p of posts) {
  p.cover = await image(p.cover);
  p.body_html = fixInlineSrc(p.body_html);
  const t = readTranslation("blog", p.slug);
  if (t) p.i18n = { en: t.en, ru: t.ru };
  if (p.i18n) for (const k of ["en", "ru"]) if (p.i18n[k]?.body_html) p.i18n[k].body_html = fixInlineSrc(p.i18n[k].body_html);
}
const S = { ...site };
for (const k of ["hero_image", "portrait_image", "intro_video_cover", "nc_image"]) S[k] = await image(site[k]);
S.handbook_pdf = site.handbook_pdf ? (/^https?:/.test(site.handbook_pdf) ? site.handbook_pdf : BASE + site.handbook_pdf.replace(/^\/+/, "")) : "";

/* ---------- assets ---------- */
const ASSETS = rel("src/assets");
const asset = (name) => {
  const f = fs.readdirSync(ASSETS).find((x) => x.replace(/\.[^.]+$/, "") === name);
  if (!f) throw new Error("asset yok: " + name);
  if (PREVIEW) { const ext = f.split(".").pop(); return `data:image/${ext === "jpg" ? "jpeg" : ext};base64,` + fs.readFileSync(path.join(ASSETS, f)).toString("base64"); }
  return `${BASE}assets/${f}`;
};
if (!PREVIEW) {
  fs.cpSync(ASSETS, path.join(OUT, "assets"), { recursive: true });
  for (const d of ["uploads", "files"]) if (fs.existsSync(rel(d))) fs.cpSync(rel(d), path.join(OUT, d), { recursive: true, filter: (s) => !s.endsWith(".gitkeep") });
}

/* ---------- page ---------- */
let tpl = fs.readFileSync(rel("src/template.html"), "utf8");
tpl = tpl.replace("/*SCENES*/", () => fs.readFileSync(rel("src/scenes.js"), "utf8"));
tpl = tpl.replace(/\{\{A:([a-z0-9-]+)\}\}/g, (m, n) => asset(n));

const paths = { tr: BASE, en: BASE + "en/", ru: BASE + "ru/" };
const escAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function head(lang) {
  const title = tr("meta.title", lang), desc = tr("meta.desc", lang);
  const url = ORIGIN ? ORIGIN + paths[lang] : "";
  const og = ORIGIN ? ORIGIN + BASE + "assets/og.jpg" : "";
  let h = `<title>${escAttr(title)}</title>\n<meta name="description" content="${escAttr(desc)}">\n<meta name="theme-color" content="#151412">\n`;
  if (PREVIEW) return `<title>ATA.CO</title>\n<meta name="description" content="${escAttr(desc)}">\n`;
  h += `<link rel="icon" type="image/png" sizes="32x32" href="${BASE}assets/favicon-32.png">\n<link rel="apple-touch-icon" href="${BASE}assets/apple-touch-icon.png">\n`;
  if (url) {
    h += `<link rel="canonical" href="${url}">\n`;
    for (const l of LANGS) h += `<link rel="alternate" hreflang="${l}" href="${ORIGIN + paths[l]}">\n`;
    h += `<link rel="alternate" hreflang="x-default" href="${ORIGIN + paths.tr}">\n`;
  }
  h += `<meta property="og:type" content="website">\n<meta property="og:title" content="${escAttr(title)}">\n<meta property="og:description" content="${escAttr(desc)}">\n<meta property="og:locale" content="${{ tr: "tr_TR", en: "en_GB", ru: "ru_RU" }[lang]}">\n`;
  if (url) h += `<meta property="og:url" content="${url}">\n`;
  if (og) h += `<meta property="og:image" content="${og}">\n<meta name="twitter:card" content="summary_large_image">\n`;
  const ld = { "@context": "https://schema.org", "@type": "RealEstateAgent", name: "ata.co — Atakan Terzili", telephone: "+" + site.whatsapp, email: site.email,
    address: { "@type": "PostalAddress", streetAddress: "Long Beach", addressLocality: "İskele", addressCountry: "CY" },
    areaServed: ["İskele", "Long Beach", "Bafra", "Girne", "Esentepe", "Gazimağusa"], sameAs: [site.instagram, site.facebook, site.youtube, site.tiktok].filter(Boolean) };
  if (url) ld.url = ORIGIN + BASE;
  h += `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n`;
  return h;
}

function render(lang, fixedLang) {
  let html = tpl.replace("<!--HEAD-->", head(lang));
  // pre-render translated text so search engines and no-JS visitors get real content in each language
  html = html.replace(/(<([a-z0-9]+)\b[^>]*\sdata-i="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g, (m, open, tag, key, inner, close) => open + tr(key, lang) + close);
  const data = { preview: PREVIEW, lang, fixedLang, paths: PREVIEW ? null : paths, i18n: I18N, site: S, listings, posts };
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  html = html.replace("<!--DATA-->", `<script id="site-data" type="application/json">${json}</script>`);
  if (!PREVIEW) html = `<!doctype html>\n<html lang="${lang}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n` +
    html.replace(/(<\/style>)/, "$1\n</head>\n<body>") + "\n</body>\n</html>\n";
  return html;
}

if (PREVIEW) {
  fs.writeFileSync(path.join(OUT, "index.html"), render("tr", false));
} else {
  fs.writeFileSync(path.join(OUT, "index.html"), render("tr", false));
  for (const l of ["en", "ru"]) { fs.mkdirSync(path.join(OUT, l), { recursive: true }); fs.writeFileSync(path.join(OUT, l, "index.html"), render(l, true)); }
  fs.copyFileSync(path.join(OUT, "index.html"), path.join(OUT, "404.html"));
  fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
  if (domain) fs.writeFileSync(path.join(OUT, "CNAME"), domain + "\n");
  fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n${ORIGIN ? `Sitemap: ${ORIGIN + BASE}sitemap.xml\n` : ""}`);
  if (ORIGIN) {
    const today = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
      LANGS.map((l) => `<url><loc>${ORIGIN + paths[l]}</loc><lastmod>${today}</lastmod>${LANGS.map((x) => `<xhtml:link rel="alternate" hreflang="${x}" href="${ORIGIN + paths[x]}"/>`).join("")}</url>`).join("\n") + "\n</urlset>\n");
  }
}
const size = (f) => (fs.statSync(f).size / 1024).toFixed(0) + " KB";
console.log(`✓ ${PREVIEW ? "önizleme" : "site"} hazır: ${listings.length} ilan, ${posts.length} yazı → ${path.relative(rel("."), OUT)} (${size(path.join(OUT, "index.html"))})`);
