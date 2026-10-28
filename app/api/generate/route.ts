import { runAgent, type AgentEvent } from "@/lib/agent";
import { saveGenerated } from "@/lib/store";

export const maxDuration = 300;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { app?: unknown; code?: unknown };
  const app = typeof body.app === "string" ? body.app.trim() : "";
  if (!app || app.length > 100) return Response.json({ error: "Give an app name or website, under 100 characters." }, { status: 400 });

  // Every run costs money on the owner's OpenAI key, so a code can be required.
  const need = process.env.ACCESS_CODE;
  if (need && body.code !== need) return Response.json({ error: "Wrong or missing access code." }, { status: 401 });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: AgentEvent | { type: "saved"; slug: string }) => controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      try {
        const guide = await runAgent(app, send);
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
