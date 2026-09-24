import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { generateHarmony, type HarmonyResult } from "@/lib/ai-harmony.functions";
import { savePalette, textOn } from "@/lib/palettes";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "AI Harmony Generator — Chroma Studio" },
      { name: "description", content: "Describe a colour, palette or design brief and let AI create harmonious colour combinations." },
      { property: "og:title", content: "AI Harmony Generator — Chroma Studio" },
      { property: "og:description", content: "AI-generated harmonious colour palettes from any brief." },
    ],
  }),
  component: AiPage,
});

const EXAMPLES = ["#2A9D8F", "Calm wellness app, earthy and soft", "Retro 80s arcade poster", "#264653, #E9C46A — extend this"];

function AiPage() {
  const run = useServerFn(generateHarmony);
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HarmonyResult | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!brief.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await run({ data: { brief } });
      if (res.ok) setResult(res.result);
      else setError(res.error);
    } catch {
      setError("Couldn't reach the AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-extrabold leading-none" style={{ fontFamily: "Fraunces, serif" }}>AI Harmony</h1>
        <p className="mt-2 text-muted-foreground">Give a colour, a palette, or describe a mood — get three harmonious palettes.</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3} maxLength={1000} placeholder="e.g. #E4572E or 'a cozy coffee shop brand'" className="w-full rounded-2xl border border-input bg-card p-4 outline-none focus:ring-2 focus:ring-ring" />
        <div className="flex flex-wrap items-center gap-2">
          {EXAMPLES.map((x) => (
            <button type="button" key={x} onClick={() => setBrief(x)} className="rounded-full bg-secondary px-3 py-1 text-xs hover:bg-accent">{x}</button>
          ))}
          <button disabled={loading || !brief.trim()} className="ml-auto rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground disabled:opacity-50">
            {loading ? "Mixing colours…" : "Generate"}
          </button>
        </div>
      </form>
      {error && <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</p>}
      {loading && <div className="h-40 animate-pulse rounded-2xl bg-muted" />}
      {result && !loading && (
        <div className="grid gap-6">
          {result.palettes.map((p, i) => (
            <article key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex h-28">
                {p.colors.map((c, j) => (
                  <button key={j} onClick={() => { navigator.clipboard.writeText(c.hex); toast.success(`Copied ${c.hex}`); }} className="flex flex-1 flex-col justify-end p-2 text-left text-xs" style={{ background: c.hex, color: textOn(c.hex) }}>
                    <span className="font-mono font-bold">{c.hex.toUpperCase()}</span>
                    <span className="opacity-80">{c.role}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-start justify-between gap-4 p-4">
                <div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: "Fraunces, serif" }}>{p.name}</h2>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
                <button onClick={() => { savePalette({ name: p.name, colors: p.colors.map((c) => c.hex), note: p.description }); toast.success("Palette saved"); }} className="shrink-0 rounded-full border border-border px-4 py-1.5 text-sm hover:border-primary">Save</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
