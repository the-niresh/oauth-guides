import { runAgent, type AgentEvent } from "@/lib/agent";
import { identifyApp } from "@/lib/identify";
import { getGuide, getGuideByToolkit, saveGenerated } from "@/lib/store";
import { slugify } from "@/lib/schema";

export const maxDuration = 300;

type Event = AgentEvent | { type: "saved"; slug: string } | { type: "rejected"; message: string };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { app?: unknown; code?: unknown; fresh?: unknown };
  const app = typeof body.app === "string" ? body.app.trim() : "";
  if (!app || app.length > 100) return Response.json({ error: "Give an app name or website, under 100 characters." }, { status: 400 });

  // A guide that already exists is shown again instead of paying for a new run.
  // Library guides are never replaced; a fresh run is only offered for live-made guides.
  const existing = await getGuide(slugify(app));
  if (existing && (existing.inLibrary || body.fresh !== true)) {
    return Response.json({ existing: existing.guide.slug, inLibrary: existing.inLibrary });
  }

  // Every run costs money on the owner's OpenAI key, so a code can be required.
  const need = process.env.ACCESS_CODE;
  if (need && body.code !== need) return Response.json({ error: "Wrong or missing access code." }, { status: 401 });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: Event) => controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      try {
        send({ type: "step", text: `Checking that "${app}" is a real app with OAuth` });
        const id = await identifyApp(app);
        if (!id.ok) {
          send({ type: "rejected", message: id.message });
          return;
        }
        send({ type: "step", text: id.source === "composio" ? `Found ${id.name} in Composio's toolkit list` : `Found ${id.name}, and it offers OAuth` });

        // "zoom.us" and "Zoom", or "Twitter" and "X", are the same app: reuse the saved guide.
        const known = (id.composioSlug ? await getGuideByToolkit(id.composioSlug) : null) ?? (await getGuide(slugify(id.name)));
        if (known && (known.inLibrary || body.fresh !== true)) {
          send({ type: "saved", slug: known.guide.slug });
          return;
        }
        send({ type: "step", text: "Starting the research. This takes one to three minutes" });
        const guide = await runAgent(id.name, send);
        await saveGenerated(guide);
        send({ type: "saved", slug: guide.slug });
      } catch (err) {
        console.error("generate failed", err);
        send({ type: "error", message: "The agent failed. Try again, or try the app's website instead of its name." });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" } });
}
