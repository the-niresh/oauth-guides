import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { NavLinks } from "@/components/NavLinks";

const REPO = "https://github.com/the-niresh/oauth-guides";
const LINKEDIN = "https://www.linkedin.com/in/the-niresh/";

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
      <body className="flex min-h-screen flex-col font-sans">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 py-1.5">
            <Link href="/" className="font-serif text-xl no-underline sm:text-2xl">OAuth App Field Guide</Link>
            <nav className="-mx-2 flex font-mono text-sm" aria-label="Main">
              <NavLinks />
              <a href={REPO} className="inline-flex min-h-11 items-center px-2 text-muted no-underline hover:text-ink">Source</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
        <footer className="mt-16 border-t border-line bg-card">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div>
              <Link href="/" className="font-serif text-2xl no-underline">OAuth App Field Guide</Link>
              <p className="mt-3 max-w-xl text-sm text-muted">
                Built by{" "}
                <a href={LINKEDIN} target="_blank" rel="noreferrer" className="font-medium text-ink underline">Niresh</a>{" "}
                for the Composio APM Integrations take-home. Guides are researched by an agent and checked by code;
                library guides are also read and corrected by a person.
              </p>
            </div>
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div>
                <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">This site</h2>
                <ul>
                  <li><Link href="/guides" className="inline-flex min-h-9 items-center no-underline hover:underline">All guides</Link></li>
                  <li><Link href="/#research" className="inline-flex min-h-9 items-center no-underline hover:underline">Look up an app</Link></li>
                  <li><Link href="/about" className="inline-flex min-h-9 items-center no-underline hover:underline">How I built this</Link></li>
                </ul>
              </div>
              <div>
                <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">Elsewhere</h2>
                <ul>
                  <li><a href={REPO} className="inline-flex min-h-9 items-center no-underline hover:underline">Source on GitHub</a></li>
                  <li><a href={`${REPO}/blob/main/CHECKS.md`} className="inline-flex min-h-9 items-center no-underline hover:underline">Check notes</a></li>
                  <li><a href={LINKEDIN} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center no-underline hover:underline">Niresh on LinkedIn</a></li>
                </ul>
              </div>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
