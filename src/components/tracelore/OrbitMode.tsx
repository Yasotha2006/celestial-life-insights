import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeftRight, Plus, X } from "lucide-react";
import { useTracelore } from "@/lib/tracelore/store";
import { connectionsFor, formatStamp, otherId } from "@/lib/tracelore/engine";
import { TYPE_COLOR } from "@/lib/tracelore/style";
import { SignalBadge } from "./SignalBadge";
import { Button } from "@/components/ui/button";
import type { Connection } from "@/lib/tracelore/types";

const W = 760;
const H = 520;

export function OrbitMode() {
  const {
    index,
    orbitId,
    setOrbitId,
    select,
    constellations,
    createConstellation,
    addToConstellation,
  } = useTracelore();
  const [inspected, setInspected] = useState<Connection | null>(null);

  const focal = orbitId ? index.byId.get(orbitId) : undefined;
  const links = useMemo(() => (focal ? connectionsFor(index, focal.id) : []), [focal, index]);

  if (!focal) return null;

  const nodes = links.map((c, i) => {
    const ring = Math.floor(i / 6);
    const inRing = links.filter((_, j) => Math.floor(j / 6) === ring).length;
    const idx = i % 6;
    const angle = (idx / Math.max(1, Math.min(inRing, 6))) * Math.PI * 2 + ring * 0.5;
    const radius = 120 + ring * 90;
    return {
      connection: c,
      receipt: index.byId.get(otherId(c, focal.id))!,
      x: W / 2 + Math.cos(angle) * radius,
      y: H / 2 + Math.sin(angle) * radius * 0.78,
      radius,
    };
  });

  const rings = [...new Set(nodes.map((n) => n.radius))];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary">Orbit mode</p>
          <h2 className="text-sm font-semibold">{focal.title}</h2>
          <p className="text-xs text-muted-foreground">
            {formatStamp(focal.timestamp)} · {links.length} connected stars
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const ids = [focal.id, ...nodes.map((n) => n.receipt.id)];
              const existing = constellations[0];
              if (existing) ids.forEach((id) => addToConstellation(existing.id, id));
              else createConstellation(`Orbit of ${focal.title.slice(0, 24)}`, ids);
            }}
          >
            <Plus className="size-4" /> Add orbit to constellation
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOrbitId(null)}>
            <X className="size-4" /> Exit orbit
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1fr_340px]">
        <div className="min-h-[320px] overflow-hidden">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="Orbital map of connected records">
            {rings.map((r) => (
              <ellipse
                key={r}
                cx={W / 2}
                cy={H / 2}
                rx={r}
                ry={r * 0.78}
                fill="none"
                stroke="rgba(148,190,255,0.16)"
                strokeDasharray="3 6"
              />
            ))}
            {nodes.map((n, i) => (
              <g key={n.connection.id}>
                <motion.line
                  x1={W / 2}
                  y1={H / 2}
                  x2={n.x}
                  y2={n.y}
                  stroke={inspected?.id === n.connection.id ? "#7dd3fc" : "rgba(148,190,255,0.35)"}
                  strokeWidth={inspected?.id === n.connection.id ? 2 : 1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.5 }}
                />
                <motion.circle
                  cx={n.x}
                  cy={n.y}
                  r={9}
                  fill={TYPE_COLOR[n.receipt.type]}
                  className="cursor-pointer"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.03 }}
                  onClick={() => setInspected(n.connection)}
                />
                <text
                  x={n.x}
                  y={n.y + 24}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px]"
                >
                  {n.receipt.title.slice(0, 26)}
                </text>
                <text
                  x={(W / 2 + n.x) / 2}
                  y={(H / 2 + n.y) / 2 - 4}
                  textAnchor="middle"
                  className="fill-primary text-[8px] uppercase tracking-wider"
                >
                  {n.connection.signals[0]?.kind}
                </text>
              </g>
            ))}
            <circle cx={W / 2} cy={H / 2} r={26} fill={TYPE_COLOR[focal.type]} opacity={0.25} />
            <circle cx={W / 2} cy={H / 2} r={13} fill={TYPE_COLOR[focal.type]} />
            <text x={W / 2} y={H / 2 + 46} textAnchor="middle" className="fill-foreground text-[11px]">
              {focal.title.slice(0, 34)}
            </text>
          </svg>
        </div>

        <aside className="min-h-0 overflow-y-auto border-t border-border p-4 lg:border-l lg:border-t-0">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Relationship reasons
          </h3>
          {links.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              This star has no detected connections in the current dataset.
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {nodes.map((n) => (
              <li
                key={n.connection.id}
                className={`rounded-lg border p-3 ${
                  inspected?.id === n.connection.id
                    ? "border-primary/60 bg-primary/5"
                    : "border-border bg-card/60"
                }`}
              >
                <p className="text-xs font-medium">{n.receipt.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatStamp(n.receipt.timestamp)} · {n.connection.gapMinutes} min apart
                </p>
                <ul className="mt-2 space-y-1.5">
                  {n.connection.signals.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <SignalBadge kind={s.kind} />
                      <span className="text-[11px] text-muted-foreground">{s.evidence}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setOrbitId(n.receipt.id);
                      setInspected(null);
                    }}
                  >
                    <ArrowLeftRight className="size-3.5" /> Swap focal star
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      select(n.receipt.id);
                      setOrbitId(null);
                    }}
                  >
                    Open details
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
