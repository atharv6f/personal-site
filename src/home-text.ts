// Home text: plain paragraphs, never markdown. Blank line = new paragraph; a
// single newline inside a paragraph is a line break. 2 or 3 paragraphs (S3 optional).
// Kept apart from lib.ts so tests can import it without astro:content.
export function homeParagraphs(raw: string): string[][] {
  const paras = raw
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n[ \t]*\n+/)
    .map((p) => p.split("\n").map((l) => l.trim()));
  if (paras.length < 2 || paras.length > 3) throw new Error(`home.txt must have 2 or 3 paragraphs, found ${paras.length}`);
  return paras;
}
