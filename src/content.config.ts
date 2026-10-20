import { defineCollection } from "astro:content";
import { glob, type Loader } from "astro/loaders";
import { z } from "astro/zod";

// Drafts show in `astro dev`; production builds exclude them unless
// INCLUDE_DRAFTS=1. Excluding at the loader (not just in getPosts) keeps a
// draft's images and other assets out of dist/ entirely.
const includeDrafts = import.meta.env.DEV || process.env.INCLUDE_DRAFTS === "1";

function withoutDrafts(inner: Loader): Loader {
  if (includeDrafts) return inner;
  return {
    ...inner,
    load: (ctx) => {
      const store = new Proxy(ctx.store, {
        get(target, prop) {
          if (prop === "set") {
            return (entry: { data: { draft?: boolean } }) =>
              entry.data.draft === true ? false : target.set(entry as never);
          }
          const v = Reflect.get(target, prop);
          return typeof v === "function" ? v.bind(target) : v;
        },
      });
      // A persisted store from a drafts build (dev, INCLUDE_DRAFTS=1) may hold
      // draft entries whose digest still matches, so the glob would skip them
      // and they would stay. Drop them first.
      for (const entry of ctx.store.values()) {
        if ((entry.data as { draft?: boolean }).draft === true) ctx.store.delete(entry.id);
      }
      return inner.load({ ...ctx, store });
    },
  };
}

const posts = defineCollection({
  loader: withoutDrafts(
    glob({
      base: "./src/content/posts",
      pattern: "**/index.md",
      // <slug>/index.md -> slug
      generateId: ({ entry }) => entry.split("/")[0],
    }),
  ),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    // Headline number printed on the OG card, e.g. "18.2%".
    ogNumber: z.string().optional(),
  }),
});

export const collections = { posts };
