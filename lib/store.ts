import { promises as fs } from "fs";
import path from "path";
import { put, list } from "@vercel/blob";
import type { Guide, Verification } from "./schema";

// Library guides are checked into the repo (data/guides). Guides made live are saved to
// Vercel Blob when it is connected, otherwise to data/generated on local disk.
const LIBRARY = path.join(process.cwd(), "data/guides");
const GENERATED = path.join(process.cwd(), "data/generated");
const VERIFY = path.join(process.cwd(), "data/verification");
const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

async function readDir(dir: string): Promise<Guide[]> {
  const files = await fs.readdir(dir).catch(() => [] as string[]);
  const guides = await Promise.all(files.filter((f) => f.endsWith(".json")).map((f) => readJson<Guide>(path.join(dir, f))));
  return guides.filter((g): g is Guide => g !== null);
}

export async function libraryGuides(): Promise<Guide[]> {
  return readDir(LIBRARY);
}

export async function generatedGuides(): Promise<Guide[]> {
  if (!blobEnabled()) return readDir(GENERATED);
  const { blobs } = await list({ prefix: "guides/" });
  const guides = await Promise.all(blobs.map(async (b) => (await fetch(b.url, { cache: "no-store" })).json() as Promise<Guide>));
  return guides;
}

const SAFE_SLUG = /^[a-z0-9-]{1,60}$/;

export async function getGuide(slug: string): Promise<{ guide: Guide; inLibrary: boolean } | null> {
  if (!SAFE_SLUG.test(slug)) return null;
  const lib = await readJson<Guide>(path.join(LIBRARY, `${slug}.json`));
  if (lib) return { guide: lib, inLibrary: true };
  const gen = (await generatedGuides()).find((g) => g.slug === slug);
  return gen ? { guide: gen, inLibrary: false } : null;
}

export async function saveGenerated(g: Guide): Promise<void> {
  const body = JSON.stringify(g, null, 2);
  if (blobEnabled()) {
    await put(`guides/${g.slug}.json`, body, { access: "public", contentType: "application/json", allowOverwrite: true, addRandomSuffix: false });
    return;
  }
  await fs.mkdir(GENERATED, { recursive: true });
  await fs.writeFile(path.join(GENERATED, `${g.slug}.json`), body);
}

export async function getVerification(slug: string): Promise<Verification | null> {
  if (!SAFE_SLUG.test(slug)) return null;
  return readJson<Verification>(path.join(VERIFY, `${slug}.json`));
}

// Finds a saved guide for the same Composio toolkit, so "Twitter" opens the X guide.
// Library guides win over live ones.
export async function getGuideByToolkit(composioSlug: string): Promise<{ guide: Guide; inLibrary: boolean } | null> {
  const lib = (await libraryGuides()).find((g) => g.composio.slug === composioSlug);
  if (lib) return { guide: lib, inLibrary: true };
  const gen = (await generatedGuides()).find((g) => g.composio.slug === composioSlug);
  return gen ? { guide: gen, inLibrary: false } : null;
}
