import type { Guide, Verification } from "./schema";
import { counts } from "./evidence";

// The numbers this work would be run on: how many guides exist (supply), how sure they are
// (health), and what each new one costs. Computed from the guide files, never typed in.
export function libraryStats(lib: Guide[], live: Guide[], verifications: (Verification | null)[]) {
  // Health is about the library, which a person has read. Live guides only count as supply and cost.
  const all = lib.map(counts);
  const sum = (k: "checked" | "source-only" | "unsure") => all.reduce((n, c) => n + c[k], 0);
  const claims = sum("checked") + sum("source-only") + sum("unsure");
  const runs = [...lib, ...live].map((g) => g.usage).filter((u) => u !== undefined);
  const avg = (f: (u: NonNullable<Guide["usage"]>) => number) =>
    runs.length ? Math.round(runs.reduce((n, u) => n + f(u), 0) / runs.length) : null;
  return {
    library: lib.length,
    live: live.length,
    claims,
    checked: sum("checked"),
    sourceOnly: sum("source-only"),
    unsure: sum("unsure"),
    checkedShare: claims ? Math.round((sum("checked") / claims) * 100) : 0,
    corrections: verifications.reduce((n, v) => n + (v?.corrections.length ?? 0), 0),
    tested: verifications.reduce((n, v) => n + (v?.tested.length ?? 0), 0),
    measuredRuns: runs.length,
    avgSearches: avg((u) => u.searchCalls),
    avgSeconds: avg((u) => u.seconds),
    avgInputTokens: avg((u) => u.inputTokens),
  };
}

export type LibraryStats = ReturnType<typeof libraryStats>;
