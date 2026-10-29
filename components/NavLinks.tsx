"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/guides", label: "Guides", match: (p: string) => p.startsWith("/guides") },
  { href: "/about", label: "How I built this", match: (p: string) => p.startsWith("/about") },
];

// Marks the page you are on, so the header shows where you are, not only where you can go.
export function NavLinks() {
  const path = usePathname();
  return (
    <>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.match(path) ? "page" : undefined}
          className="inline-flex min-h-11 items-center border-b-2 border-transparent px-2 text-muted no-underline hover:text-ink aria-[current]:border-ink aria-[current]:text-ink"
        >
          {l.label}
        </Link>
      ))}
    </>
  );
}
