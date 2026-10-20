// Wraps every <table> in a keyboard-focusable, horizontally scrolling region
// and gives header cells scope="col".
export default function rehypeTableWrap() {
  return (tree) => {
    const addScope = (node) => {
      if (node.type === "element" && node.tagName === "th") {
        node.properties = { ...node.properties, scope: "col" };
      }
      node.children?.forEach(addScope);
    };
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === "element" && child.tagName === "table") {
          child.children
            .filter((c) => c.type === "element" && c.tagName === "thead")
            .forEach(addScope);
          return {
            type: "element",
            tagName: "div",
            properties: {
              className: ["table-wrap"],
              tabIndex: 0,
              role: "region",
              ariaLabel: "Table, scrolls horizontally on narrow screens",
            },
            children: [child],
          };
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}
