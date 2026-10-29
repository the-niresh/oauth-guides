import Link from "next/link";
import { RedirectHome } from "@/components/RedirectHome";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl py-20 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">404</p>
      <h1 className="mt-4 font-serif text-5xl">No guide here</h1>
      <p className="mt-4 text-lg">
        This page does not exist. If you followed a link to a guide, the app may not have a guide yet. You can make
        one from the home page.
      </p>
      <RedirectHome seconds={5} />
      <Link href="/" className="mt-6 inline-block rounded-md bg-ink px-5 py-2.5 text-paper no-underline transition hover:opacity-90">
        Go to the guides now
      </Link>
    </section>
  );
}
