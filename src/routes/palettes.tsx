import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { deletePalette, loadPalettes, textOn, type Palette } from "@/lib/palettes";

export const Route = createFileRoute("/palettes")({
  head: () => ({
    meta: [
      { title: "Saved Palettes — Chroma Studio" },
      { name: "description", content: "Your saved colour palettes, ready to copy." },
      { property: "og:title", content: "Saved Palettes — Chroma Studio" },
      { property: "og:description", content: "Your saved colour palettes, ready to copy." },
    ],
  }),
  component: Saved,
});

function Saved() {
  const [list, setList] = useState<Palette[]>([]);
  useEffect(() => setList(loadPalettes()), []);

  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-extrabold" style={{ fontFamily: "Fraunces, serif" }}>Saved palettes</h1>
      {list.length === 0 && (
        <p className="text-muted-foreground">Nothing saved yet. Try the <Link to="/" className="text-primary underline">picker</Link> or <Link to="/ai" className="text-primary underline">AI Harmony</Link>.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex h-20">
              {p.colors.map((c, i) => (
                <button key={i} onClick={() => { navigator.clipboard.writeText(c); toast.success(`Copied ${c}`); }} className="flex flex-1 items-end p-1 font-mono text-[10px]" style={{ background: c, color: textOn(c) }}>{c.toUpperCase()}</button>
              ))}
            </div>
            <div className="flex items-center justify-between p-3">
              <div>
                <h2 className="font-bold">{p.name}</h2>
                {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
              </div>
              <button onClick={() => { deletePalette(p.id); setList(loadPalettes()); }} className="text-sm text-destructive hover:underline">Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
