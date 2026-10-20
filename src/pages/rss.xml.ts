import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { site } from "../site.config";
import { getPosts } from "../lib";
import { smartQuotes } from "../quotes";

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: site.name,
    description: site.bio,
    site: context.site!,
    items: posts.map((p) => ({
      title: smartQuotes(p.data.title),
      description: smartQuotes(p.data.description),
      pubDate: p.data.date,
      link: `/posts/${p.id}/`,
    })),
  });
}
