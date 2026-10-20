import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"posts">;

// Drafts show in `astro dev`; production builds exclude them unless
// INCLUDE_DRAFTS=1 (used to check the fixture post).
const includeDrafts = import.meta.env.DEV || process.env.INCLUDE_DRAFTS === "1";

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("posts", ({ data }) => includeDrafts || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export const longDate = (d: Date) =>
  d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
