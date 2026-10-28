// Builds library guides from the command line: bun scripts/generate.ts "GitHub" "X" ...
// Library guides are then read and corrected by hand before they are committed.
import { promises as fs } from "fs";
import { runAgent } from "../lib/agent";

for (const app of process.argv.slice(2)) {
  console.log(`\n== ${app}`);
  const guide = await runAgent(app, (e) => e.type === "step" && console.log(" ", e.text));
  await fs.mkdir("data/guides", { recursive: true });
  await fs.writeFile(`data/guides/${guide.slug}.json`, JSON.stringify(guide, null, 2));
  console.log(`  saved data/guides/${guide.slug}.json`);
}
