import { useState } from "react";
import { Orbit, Plus, Radar, X } from "lucide-react";
import { useTracelore } from "@/lib/tracelore/store";
import { connectionsFor, formatStamp, otherId, timeOfDay } from "@/lib/tracelore/engine";
import { TYPE_COLOR, TYPE_LABEL } from "@/lib/tracelore/style";
import { SignalBadge } from "./SignalBadge";
import { Button } from "@/components/ui/button";

export function DetailsPanel() {
  const {
    index,
    selectedId,
    select,
    setOrbitId,
    constellations,
    createConstellation,
    addToConstellation,
  } = useTracelore();
  const [showConnections, setShowConnections] = useState(false);
  const [adding, setAdding] = useState(false);

  if (!selectedId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <Radar className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">No star selected</p>
        <p className="text-xs text-muted-foreground">
          Click a star in the galaxy, or pick a record from the accessible list, to inspect its
          raw data and detected signals.
        </p>
      </div>
    );
  }

  const r = index.byId.get(selectedId);
  if (!r) return null;
  const links = connectionsFor(index, r.id);
  const cluster = index.clusterOf.get(r.id) ?? "isolated";

  const rows: [string, string | undefined][] = [
    ["Type", TYPE_LABEL[r.type]],
    ["Timestamp", `${formatStamp(r.timestamp)} · ${timeOfDay(r)}`],
    ["Artist", r.artist],
    ["Merchant", r.merchant],
    ["Location", r.location],
    [
      "Coordinates",
      r.lat != null && r.lng != null ? `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}` : undefined,
    ],
    ["Amount", r.amount != null ? `${r.amount} ${r.currency ?? ""}`.trim() : undefined],
    ["Notes", r.notes],
    ["Source", r.source],
    ["Record ID", r.id],
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: TYPE_COLOR[r.type], boxShadow: `0 0 10px ${TYPE_COLOR[r.type]}` }}
            />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Receipt details
            </span>
          </div>
          <h2 className="mt-2 text-base font-semibold leading-snug">{r.title}</h2>
        </div>
        <button
          onClick={() => select(null)}
          aria-label="Close details"
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-xs">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="break-words text-foreground">{v}</dd>
              </div>
            ))}
        </dl>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Direct links" value={String(links.length)} />
          <Stat label="Signals" value={String(links.reduce((s, c) => s + c.signals.length, 0))} />
          <Stat label="Cluster" value={cluster === "isolated" ? "Isolated" : cluster.replace("CLUSTER-", "C")} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setOrbitId(r.id)}>
            <Orbit className="size-4" /> Trace This Star
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowConnections((v) => !v)}>
            <Radar className="size-4" /> Find Connections
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
            <Plus className="size-4" /> Add to Constellation
          </Button>
        </div>

        {adding && (
          <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Add this star to:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {constellations.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    addToConstellation(c.id, r.id);
                    setAdding(false);
                  }}
                >
                  {c.name}
                </Button>
              ))}
              <Button
                size="sm"
                onClick={() => {
                  createConstellation(`Constellation ${constellations.length + 1}`, [r.id]);
                  setAdding(false);
                }}
              >
                + New constellation
              </Button>
            </div>
          </div>
        )}

        {showConnections && (
          <div className="mt-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Detected signals ({links.length})
            </h3>
            {links.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                No other record satisfies the detection thresholds. This star is isolated in the
                current dataset.
              </p>
            )}
            <ul className="mt-2 space-y-2">
              {links.map((c) => {
                const other = index.byId.get(otherId(c, r.id))!;
                return (
                  <li key={c.id} className="rounded-lg border border-border bg-card/60 p-3">
                    <button
                      className="text-left text-xs font-medium hover:text-primary"
                      onClick={() => select(other.id)}
                    >
                      {other.title}
                    </button>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatStamp(other.timestamp)} · {c.gapMinutes} min apart · strength{" "}
                      {c.strength}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {c.signals.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <SignalBadge kind={s.kind} />
                          <span className="text-[11px] text-muted-foreground">{s.evidence}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 px-2 py-2">
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
    </div>
  );
}
