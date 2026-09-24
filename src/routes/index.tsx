import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { hexToHsl, hexToRgb, hslToHex, savePalette, textOn } from "@/lib/palettes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Colour Picker — Chroma Studio" },
      { name: "description", content: "Pick any colour, see HEX, RGB and HSL, and get instant harmonies." },
      { property: "og:title", content: "Colour Picker — Chroma Studio" },
      { property: "og:description", content: "Pick any colour and get instant harmonies." },
    ],
  }),
  component: Picker,
});

function Picker() {
  const [hex, setHex] = useState("#E4572E");
  const [h, s, l] = hexToHsl(hex);

  const harmonies = useMemo(
    () => ({
      Complementary: [hex, hslToHex((h + 180) % 360, s, l)],
      Analogous: [hslToHex((h + 330) % 360, s, l), hex, hslToHex((h + 30) % 360, s, l)],
      Triadic: [hex, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)],
      Shades: [20, 35, 50, 65, 80].map((x) => hslToHex(h, s, x)),
    }),
    [hex, h, s, l],
  );

  const copy = (v: string) => {
    navigator.clipboard.writeText(v);
    toast.success(`Copied ${v}`);
  };

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
      <section className="space-y-4">
        <h1 className="text-5xl font-extrabold leading-none" style={{ fontFamily: "Fraunces, serif" }}>
          Pick a colour.
        </h1>
        <label className="block aspect-square w-full cursor-pointer overflow-hidden rounded-3xl border border-border shadow-lg" style={{ background: hex }}>
          <input type="color" value={hex} onChange={(e) => setHex(e.target.value.toUpperCase())} className="h-full w-full cursor-pointer opacity-0" aria-label="Choose colour" />
        </label>
        <p className="text-sm text-muted-foreground">Tap the swatch to open the picker.</p>
      </section>
      <section className="space-y-6">
        <div className="grid gap-2">
          {[hex, hexToRgb(hex), `hsl(${h}, ${s}%, ${l}%)`].map((v) => (
            <button key={v} onClick={() => copy(v)} className="flex justify-between rounded-xl border border-border bg-card px-4 py-3 text-left font-mono hover:border-primary">
              {v} <span className="text-xs text-muted-foreground">copy</span>
            </button>
          ))}
        </div>
        {Object.entries(harmonies).map(([name, colors]) => (
          <div key={name}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-bold">{name}</h2>
              <button className="text-sm text-primary hover:underline" onClick={() => { savePalette({ name: `${name} of ${hex}`, colors }); toast.success("Palette saved"); }}>
                Save
              </button>
            </div>
            <div className="flex h-16 overflow-hidden rounded-xl">
              {colors.map((c, i) => (
                <button key={i} onClick={() => copy(c.toUpperCase())} className="flex flex-1 items-end p-1 text-[10px] font-mono" style={{ background: c, color: textOn(c) }}>
                  {c.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
