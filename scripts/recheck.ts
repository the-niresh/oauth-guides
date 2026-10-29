// Re-opens every cited page in the library and checks the quotes again, without
// calling the model. Run it on a schedule so a guide shows when its sources change.
import { promises as fs } from "fs";
import { checkSources } from "../lib/check-sources";
import type { Guide } from "../lib/schema";

for (const f of (await fs.readdir("data/guides")).filter((f) => f.endsWith(".json"))) {
  const g = JSON.parse(await fs.readFile(`data/guides/${f}`, "utf8")) as Guide;
  const { checks } = await checkSources(g);
  const q = checks.flatMap((c) => c.quotes);
  console.log(`${g.app}: ${q.filter((x) => x.found).length} of ${q.length} quotes found, ${checks.filter((c) => !c.ok).length} pages failed`);
  await fs.writeFile(`data/guides/${f}`, JSON.stringify({ ...g, sourceChecks: checks }, null, 2));
}
