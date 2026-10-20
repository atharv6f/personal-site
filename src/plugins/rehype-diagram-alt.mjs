// Runs after rehype-mermaid. That plugin sets alt to the diagram's accDescr (or
// "") and title to its accTitle. Make alt always meaningful:
//   accTitle + accDescr -> "<title>. <description>"
//   accDescr only       -> description
//   accTitle only       -> title
//   neither             -> "Diagram"
// The title attribute is dropped so the text is not read or shown twice.
export default function rehypeDiagramAlt() {
  return (tree) => {
    const walk = (node) => {
      if (
        node.type === "element" &&
        node.tagName === "img" &&
        typeof node.properties?.src === "string" &&
        node.properties.src.startsWith("data:image/")
      ) {
        const title = String(node.properties.title ?? "").trim();
        const description = String(node.properties.alt ?? "").trim();
        node.properties.alt = [title, description].filter(Boolean).join(". ") || "Diagram";
        delete node.properties.title;
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
