// Post-build checks over dist/: copy rules, no stray scripts, page weight.
// Usage: npm run check            (TODO is a warning locally)
//        npm run check -- --strict (TODO fails; also on when CI=true)
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, relative, extname, dirname, resolve } from "node:path";

const DIST = resolve("dist");
const STRICT = process.env.CI === "true" || process.argv.includes("--strict");
const BUDGET = 100 * 1024;

// Banned copy terms are private, so they are not in this repo. They come from the
// BANNED_TERMS env var (CI secret) or the gitignored banned-terms.txt, one per line.
const LIST = resolve("banned-terms.txt");
const rawTerms = process.env.BANNED_TERMS ?? (existsSync(LIST) ? readFileSync(LIST, "utf8") : "");
const BANNED = rawTerms
  .split(/\r?\n/)
  .map((t) => t.trim().toLowerCase())
  .filter((t) => t && !t.startsWith("#"));
const ALLOW_BRINK = false; // "brink" as a word in page text is an error unless this is true
// "brink" as a word. The lookbehind/lookahead skip getbrink, brink.io and the address.
const brinkRe = /(?<![\p{L}\p{N}_.@\/-])brink(?![\p{L}\p{N}_.])/giu;
const bannedRe = BANNED.map((term) => ({
  term,
  re: new RegExp(
    `(?<![\\p{L}\\p{N}_])${term.replace(/ /g, "\\s+")}(?![\\p{L}\\p{N}_])`,
    "giu",
  ),
}));

if (!existsSync(DIST)) {
  console.error("dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(DIST);
const textFiles = files.filter((f) =>
  [".html", ".xml", ".txt", ".json"].includes(extname(f)),
);
const rel = (f) => relative(DIST, f);
const errors = [];
const warnings = [];
if (BANNED.length === 0) {
  (STRICT ? errors : warnings).push("banned-term list is empty: set BANNED_TERMS or create banned-terms.txt");
}

function snippet(text, index, len) {
  const start = Math.max(0, index - 30);
  return text
    .slice(start, index + len + 30)
    .replace(/\s+/g, " ")
    .trim();
}

for (const file of textFiles) {
  const text = readFileSync(file, "utf8");

  // 1. Banned terms
  for (const { term, re } of bannedRe) {
    for (const m of text.matchAll(re)) {
      errors.push(`${rel(file)}: banned term "${term}": ...${snippet(text, m.index, m[0].length)}...`);
    }
  }

  // 1b. "brink" in text (gated)
  if (!ALLOW_BRINK) {
    for (const m of text.matchAll(brinkRe)) {
      errors.push(`${rel(file)}: "brink" in text: ...${snippet(text, m.index, m[0].length)}...`);
    }
  }

  // 2. TODO (one report per file; first match shown)
  const todos = [...text.matchAll(/\bTODO\b/g)];
  if (todos.length) {
    const msg = `${rel(file)}: ${todos.length}x TODO, first: ...${snippet(text, todos[0].index, 4)}...`;
    (STRICT ? errors : warnings).push(msg);
  }

  // 2b. Rendered diagrams (inline data: images) need meaningful alt text
  if (extname(file) === ".html") {
    for (const m of text.matchAll(/<img\b[^>]*>/gi)) {
      if (!/\bsrc="data:image\//i.test(m[0])) continue;
      const alt = /\balt="([^"]*)"/i.exec(m[0])?.[1];
      if (!alt || !alt.trim()) errors.push(`${rel(file)}: diagram image without alt text`);
    }
  }

  // 3. Scripts
  if (extname(file) === ".html") {
    for (const m of text.matchAll(/<script\b[^>]*>/gi)) {
      if (!/\btype\s*=\s*["']?application\/ld\+json["']?/i.test(m[0])) {
        errors.push(`${rel(file)}: non-JSON-LD script tag: ${m[0]}`);
      }
    }
  }
}

// 3b. Exactly one email icon link on Home and every post page
const EMAIL = 'href="mailto:atharv@getbrink.io" aria-label="Email"';
const postsDir = join(DIST, "posts");
const contactPages = [
  join(DIST, "index.html"),
  ...(existsSync(postsDir)
    ? readdirSync(postsDir).map((d) => join(postsDir, d, "index.html")).filter((f) => existsSync(f))
    : []),
];
for (const file of contactPages) {
  const n = readFileSync(file, "utf8").split(EMAIL).length - 1;
  if (n !== 1) errors.push(`${rel(file)}: expected exactly one ${EMAIL}, found ${n}`);
}

// 3c. Home text length (S1 + S2 + S3 budget)
{
  const html = readFileSync(join(DIST, "index.html"), "utf8");
  const prose = /<div class="prose">([\s\S]*?)<\/div>/.exec(html)?.[1] ?? "";
  const words = prose.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (words > 75) warnings.push(`index.html: home text is ${words} words, budget is 75`);
}

// 4. Weight
const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const pageDir = (file) => dirname(file);
function resolveRef(file, ref) {
  if (/^(https?:)?\/\//.test(ref) || ref.startsWith("data:")) return null;
  const clean = ref.split(/[?#]/)[0];
  const p = clean.startsWith("/") ? join(DIST, clean) : join(pageDir(file), clean);
  return existsSync(p) && statSync(p).isFile() ? p : null;
}

const weights = [];
for (const file of textFiles.filter((f) => extname(f) === ".html")) {
  const html = readFileSync(file, "utf8");
  let total = gz(Buffer.from(html));
  const parts = [`html ${gz(Buffer.from(html))}`];
  const seen = new Set();
  const addFile = (p, label) => {
    if (!p || seen.has(p)) return;
    seen.add(p);
    const size = gz(readFileSync(p));
    total += size;
    parts.push(`${label} ${size}`);
  };

  const cssFiles = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href) continue;
    if (/rel\s*=\s*["']?stylesheet/i.test(tag)) {
      const p = resolveRef(file, href);
      if (p) {
        addFile(p, rel(p));
        cssFiles.push(p);
      }
    } else if (/as\s*=\s*["']?font/i.test(tag)) {
      addFile(resolveRef(file, href), rel(resolveRef(file, href) ?? href));
    }
  }
  // Fonts declared via @font-face in external or inline CSS.
  const cssTexts = [
    ...cssFiles.map((p) => ({ p, text: readFileSync(p, "utf8") })),
    ...[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => ({ p: file, text: m[1] })),
  ];
  for (const { p: base, text } of cssTexts) {
    for (const ff of text.matchAll(/@font-face\s*{[^}]*}/gi)) {
      for (const u of ff[0].matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
        const target = resolveRef(base, u[1]);
        addFile(target, target ? rel(target) : u[1]);
      }
    }
  }

  const hasImages = /<(img|picture)\b/i.test(html);
  weights.push({ page: rel(file), total, parts, hasImages });
  if (total > BUDGET) {
    const msg = `${rel(file)}: ${(total / 1024).toFixed(1)} KB gzip (HTML+CSS+fonts) exceeds ${BUDGET / 1024} KB [${parts.join(", ")}]`;
    (hasImages ? warnings : errors).push(msg + (hasImages ? " (page has images: warning only)" : ""));
  }
}

console.log(`checked ${textFiles.length} text files, ${weights.length} pages`);
for (const w of weights.sort((a, b) => b.total - a.total).slice(0, 5)) {
  console.log(`  ${w.page}: ${(w.total / 1024).toFixed(1)} KB gzip`);
}
for (const w of warnings) console.warn(`WARN  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`FAIL  ${e}`);
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log("check passed" + (warnings.length ? ` with ${warnings.length} warning(s)` : ""));
