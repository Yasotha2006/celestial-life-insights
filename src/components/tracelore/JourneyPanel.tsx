import { useMemo } from "react";
import { useTracelore } from "@/lib/tracelore/store";
import { dayKey, ms, timeOfDay } from "@/lib/tracelore/engine";
import { TYPE_COLOR } from "@/lib/tracelore/style";

export function JourneyPanel() {
  const { receipts, index, constellations, select } = useTracelore();

  const days = useMemo(() => {
    const map = new Map<string, typeof receipts>();
    for (const r of [...receipts].sort((a, b) => ms(a) - ms(b))) {
      map.set(dayKey(r), [...(map.get(dayKey(r)) ?? []), r]);
    }
    return [...map.entries()];
  }, [receipts]);

  const max = Math.max(1, ...days.map(([, rs]) => rs.length));
  const constellationIds = new Set(constellations.flatMap((c) => c.receiptIds));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold">Digital life journey</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Non-linear view of activity waves: bar height is record density, dots are individual
          stars, rings mark stars already inside a constellation.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <ul className="space-y-3">
          {days.map(([key, rs]) => {
            const anchors = rs.filter((r) => (index.neighbors.get(r.id)?.length ?? 0) >= 4);
            return (
              <li key={key} className="rounded-lg border border-border bg-card/50 p-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-medium">
                    {new Date(key).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {rs.length} records · {anchors.length} anchor moments
                  </p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${(rs.length / max) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {rs.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => select(r.id)}
                      title={`${r.title} · ${timeOfDay(r)}`}
                      aria-label={`${r.title} at ${timeOfDay(r)}`}
                      className="size-3 rounded-full ring-offset-2 ring-offset-card focus-visible:outline-2 focus-visible:outline-ring"
                      style={{
                        backgroundColor: TYPE_COLOR[r.type],
                        boxShadow: constellationIds.has(r.id) ? "0 0 0 2px #ffffff88" : undefined,
                      }}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
