// Home text is plain text: proves it reaches dist/index.html byte-identical (after entity decoding).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { homeParagraphs } from "../src/home-text.ts";

const skip = !existsSync("dist/index.html") && "dist/ not built";
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

test("home.txt paragraphs appear escaped, with <br> for single newlines", { skip }, () => {
  const html = readFileSync("dist/index.html", "utf8");
  for (const lines of homeParagraphs(readFileSync("src/content/home.txt", "utf8"))) {
    const want = "<p>" + lines.map(esc).join("<br>") + "</p>";
    assert.ok(html.includes(want), `missing: ${want}`);
  }
});

test("homeParagraphs keeps punctuation and markdown characters as typed", () => {
  assert.deepEqual(homeParagraphs("a .. b... c -- d *e* _f_ <g> 1. h\n\nsecond"), [
    ["a .. b... c -- d *e* _f_ <g> 1. h"],
    ["second"],
  ]);
});

test("homeParagraphs requires two or three paragraphs", () => {
  assert.throws(() => homeParagraphs("only one"));
  assert.throws(() => homeParagraphs("a\n\nb\n\nc\n\nd"));
  assert.equal(homeParagraphs("a\n\nb\n\nc").length, 3);
});
