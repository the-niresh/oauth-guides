"use client";

import { useEffect, useState } from "react";

// Highlights the section being read: the last one whose top has passed a line 140px down.
export function Toc({ items }: { items: [string, string][] }) {
  const [active, setActive] = useState(items[0]?.[0]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) return setActive(items[items.length - 1][0]);
      let current = items[0][0];
      for (const [id] of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      }
      setActive(current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, [items]);

  return (
    <ol className="sticky top-8 space-y-0.5 font-mono text-xs">
      {items.map(([id, label], i) => (
        <li key={id}>
          <a
            href={`#${id}`}
            aria-current={active === id ? "location" : undefined}
            className="block border-l-2 border-transparent py-1 pl-3 text-muted no-underline hover:text-ink aria-[current]:border-ink aria-[current]:bg-card aria-[current]:font-medium aria-[current]:text-ink"
          >
            {String(i + 1).padStart(2, "0")} {label}
          </a>
        </li>
      ))}
    </ol>
  );
}
