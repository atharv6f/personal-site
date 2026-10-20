// Structure checks over a built dist/ (run `npm run build` first; skipped when dist/ is absent).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { site, isTodo } from "../src/site.config.ts";

const skip = !existsSync("dist/index.html") && "dist/ not built";
const read = (p: string) => readFileSync(`dist/${p}`, "utf8");
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const postDirs = (): string[] =>
  existsSync("dist/posts")
    ? readdirSync("dist/posts").filter((d) => statSync(join("dist/posts", d)).isDirectory())
    : [];
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const decode = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

test("Home: structure, order, social row, no old sections", { skip }, () => {
  const html = read("index.html");
  const i = (s: string) => html.indexOf(s);
  assert.ok(i("<h1") > 0, "h1");
  assert.ok(i("<h1") < i('class="social"'), "h1 before social");
  assert.ok(i('class="social"') < i('class="prose"'), "social before prose");
  assert.doesNotMatch(html, /class="email"|>atharv@getbrink\.io</, "no written-out address");
  const prose = html.match(/<div class="prose">([\s\S]*?)<\/div>/)![1];
  assert.doesNotMatch(prose, /<h2/);
  const n = (prose.match(/<p[ >]/g) ?? []).length;
  assert.ok(n >= 2 && n <= 3, `prose has ${n} paragraphs`);
  const row = html.match(/class="social"[\s\S]*?<\/ul>/)![0];
  assert.deepEqual(row.match(/aria-label="[^"]+"/g), ['aria-label="X"', 'aria-label="LinkedIn"', 'aria-label="GitHub"', 'aria-label="Email"']);
  assert.match(row, /href="mailto:atharv@getbrink\.io" aria-label="Email"/);
  assert.doesNotMatch(html, /<nav/);
  assert.doesNotMatch(html, /class="skip"/);
  const main = html.indexOf("<main");
  assert.ok(main > 0);
  assert.doesNotMatch(html.slice(0, main), /<header/);
  assert.match(html, /"@type":"Person"/);
  assert.match(html, /"image":"https:\/\/atharv\.getbrink\.io\//);
  assert.doesNotMatch(html, /Updated|All writing|class="featured"|Working on the same problem|Where I am right now/);
  const img = html.match(/<img\b[^>]*>/)![0];
  // Astro serialises an empty alt as a bare `alt` attribute.
  assert.match(img, /\balt(?:=""|(?=[\s>]))/);
});

test("Booking button renders only when site.booking is set", { skip }, () => {
  if (isTodo(site.booking)) {
    for (const f of walk("dist").filter((f) => f.endsWith(".html"))) {
      assert.doesNotMatch(readFileSync(f, "utf8"), /class="button"/, f);
    }
  } else {
    assert.ok(site.booking.startsWith("https://"));
    const re = new RegExp(`href="${escapeRe(site.booking)}"[^>]*>say hi<`, "g");
    assert.equal((read("index.html").match(re) ?? []).length, 1);
  }
});

test("Writing: no /writing/ page; Home lists posts only when there are any", { skip }, () => {
  assert.equal(existsSync("dist/writing"), false);
  const html = read("index.html");
  if (postDirs().length === 0) {
    assert.doesNotMatch(html, /<h2>Writing/);
    assert.match(html, /<p class="meta soon">posts soon\.\. probably<\/p>/);
  } else {
    assert.doesNotMatch(html, /posts soon/);
    assert.match(html, /<h2>Writing<\/h2>/);
    assert.match(html, /class="post-list"/);
    assert.match(html, /href="\/posts\//);
  }
});

test("Posts: header name link, end block, voice fixture", { skip }, () => {
  for (const d of postDirs()) {
    const html = read(`posts/${d}/index.html`);
    assert.match(html, /class="site-name" href="\/"/, d);
    assert.doesNotMatch(html, /<nav/, d);
    const p = html.indexOf('class="prose"');
    const end = html.indexOf('class="post-end"');
    const home = html.indexOf('href="/"', end);
    const social = html.indexOf('class="social"', end);
    assert.ok(p > 0 && p < end && end < home && home < social, `${d}: order prose < post-end < name link < icons`);
    assert.doesNotMatch(html, /class="email"|>atharv@getbrink\.io</, `${d}: no written-out address`);
    const header = html.match(/<header class="post-header">[\s\S]*?<\/header>/)![0];
    const meta = header.match(/<p class="meta">[\s\S]*?<\/p>/)![0];
    assert.doesNotMatch(meta, />Atharv Yeolekar<\/a>/, d);
    if (d === "_kitchen-sink") {
      const want = 'voice fixture: not sure.. we start tomorrow... lets go -- ok "done" it\'s 3-4 hours atleast';
      assert.ok(decode(html).includes(want), "voice fixture kept verbatim");
      const para = decode(html).match(/<p>voice fixture:[\s\S]*?<\/p>/)![0];
      assert.doesNotMatch(para, /…|—/);
    }
  }
});

test("404: heading and link only", { skip }, () => {
  const html = read("404.html");
  assert.match(html, /<h1>Page not found<\/h1>/);
  assert.match(html, /href="\/">Go home<\/a>/);
  const main = html.match(/<main[\s\S]*?<\/main>/)![0];
  assert.equal(main.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(), "Page not found Go home");
  assert.doesNotMatch(html, /\/writing\//);
});

test("Footer: one paragraph, no links; feed still discoverable", { skip }, () => {
  const html = read("index.html");
  const footer = html.match(/<footer[\s\S]*?<\/footer>/)![0];
  assert.equal((footer.match(/<p[ >]/g) ?? []).length, 1);
  assert.match(footer, /Text and data CC BY 4\.0 · Code MIT/);
  assert.doesNotMatch(footer, /rss\.xml|mailto:|github\.com|x\.com|linkedin|<a /);
  assert.match(html, /<link[^>]+rel="alternate"[^>]+rss/);
  assert.ok(existsSync("dist/rss.xml"));
});
