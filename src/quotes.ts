// Straight -> curly quotes for displayed frontmatter text (titles, descriptions).
// A quote is "opening" at the start or after whitespace, an opening bracket or a
// dash; everywhere else it is closing (which also makes apostrophes right).
const OPENER = /[\s(\[{—–/]/;

export function smartQuotes(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== '"' && ch !== "'") {
      out += ch;
      continue;
    }
    const opening = i === 0 || OPENER.test(text[i - 1]);
    if (ch === '"') out += opening ? "“" : "”";
    else out += opening ? "‘" : "’";
  }
  return out;
}
