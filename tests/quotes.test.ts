import { test } from "node:test";
import assert from "node:assert/strict";
import { smartQuotes } from "../src/quotes.ts";

test("double quotes become curly", () => {
  assert.equal(smartQuotes('Most agent "done" claims'), "Most agent “done” claims");
});
test("apostrophes and single quotes", () => {
  assert.equal(smartQuotes("You can't tell"), "You can’t tell");
  assert.equal(smartQuotes("He said 'hello' twice"), "He said ‘hello’ twice");
  assert.equal(smartQuotes("agents' claims"), "agents’ claims");
});
test("quote at start and after punctuation or dash", () => {
  assert.equal(smartQuotes('"Done," he said'), "“Done,” he said");
  assert.equal(smartQuotes('(say "hi")'), "(say “hi”)");
  assert.equal(smartQuotes('a—"b"'), "a—“b”");
});
test("already curly is untouched", () => {
  assert.equal(smartQuotes("“done”"), "“done”");
});
