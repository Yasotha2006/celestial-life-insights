import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Orbit, RotateCcw, Upload } from "lucide-react";
import { GalaxyCanvas } from "@/components/tracelore/GalaxyCanvas";
import { DetailsPanel } from "@/components/tracelore/DetailsPanel";
import { DiscoveryPanel } from "@/components/tracelore/DiscoveryPanel";
import { ConstellationsPanel } from "@/components/tracelore/ConstellationsPanel";
import { JourneyPanel } from "@/components/tracelore/JourneyPanel";
import { RecordsTable } from "@/components/tracelore/RecordsTable";
import { OrbitMode } from "@/components/tracelore/OrbitMode";
import { StoryMode } from "@/components/tracelore/StoryMode";
import { GuideDrawer } from "@/components/tracelore/GuideDrawer";
import { DemoFlow } from "@/components/tracelore/DemoFlow";
import { useTracelore } from "@/lib/tracelore/store";
import { parseReceiptsJson } from "@/lib/tracelore/engine";
import { TYPE_COLOR, TYPE_LABEL } from "@/lib/tracelore/style";
import { RECEIPT_TYPES, type ReceiptType, type TimeOfDay } from "@/lib/tracelore/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/galaxy")({
  validateSearch: (search: Record<string, unknown>) => ({
    panel: typeof search["panel"] === "string" ? (search["panel"] as string) : "details",
    tour: search["tour"] === true || search["tour"] === "true",
  }),
  head: () => ({
    meta: [
      { title: "Galaxy Explorer — TRACELORE" },
      {
        name: "description",
        content:
          "Search, filter and trace your digital life receipts across an interactive star map with local connection detection, discovery scans and constellation building.",
      },
      { property: "og:title", content: "Galaxy Explorer — TRACELORE" },
      {
        property: "og:description",
        content:
          "Pan and zoom a galaxy of receipts, open orbits of related records, and turn detected patterns into stories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GalaxyWorkspace,
});

const TIMES: TimeOfDay[] = ["morning", "afternoon", "evening", "late night"];

const PRESETS: { label: string; apply: (set: ReturnType<typeof useTracelore>["setFilters"]) => void }[] = [
  {
    label: "Evening activity",
    apply: (set) => set((f) => ({ ...f, timesOfDay: ["evening"] })),
  },
  {
    label: "Connected moments",
    apply: (set) => set((f) => ({ ...f, linkage: "connected" })),
  },
  {
    label: "Recurring patterns",
    apply: (set) => set((f) => ({ ...f, query: "coffee", linkage: "connected" })),
  },
  {
    label: "Dense clusters",
    apply: (set) => set((f) => ({ ...f, linkage: "connected", timesOfDay: ["late night"] })),
  },
];

const PANELS = [
  { id: "details", label: "Details" },
  { id: "discovery", label: "Discovery" },
  { id: "constellations", label: "Constellations" },
  { id: "journey", label: "Journey" },
  { id: "records", label: "Records" },
];

function GalaxyWorkspace() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/galaxy" });
  const {
    receipts,
    visible,
    filters,
    setFilters,
    resetFilters,
    orbitId,
    loadReceipts,
    resetToDemo,
    datasetLabel,
  } = useTracelore();

  const [storyId, setStoryId] = useState<string | null>(null);
  const [tourOpen, setTourOpen] = useState(search.tour);
  const fileRef = useRef<HTMLInputElement>(null);

  const panel = search.panel;
  const setPanel = (p: string) => navigate({ search: (s) => ({ ...s, panel: p }) });

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  const onFile = async (file: File) => {
    const text = await file.text();
    const result = parseReceiptsJson(text);
    if (!result.ok) {
      toast.error("Import failed", { description: result.error });
      return;
    }
    loadReceipts(result.receipts);
    toast.success(`Imported ${result.receipts.length} records`);
  };

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Orbit className="size-5 text-primary" />
          <span className="text-xs font-semibold tracking-[0.3em]">TRACELORE</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {datasetLabel} · {receipts.length} records
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Import JSON
          </Button>
          <Button size="sm" variant="ghost" onClick={resetToDemo}>
            <RotateCcw className="size-4" /> Demo data
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setTourOpen(true)}>
            Demo flow
          </Button>
          <GuideDrawer />
        </div>
      </header>

      {/* exploration bar */}
      <div className="space-y-2 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            placeholder="Search the galaxy..."
            className="h-9 w-full max-w-xs text-xs"
            aria-label="Search the galaxy"
          />
          <select
            value={filters.linkage}
            onChange={(e) =>
              setFilters((f) => ({ ...f, linkage: e.target.value as typeof f.linkage }))
            }
            aria-label="Connection filter"
            className="h-9 rounded-md border border-border bg-card px-2 text-xs"
          >
            <option value="all">All stars</option>
            <option value="connected">Connected only</option>
            <option value="isolated">Isolated only</option>
          </select>
          <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
            From
            <input
              type="date"
              value={filters.from ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))}
              className="h-9 rounded-md border border-border bg-card px-2 text-xs"
            />
          </label>
          <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
            To
            <input
              type="date"
              value={filters.to ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined }))}
              className="h-9 rounded-md border border-border bg-card px-2 text-xs"
            />
          </label>
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Reset filters
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            <strong className="text-foreground">{visible.length}</strong> matched stars
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {RECEIPT_TYPES.map((t) => {
            const on = filters.types.includes(t);
            return (
              <button
                key={t}
                onClick={() => setFilters((f) => ({ ...f, types: toggle(f.types, t as ReceiptType) }))}
                aria-pressed={on}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                  on ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: TYPE_COLOR[t] }} />
                {TYPE_LABEL[t]}
              </button>
            );
          })}
          <span className="mx-1 w-px bg-border" />
          {TIMES.map((t) => {
            const on = filters.timesOfDay.includes(t);
            return (
              <button
                key={t}
                onClick={() => setFilters((f) => ({ ...f, timesOfDay: toggle(f.timesOfDay, t) }))}
                aria-pressed={on}
                className={`rounded-full border px-2.5 py-1 text-[11px] capitalize transition-colors ${
                  on ? "border-accent/60 bg-accent/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            );
          })}
          <span className="mx-1 w-px bg-border" />
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => p.apply(setFilters)}
              className="rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[1fr_400px]">
        <div className="h-[46vh] min-h-[300px] lg:h-[calc(100vh-190px)]">
          <GalaxyCanvas />
        </div>

        <section className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-card/40 lg:h-[calc(100vh-190px)]">
          <div className="flex gap-1 overflow-x-auto border-b border-border p-2">
            {PANELS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPanel(p.id)}
                aria-current={panel === p.id}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                  panel === p.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {panel === "details" && <DetailsPanel />}
            {panel === "discovery" && <DiscoveryPanel />}
            {panel === "constellations" && <ConstellationsPanel onOpenStory={setStoryId} />}
            {panel === "journey" && <JourneyPanel />}
            {panel === "records" && <RecordsTable />}
          </div>
        </section>
      </div>

      {orbitId && <OrbitMode />}
      {storyId && <StoryMode constellationId={storyId} onClose={() => setStoryId(null)} />}
      {tourOpen && <DemoFlow onClose={() => setTourOpen(false)} setPanel={setPanel} />}
    </main>
  );
}
