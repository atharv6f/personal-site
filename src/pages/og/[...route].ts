import { OGImageRoute } from "astro-og-canvas";
import { site } from "../../site.config";
import { getPosts } from "../../lib";
import { smartQuotes } from "../../quotes";

const posts = await getPosts();

const pages: Record<string, { title: string; description: string }> = {
  default: { title: site.name, description: site.bio },
};
for (const p of posts) {
  // A headline number, when set, replaces the description on the card.
  pages[p.id] = {
    title: smartQuotes(p.data.title),
    description: smartQuotes(p.data.ogNumber ?? p.data.description),
  };
}

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[251, 250, 247]],
    padding: 80,
    border: { color: [11, 95, 90], width: 16, side: "inline-start" },
    font: {
      title: { color: [29, 28, 26], size: 64, weight: "SemiBold", lineHeight: 1.2, families: ["Source Serif 4"] },
      description: { color: [91, 88, 82], size: 36, lineHeight: 1.3, families: ["Source Serif 4"] },
    },
    fonts: ["./public/fonts/source-serif-4-latin-wght-normal.woff2"],
    cacheDir: false,
  }),
});
