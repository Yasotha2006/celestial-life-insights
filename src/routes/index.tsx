import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Compass, Orbit, Sparkles, Stars } from "lucide-react";
import { GalaxyCanvas } from "@/components/tracelore/GalaxyCanvas";
import { GuideDrawer } from "@/components/tracelore/GuideDrawer";
import { useTracelore } from "@/lib/tracelore/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRACELORE — Every moment is a star" },
      {
        name: "description",
        content:
          "TRACELORE turns your digital life receipts into a navigable galaxy: stars, orbits, clusters, constellations and evidence-led stories. Entirely in the browser.",
      },
      { property: "og:title", content: "TRACELORE — Every moment is a star" },
      {
        property: "og:description",
        content:
          "Explore your digital life receipts as a celestial map. Local relationship detection, discovery scans and evidence-led stories — no backend.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const ACTIONS = [
  { label: "Explore Galaxy", panel: "details", icon: Stars },
  { label: "Find a Discovery", panel: "discovery", icon: Compass },
  { label: "Build a Constellation", panel: "constellations", icon: Sparkles },
];

function Landing() {
  const { receipts, index, discoveries } = useTracelore();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(80,120,220,0.22),transparent_60%)]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <Orbit className="size-5 text-primary" />
          <span className="text-sm font-semibold tracking-[0.3em]">TRACELORE</span>
        </div>
        <GuideDrawer />
      </header>

      <section className="relative mx-auto grid max-w-6xl gap-8 px-5 pb-16 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-primary">
            WebRush · Your life, in receipts
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] sm:text-6xl">
            Every moment is a star.
            <span className="block text-muted-foreground">Every connection tells a story.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            TRACELORE reads the receipts your digital life already leaves behind — tracks played,
            places checked into, things bought, photos taken, searches made — and renders them as a
            galaxy. A local detection engine finds the pairs, clusters and recurring routines
            between them, states the evidence for each, and lets you assemble constellations you can
            walk through as a story. Everything runs in this browser tab.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {ACTIONS.map(({ label, panel, icon: Icon }) => (
              <Button key={label} asChild>
                <Link to="/galaxy" search={{ panel, tour: false }}>
                  <Icon className="size-4" /> {label}
                </Link>
              </Button>
            ))}
            <Button variant="outline" asChild>
              <Link to="/galaxy" search={{ panel: "details", tour: true }}>
                Demo Flow (Judge Walkthrough)
              </Link>
            </Button>
          </div>

          <dl className="mt-8 grid max-w-md grid-cols-3 gap-3">
            {[
              ["Stars", receipts.length],
              ["Detected links", index.connections.length],
              ["Patterns found", discoveries.length],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-border bg-card/50 p-3">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-1 text-xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-7 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
            {[
              "Receipt = Star",
              "Related receipts = Orbit",
              "Activity group = Cluster",
              "Meaningful pattern = Constellation",
              "Connected constellation = Story",
            ].map((x) => (
              <li key={x} className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-primary" />
                {x}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="h-[380px] lg:h-[540px]"
        >
          <GalaxyCanvas compact />
        </motion.div>
      </section>
    </main>
  );
}
