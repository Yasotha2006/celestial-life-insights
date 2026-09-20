import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function GuideDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          <BookOpen className="size-4" /> Guide
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>TRACELORE — built-in guide</SheetTitle>
          <SheetDescription>
            Every moment is a star. Every connection tells a story.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-8 text-sm text-muted-foreground">
          <Section title="The metaphor">
            <ul className="list-disc space-y-1 pl-4">
              <li>Receipt = Star</li>
              <li>Related receipts = Orbit</li>
              <li>Activity group = Cluster</li>
              <li>Meaningful pattern = Constellation</li>
              <li>Connected constellation = Story</li>
            </ul>
          </Section>

          <Section title="Architecture">
            <p>
              React + Vite + Tailwind + Motion + Lucide. The galaxy is a single HTML5 canvas;
              orbits and constellations are SVG. There is no backend, no API key and no network
              call — dataset, graph index, detection and discovery all run in the browser.
            </p>
          </Section>

          <Section title="Algorithms">
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong className="text-foreground">Pairwise detection:</strong> records sorted by
                time, compared inside a 180-minute window. Signals score temporal proximity (≤15
                min, ≤60 min), shared location or coordinates within 300 m, repeated
                merchant/artist entities, and cross-category sequences under 45 minutes. A pair is
                kept when the summed weight reaches 2.5.
              </li>
              <li>
                <strong className="text-foreground">Clustering:</strong> connected components over
                the kept pairs; single nodes are marked isolated.
              </li>
              <li>
                <strong className="text-foreground">Discovery:</strong> sliding 90-minute density
                windows for bursts, repeated cross-category sequence counting for routines, entity
                frequency counts, largest temporal gap, and fastest coordinate hop.
              </li>
            </ul>
          </Section>

          <Section title="Evidence discipline">
            <p>
              Cards are tagged DATA SIGNAL, POSSIBLE CONNECTION, TEMPORAL OVERLAP or ACTIVITY
              CLUSTER. The copy states what was recorded and what was counted. It never asserts
              emotion, intent or causation that the data does not contain.
            </p>
          </Section>

          <Section title="Importing your own data">
            <p>
              Use Import JSON in the workspace. Provide an array (or an object with a{" "}
              <code>receipts</code> array) where each item has <code>type</code>,{" "}
              <code>title</code> and an ISO <code>timestamp</code>. Optional:{" "}
              <code>merchant</code>, <code>artist</code>, <code>location</code>, <code>lat</code>,{" "}
              <code>lng</code>, <code>amount</code>, <code>currency</code>, <code>notes</code>,{" "}
              <code>source</code>.
            </p>
          </Section>

          <Section title="Judging walkthrough">
            <ol className="list-decimal space-y-1 pl-4">
              <li>Landing → Demo Flow starts the guided tour.</li>
              <li>Galaxy Explorer → filter, search, click a star.</li>
              <li>Details → Trace This Star opens Orbit Mode with reason badges.</li>
              <li>Discovery → a found pattern becomes a constellation.</li>
              <li>Constellation → Turn into Story for the fact/connection/pattern chapters.</li>
            </ol>
          </Section>

          <Section title="Accessibility">
            <p>
              The canvas has a keyboard-navigable list equivalent in the Records tab. Motion
              respects prefers-reduced-motion. All controls are reachable by keyboard with visible
              focus rings.
            </p>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}
