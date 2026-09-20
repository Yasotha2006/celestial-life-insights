import { useMemo, useState } from "react";
import { Download, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useTracelore } from "@/lib/tracelore/store";
import { constellationSummary, formatStamp } from "@/lib/tracelore/engine";
import { TYPE_COLOR, TYPE_LABEL } from "@/lib/tracelore/style";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReceiptType } from "@/lib/tracelore/types";

const W = 420;
const H = 240;

export function ConstellationsPanel({ onOpenStory }: { onOpenStory: (id: string) => void }) {
  const {
    index,
    constellations,
    activeConstellationId,
    setActiveConstellationId,
    createConstellation,
    removeFromConstellation,
    deleteConstellation,
    renameConstellation,
    select,
  } = useTracelore();
  const [name, setName] = useState("");

  const active =
    constellations.find((c) => c.id === activeConstellationId) ?? constellations[0] ?? null;

  const receipts = useMemo(
    () => (active ? active.receiptIds.map((id) => index.byId.get(id)).filter(Boolean) : []),
    [active, index],
  ) as NonNullable<ReturnType<typeof index.byId.get>>[];

  const summary = useMemo(
    () => (receipts.length ? constellationSummary(receipts, index) : null),
    [receipts, index],
  );

  const points = receipts.map((r, i) => {
    const a = (i / Math.max(1, receipts.length)) * Math.PI * 2 - Math.PI / 2;
    const rad = 70 + ((i * 37) % 30);
    return { r, x: W / 2 + Math.cos(a) * rad * 1.5, y: H / 2 + Math.sin(a) * rad * 0.8 };
  });

  const autoBuild = () => {
    const biggest = [...index.clusters].sort((a, b) => b.memberIds.length - a.memberIds.length)[0];
    if (!biggest) return;
    createConstellation(`Auto — ${biggest.id}`, biggest.memberIds);
  };

  const exportActive = () => {
    if (!active) return;
    const payload = {
      constellation: active.name,
      exportedAt: new Date().toISOString(),
      receipts,
      connections: summary?.connections ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold">Constellation builder</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Group connected stars into a named set, then turn it into an evidence-led story.
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New constellation name"
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            onClick={() => {
              createConstellation(name.trim() || `Constellation ${constellations.length + 1}`, []);
              setName("");
            }}
          >
            Create
          </Button>
          <Button size="sm" variant="secondary" onClick={autoBuild} title="Auto-group the densest cluster">
            <Wand2 className="size-4" />
          </Button>
        </div>
        {constellations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {constellations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConstellationId(c.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] ${
                  active?.id === c.id
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.name} · {c.receiptIds.length}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!active && (
          <p className="text-xs text-muted-foreground">
            No constellation yet. Create one, or use auto-group to seed it from the densest detected
            cluster.
          </p>
        )}

        {active && (
          <>
            <Input
              value={active.name}
              onChange={(e) => renameConstellation(active.id, e.target.value)}
              className="h-8 text-xs"
              aria-label="Constellation name"
            />

            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="mt-3 w-full rounded-lg border border-border bg-[#05060f]"
              role="img"
              aria-label="Constellation star map"
            >
              {points.map((p, i) =>
                i > 0 ? (
                  <line
                    key={`l${i}`}
                    x1={points[i - 1]!.x}
                    y1={points[i - 1]!.y}
                    x2={p.x}
                    y2={p.y}
                    stroke="rgba(148,190,255,0.5)"
                    strokeWidth={1}
                  />
                ) : null,
              )}
              {points.map((p) => (
                <circle
                  key={p.r.id}
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill={TYPE_COLOR[p.r.type]}
                  className="cursor-pointer"
                  onClick={() => select(p.r.id)}
                />
              ))}
              {points.length === 0 && (
                <text x={W / 2} y={H / 2} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                  Add stars from the details panel
                </text>
              )}
            </svg>

            {summary && (
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Meta label="Stars" value={String(summary.count)} />
                <Meta label="Internal links" value={String(summary.connections.length)} />
                <Meta
                  label="Time span"
                  value={`${summary.spanHours.toFixed(1)} h`}
                />
                <Meta
                  label="Types"
                  value={summary.types
                    .map(([t, n]) => `${TYPE_LABEL[t as ReceiptType]} ×${n}`)
                    .join(", ")}
                />
                <Meta
                  label="Window"
                  value={
                    summary.first && summary.last
                      ? `${formatStamp(summary.first.timestamp)} → ${formatStamp(summary.last.timestamp)}`
                      : "—"
                  }
                />
                <Meta
                  label="Evidence summary"
                  value={`${summary.connections.reduce((s, c) => s + c.signals.length, 0)} recorded signals across ${summary.connections.length} pairs`}
                />
              </dl>
            )}

            <ul className="mt-3 space-y-1.5">
              {receipts.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded border border-border bg-card/50 px-2 py-1.5"
                >
                  <button className="truncate text-left text-xs hover:text-primary" onClick={() => select(r.id)}>
                    {r.title}
                  </button>
                  <button
                    aria-label={`Remove ${r.title}`}
                    onClick={() => removeFromConstellation(active.id, r.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" disabled={receipts.length === 0} onClick={() => onOpenStory(active.id)}>
                <Sparkles className="size-4" /> Turn into Story
              </Button>
              <Button size="sm" variant="secondary" disabled={receipts.length === 0} onClick={exportActive}>
                <Download className="size-4" /> Export
              </Button>
              <Button size="sm" variant="ghost" onClick={() => deleteConstellation(active.id)}>
                Delete
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-card/50 p-2">
      <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}
