import type { ReactNode } from "react";

// Minimal inline Markdown: **bold** and `code`. Keeps the app dependency-free.
export function Markdown({ text }: { text: string }) {
  return <>{render(text)}</>;
}

function render(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Split on **bold** or `code`, keeping the delimiters via capture groups.
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = text.split(regex);
  parts.forEach((part, i) => {
    if (!part) return;
    if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(<strong key={i}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push(<code key={i}>{part.slice(1, -1)}</code>);
    } else {
      nodes.push(part);
    }
  });
  return nodes;
}
