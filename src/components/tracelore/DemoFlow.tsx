import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTracelore } from "@/lib/tracelore/store";

interface Step {
  title: string;
  body: string;
  action?: { label: string; run: () => void };
}

export function DemoFlow({
  onClose,
  setPanel,
}: {
  onClose: () => void;
  setPanel: (p: string) => void;
}) {
  const { index, discoveries, select, setOrbitId, createConstellation, resetFilters } =
    useTracelore();
  const [step, setStep] = useState(0);

  const densest = [...index.clusters].sort((a, b) => b.memberIds.length - a.memberIds.length)[0];
  const anchor = densest?.memberIds[0];

  const steps: Step[] = [
    {
      title: "1 · Raw data",
      body: `${index.byId.size} digital-life receipts are loaded in the browser — music, movies, places, purchases, photos, messages, searches, events and notes. Nothing leaves this page.`,
      action: { label: "Show all stars", run: () => resetFilters() },
    },
    {
      title: "2 · Insights",
      body: `The engine compared every record inside a 180-minute window and kept ${index.connections.length} pairs that cleared the evidence threshold, forming ${index.clusters.length} clusters.`,
      action: { label: "Open a star", run: () => anchor && select(anchor) },
    },
    {
      title: "3 · Connections",
      body: "Orbit Mode places the focal receipt at the core and draws each detected link with the exact reason it was kept.",
      action: { label: "Enter orbit", run: () => anchor && setOrbitId(anchor) },
    },
    {
      title: "4 · Patterns",
      body: `The discovery scan surfaced ${discoveries.length} patterns: burst windows, recurring cross-category routines, repeated entities, silences and location hops.`,
      action: { label: "Open discoveries", run: () => setPanel("discovery") },
    },
    {
      title: "5 · Constellations",
      body: "Any discovery or hand-picked group becomes a constellation with its own star map and evidence summary.",
      action: {
        label: "Build one",
        run: () => {
          const d = discoveries[0];
          if (d) createConstellation(d.title.slice(0, 40), d.receiptIds);
          setPanel("constellations");
        },
      },
    },
    {
      title: "6 · Stories",
      body: "Story Mode walks the constellation chapter by chapter, separating FACT, CONNECTION and POSSIBLE PATTERN so nothing is invented.",
      action: { label: "Go to constellations", run: () => setPanel("constellations") },
    },
  ];

  const s = steps[step]!;

  return (
    <div className="pointer-events-auto fixed bottom-4 left-1/2 z-40 w-[min(560px,92vw)] -translate-x-1/2 rounded-xl border border-primary/40 bg-card/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary">Judge walkthrough</p>
          <h3 className="mt-1 text-sm font-semibold">{s.title}</h3>
        </div>
        <button onClick={onClose} aria-label="Close walkthrough" className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{s.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {s.action && (
          <Button size="sm" onClick={s.action.run}>
            {s.action.label}
          </Button>
        )}
        <Button size="sm" variant="outline" disabled={step === 0} onClick={() => setStep((n) => n - 1)}>
          Back
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => (step === steps.length - 1 ? onClose() : setStep((n) => n + 1))}
        >
          {step === steps.length - 1 ? "Finish" : "Next"}
        </Button>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {step + 1} / {steps.length}
        </span>
      </div>
    </div>
  );
}
