// Translates new or changed listings and blog posts from Turkish into English and Russian with DeepL.
// Runs in GitHub Actions before each build. Results are saved in content/translations/ so each
// text is translated only once (until its Turkish source changes).
//
//   DEEPL_API_KEY=xxxx node scripts/translate.mjs
//
// Free DeepL keys end with ":fx" and use api-free.deepl.com automatically.
import fs from "node:fs";
import path from "node:path";
import { readListings, readPosts, hash, translationPath, readTranslation } from "./lib.mjs";

const KEY = process.env.DEEPL_API_KEY || "";
if (!KEY) { console.log("DEEPL_API_KEY yok: çeviri atlandı (site Türkçe metinle yayınlanır)."); process.exit(0); }
const HOST = KEY.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
const TARGETS = { en: "EN-GB", ru: "RU", de: "DE", es: "ES", ar: "AR" };

async function deepl(texts, target, html) {
  const body = { text: texts.map((t) => t || " "), source_lang: "TR", target_lang: target, preserve_formatting: true };
  if (html) body.tag_handling = "html";
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(HOST + "/v2/translate", {
      method: "POST",
      headers: { Authorization: "DeepL-Auth-Key " + KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) return (await r.json()).translations.map((x, i) => (texts[i] ? x.text : ""));
    if (r.status === 456) throw new Error("DeepL aylık karakter kotası doldu.");
    if (r.status === 403) throw new Error("DeepL anahtarı geçersiz.");
    if (attempt === 3) throw new Error("DeepL hata " + r.status + ": " + (await r.text()).slice(0, 200));
    await new Promise((res) => setTimeout(res, 1500 * attempt));
  }
}

async function run(kind, items, plain, rich) {
  let n = 0;
  for (const it of items) {
    const src = Object.fromEntries([...plain, ...rich].map((f) => [f, it[f] || ""]));
    const h = hash(src);
    const prev = readTranslation(kind, it.slug);
    const same = prev && prev.hash === h;
    if (same && Object.keys(TARGETS).every((l) => prev[l])) continue;
    const out = same ? prev : { hash: h, source: "tr" };
    for (const [lang, code] of Object.entries(TARGETS)) {
      if (same && prev[lang]) continue;
      const a = await deepl(plain.map((f) => src[f]), code, false);
      const b = rich.length ? await deepl(rich.map((f) => src[f]), code, true) : [];
      out[lang] = Object.fromEntries([...plain.map((f, i) => [f, a[i]]), ...rich.map((f, i) => [f, b[i]])]);
    }
    const file = translationPath(kind, it.slug);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
    console.log(`✓ ${kind}/${it.slug} çevrildi`);
    n++;
  }
  return n;
}

try {
  const a = await run("listings", readListings(), ["title", "summary"], ["description_html"]);
  const b = await run("blog", readPosts(), ["title", "excerpt"], ["body_html"]);
  console.log(`Çeviri tamam: ${a} ilan, ${b} yazı güncellendi.`);
} catch (e) {
  // Never block a publish because of translation: the site falls back to Turkish text.
  console.error("Çeviri yapılamadı:", e.message);
}
