import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Orbit, X } from "lucide-react";
import { useTracelore } from "@/lib/tracelore/store";
import { formatStamp, ms, timeOfDay } from "@/lib/tracelore/engine";
import { TYPE_COLOR, TYPE_LABEL } from "@/lib/tracelore/style";
import { SignalBadge } from "./SignalBadge";
import { Button } from "@/components/ui/button";

export function StoryMode({ constellationId, onClose }: { constellationId: string; onClose: () => void }) {
  const { constellations, index, setOrbitId, select } = useTracelore();
  const [step, setStep] = useState(0);

  const constellation = constellations.find((c) => c.id === constellationId);

  const chapters = useMemo(() => {
    if (!constellation) return [];
    const rs = constellation.receiptIds
      .map((id) => index.byId.get(id))
      .filter(Boolean)
      .sort((a, b) => ms(a!) - ms(b!)) as NonNullable<ReturnType<typeof index.byId.get>>[];
    return rs.map((r, i) => {
      const prev = rs[i - 1];
      const link = prev
        ? index.connections.find(
            (c) => (c.a === prev.id && c.b === r.id) || (c.b === prev.id && c.a === r.id),
          )
        : undefined;
      const gap = prev ? Math.round((ms(r) - ms(prev)) / 60000) : 0;
      return { receipt: r, prev, link, gap };
    });
  }, [constellation, index]);

  if (!constellation || chapters.length === 0) return null;
  const current = chapters[Math.min(step, chapters.length - 1)]!;
  const r = current.receipt;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#05060f]">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-primary">Story mode</p>
            <h2 className="text-lg font-semibold">{constellation.name}</h2>
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X className="size-4" /> Back to galaxy
          </Button>
        </header>

        <div className="mt-4 flex gap-1" aria-hidden>
          {chapters.map((_, i) => (
            <span
              key={i}
              className={`h-0.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <motion.article
          key={r.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-8 flex-1"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Chapter {step + 1} of {chapters.length}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: TYPE_COLOR[r.type], boxShadow: `0 0 16px ${TYPE_COLOR[r.type]}` }}
            />
            <h3 className="text-2xl font-semibold leading-tight">{r.title}</h3>
          </div>

          <section className="mt-6 rounded-xl border border-border bg-card/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#5eead4]">Fact</p>
            <p className="mt-2 text-sm text-foreground">
              A {TYPE_LABEL[r.type]} record was logged at {formatStamp(r.timestamp)} (
              {timeOfDay(r)}) from {r.source}.
              {r.location ? ` Recorded location: ${r.location}.` : ""}
              {r.merchant ? ` Merchant: ${r.merchant}.` : ""}
              {r.artist ? ` Artist: ${r.artist}.` : ""}
              {r.amount != null ? ` Amount: ${r.amount} ${r.currency ?? ""}.` : ""}
            </p>
          </section>

          <section className="mt-3 rounded-xl border border-border bg-card/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#7dd3fc]">Connection</p>
            {current.prev ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Previous star in this constellation: "{current.prev.title}", {current.gap} minutes
                  earlier.
                </p>
                <ul className="mt-2 space-y-1.5">
                  {(current.link?.signals ?? []).map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <SignalBadge kind={s.kind} />
                      <span className="text-xs text-muted-foreground">{s.evidence}</span>
                    </li>
                  ))}
                  {!current.link && (
                    <li className="text-xs text-muted-foreground">
                      No detected pairwise signal between these two records — they were grouped
                      manually into this constellation.
                    </li>
                  )}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                This is the earliest record in the constellation, so there is no preceding star to
                compare it against.
              </p>
            )}
          </section>

          <section className="mt-3 rounded-xl border border-border bg-card/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#c4b5fd]">Possible pattern</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {describePattern(
                index.neighbors.get(r.id)?.length ?? 0,
                index.clusterOf.get(r.id) ?? "isolated",
                timeOfDay(r),
              )}
            </p>
          </section>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                select(r.id);
                setOrbitId(r.id);
                onClose();
              }}
            >
              <Orbit className="size-4" /> Inspect connection
            </Button>
          </div>
        </motion.article>

        <footer className="mt-8 flex items-center justify-between">
          <Button size="sm" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="size-4" /> Previous
          </Button>
          <p className="text-xs text-muted-foreground">
            {step + 1} / {chapters.length}
          </p>
          <Button
            size="sm"
            disabled={step >= chapters.length - 1}
            onClick={() => setStep((s) => s + 1)}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </footer>
      </div>
    </div>
  );
}

function describePattern(degree: number, cluster: string, tod: string) {
  if (degree === 0) {
    return `This record has no detected links. In the loaded data it stands alone within its ${tod} window.`;
  }
  if (cluster === "isolated") {
    return `This record links to ${degree} other record${degree === 1 ? "" : "s"} but does not sit inside a larger detected cluster.`;
  }
  return `This record sits inside ${cluster} with ${degree} direct link${degree === 1 ? "" : "s"}. Repetition of this ${tod} grouping across the dataset is what the engine counts as a pattern — the cause of the grouping is not recorded in the data.`;
}
