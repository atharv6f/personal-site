// Copies the Latin Source Serif 4 files from node_modules into public/fonts/.
import { copyFileSync, mkdirSync } from "node:fs";

const files = [
  [
    "node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2",
    "public/fonts/source-serif-4-latin-wght-normal.woff2",
  ],
  [
    "node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-400-italic.woff2",
    "public/fonts/source-serif-4-latin-400-italic.woff2",
  ],
];

mkdirSync("public/fonts", { recursive: true });
for (const [from, to] of files) copyFileSync(from, to);
console.log("fonts copied");
