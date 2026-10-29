import Link from "next/link";
import type { Guide } from "@/lib/schema";

// One shared time axis on a log scale, so "30 minutes" and "6 weeks" fit on the same line.
const TICKS = [
  { label: "15 min", min: 15 },
  { label: "1 hour", min: 60 },
  { label: "1 day", min: 1440 },
  { label: "1 week", min: 10080 },
  { label: "10 weeks", min: 100800 },
];
const LO = Math.log(10);
const HI = Math.log(130000);
const pos = (min: number) => Math.max(0, Math.min(100, ((Math.log(Math.max(min, 10)) - LO) / (HI - LO)) * 100));

const COLOR: Record<string, string> = {
  easy: "var(--easy)",
  medium: "var(--medium)",
  hard: "var(--hard)",
  blocked: "var(--blocked)",
};

function waitLabel(days: number | null) {
  if (days === null) return "wait unknown";
  if (days === 0) return "same day";
  if (days < 14) return `about ${days} days`;
  return `about ${Math.round(days / 7)} weeks`;
}

export function TimeChart({ guides }: { guides: Guide[] }) {
  return (
    <div>
      <div className="relative ml-0 h-5 sm:mr-56 sm:ml-40">
        {TICKS.map((t) => (
          <span key={t.label} className="absolute -translate-x-1/2 font-mono text-[10px] text-muted" style={{ left: `${pos(t.min)}%` }}>
            {t.label}
          </span>
        ))}
      </div>
      <ul className="mt-1">
        {guides.map((g) => {
          const tl = g.timeline;
          const setup = tl?.setupMinutes ?? null;
          const wait = tl?.waitDays ?? null;
          const end = setup !== null && wait !== null ? setup + wait * 1440 : null;
          const color = COLOR[g.difficulty] ?? "var(--unsure)";
          return (
            <li key={g.slug} className="group border-t border-line first:border-t-0">
              <Link href={`/guides/${g.slug}`} className="grid gap-1 py-3 no-underline sm:grid-cols-[10rem_minmax(0,1fr)_14rem] sm:items-center">
                <span className="flex items-baseline gap-2">
                  <span className="font-medium group-hover:underline">{g.app}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color }}>{g.difficulty}</span>
                </span>
                <span className="relative block h-7" aria-label={`${g.app}: first test login in ${setup ?? "unknown"} minutes, real users ${waitLabel(wait)}`}>
                  {TICKS.map((t) => (
                    <span key={t.label} className="absolute inset-y-0 w-px bg-line" style={{ left: `${pos(t.min)}%` }} />
                  ))}
                  {tl?.optionalPath && setup !== null && (
                    <span
                      className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full border border-dashed border-muted/60"
                      style={{ left: 0, width: `${pos(setup + tl.optionalPath.days * 1440)}%` }}
                      title={`${tl.optionalPath.label}: about ${Math.round(tl.optionalPath.days / 7)} weeks`}
                    />
                  )}
                  {setup !== null && (
                    <span className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-ink" style={{ left: 0, width: `${pos(setup)}%` }} />
                  )}
                  {end !== null && end > setup! && (
                    <span className="absolute top-1/2 h-3 -translate-y-1/2 rounded-r-full opacity-80" style={{ left: `${pos(setup!)}%`, width: `${pos(end) - pos(setup!)}%`, background: color }} />
                  )}
                  {end !== null && (
                    <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card" style={{ left: `${pos(end)}%`, background: color }} />
                  )}
                </span>
                <span className="font-mono text-[11px] text-muted sm:pl-4">
                  <span className="text-ink">{end === null ? "real users: wait unknown" : `real users: ${waitLabel(wait)}`}</span>
                  {tl?.optionalPath ? <span className="block">{tl.optionalPath.label.toLowerCase()}: about {Math.round(tl.optionalPath.days / 7)} weeks</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-muted">
        <span><span className="mr-1.5 inline-block h-2 w-5 rounded-full bg-ink align-middle" />setup to first test login</span>
        <span><span className="mr-1.5 inline-block h-2 w-5 rounded-full bg-[var(--hard)] align-middle opacity-80" />waiting before real users can connect</span>
        <span><span className="mr-1.5 inline-block h-2 w-5 rounded-full border border-dashed border-muted align-middle" />optional longer path</span>
        <span>Times are estimates from each guide. Open a guide for the evidence.</span>
      </p>
    </div>
  );
}
