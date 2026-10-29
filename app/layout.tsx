import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "OAuth App Field Guide",
  description: "How long it takes to get an OAuth app set up and approved, app by app, with the evidence.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable} antialiased`}>
      <body className="min-h-screen font-sans">
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-2 px-4 py-4">
            <Link href="/" className="font-serif text-2xl no-underline">OAuth App Field Guide</Link>
            <nav className="flex gap-4 font-mono text-xs" aria-label="Main">
              <Link href="/" className="text-muted no-underline hover:text-ink">Guides</Link>
              <Link href="/about" className="text-muted no-underline hover:text-ink">How I built this</Link>
              <a href="https://github.com/the-niresh/oauth-guides" className="text-muted no-underline hover:text-ink">Source</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
        <footer className="mx-auto max-w-6xl border-t border-line px-4 py-6 font-mono text-[11px] text-muted">
          Built by Niresh for the Composio APM Integrations take-home. Guides are researched by an agent and checked by code; library guides are also read by a person.
        </footer>
      </body>
    </html>
  );
}
