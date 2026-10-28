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
          <div className="mx-auto flex max-w-5xl items-baseline justify-between px-4 py-4">
            <Link href="/" className="font-serif text-2xl no-underline">OAuth App Field Guide</Link>
            <span className="font-mono text-xs text-muted">for agent builders on Composio</span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
