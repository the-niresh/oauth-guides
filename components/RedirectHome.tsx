"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Counts down, then sends the reader home, so a dead link never leaves them stuck.
export function RedirectHome({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const tick = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    const go = setTimeout(() => router.replace("/"), seconds * 1000);
    return () => { clearInterval(tick); clearTimeout(go); };
  }, [router, seconds]);

  return (
    <p className="mt-6 font-mono text-sm text-muted" role="status" aria-live="polite">
      Taking you to the guides in {left} second{left === 1 ? "" : "s"}.
    </p>
  );
}
