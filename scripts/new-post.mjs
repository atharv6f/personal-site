// npm run new "Post title" -> src/content/posts/<slug>/index.md (draft: true)
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const title = process.argv.slice(2).join(" ").trim();
if (!title) {
  console.error('Usage: npm run new "Post title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");
if (!slug) {
  console.error("Could not derive a slug from that title.");
  process.exit(1);
}

const dir = join("src", "content", "posts", slug);
const file = join(dir, "index.md");
if (existsSync(file)) {
  console.error(`${file} already exists.`);
  process.exit(1);
}

const d = new Date();
const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const q = (s) => JSON.stringify(s);

mkdirSync(dir, { recursive: true });
writeFileSync(
  file,
  `---\ntitle: ${q(title)}\ndescription: ""\ndate: ${today}\ndraft: true\n---\n\n`,
);
console.log(`created ${file}`);
