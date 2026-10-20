import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import rehypeMermaid from "rehype-mermaid";
import rehypeTableWrap from "./src/plugins/rehype-table-wrap.mjs";
import rehypeDiagramAlt from "./src/plugins/rehype-diagram-alt.mjs";

const sans = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

// Mermaid "base" theme is the only one that accepts themeVariables (hex only).
// Light and dark sets mirror the CSS tokens in src/styles/tokens.css.
const light = {
  theme: "base",
  fontFamily: sans,
  themeVariables: {
    fontFamily: sans,
    background: "#fbfaf7",
    primaryColor: "#f2f0ea",
    primaryTextColor: "#1d1c1a",
    primaryBorderColor: "#8f8a7e",
    secondaryColor: "#f6f4ee",
    secondaryTextColor: "#1d1c1a",
    secondaryBorderColor: "#8f8a7e",
    tertiaryColor: "#fbfaf7",
    tertiaryTextColor: "#1d1c1a",
    tertiaryBorderColor: "#d9d5cb",
    lineColor: "#5b5852",
    textColor: "#1d1c1a",
    mainBkg: "#f2f0ea",
    nodeBorder: "#8f8a7e",
    clusterBkg: "#f6f4ee",
    clusterBorder: "#d9d5cb",
    edgeLabelBackground: "#fbfaf7",
    titleColor: "#1d1c1a",
  },
};

const dark = {
  theme: "base",
  darkMode: true,
  fontFamily: sans,
  themeVariables: {
    darkMode: true,
    fontFamily: sans,
    background: "#141413",
    primaryColor: "#1d1d1b",
    primaryTextColor: "#e6e3dc",
    primaryBorderColor: "#6b675f",
    secondaryColor: "#191918",
    secondaryTextColor: "#e6e3dc",
    secondaryBorderColor: "#6b675f",
    tertiaryColor: "#141413",
    tertiaryTextColor: "#e6e3dc",
    tertiaryBorderColor: "#34332f",
    lineColor: "#b3afa6",
    textColor: "#e6e3dc",
    mainBkg: "#1d1d1b",
    nodeBorder: "#6b675f",
    clusterBkg: "#191918",
    clusterBorder: "#34332f",
    edgeLabelBackground: "#141413",
    titleColor: "#e6e3dc",
  },
};

export default defineConfig({
  site: "https://atharv.getbrink.io",
  output: "static",
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "always" },
  integrations: [sitemap()],
  image: { layout: "constrained" },
  markdown: {
    // Astro 7 defaults to the Rust-based Satteri processor, which does not run
    // rehype plugins. rehype-mermaid needs the unified pipeline.
    processor: unified({
      smartypants: false,
      rehypePlugins: [
        [rehypeMermaid, { strategy: "img-svg", dark, mermaidConfig: light }],
        rehypeDiagramAlt,
        rehypeTableWrap,
      ],
    }),
    syntaxHighlight: { type: "shiki", excludeLangs: ["mermaid"] },
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    },
  },
});
