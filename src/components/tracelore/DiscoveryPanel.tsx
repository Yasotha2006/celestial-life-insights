import { Compass } from "lucide-react";
import { useTracelore } from "@/lib/tracelore/store";
import { SignalBadge } from "./SignalBadge";
import { Button } from "@/components/ui/button";
import { formatStamp } from "@/lib/tracelore/engine";

export function DiscoveryPanel() {
  const { discoveries, index, select, createConstellation } = useTracelore();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Compass className="size-4 text-primary" /> Discovery engine
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          A local scan across the loaded records. Every card states what was found, the countable
          evidence behind it, and why it matters as a data pattern — no inferred intent.
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {discoveries.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No patterns cleared the detection thresholds for this dataset.
          </p>
        )}
        {discoveries.map((d) => (
          <article key={d.id} className="rounded-lg border border-border bg-card/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xs font-semibold leading-snug">{d.title}</h3>
              <SignalBadge kind={d.tag} />
            </div>

            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Evidence
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-muted-foreground">
              {d.evidence.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>

            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Related receipts ({d.receiptIds.length})
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {d.receiptIds.slice(0, 8).map((id) => {
                const r = index.byId.get(id);
                if (!r) return null;
                return (
                  <button
                    key={id}
                    onClick={() => select(id)}
                    className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                    title={formatStamp(r.timestamp)}
                  >
                    {r.title.slice(0, 22)}
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Why it matters as a data pattern
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{d.why}</p>

            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => createConstellation(d.title.slice(0, 40), d.receiptIds)}
            >
              Build constellation from this
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
