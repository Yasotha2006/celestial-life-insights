# Celestial Life Insights

Implement the complete TRACELORE frontend-only web application now. Use internal planning and do not present another implementation plan for user approval.

# Product Specification: TRACELORE
Tagline: “Every moment is a star. Every connection tells a story.”
Hackathon context: WebRush 6-hour hackathon — Problem: “Your Life, In Receipts”.

Goal: Transform RAW DATA → INSIGHTS → CONNECTIONS → PATTERNS → CONSTELLATIONS → STORIES using a celestial galaxy metaphor (Receipt = Star, Related receipts = Orbit, Activity group = Cluster, Meaningful pattern = Constellation, Connected constellation = Story).

## Architecture & Technology Constraints (Strictly Frontend Only)
- React + Vite + Tailwind CSS + Framer Motion + Lucide React.
- Lightweight HTML5 Canvas / SVG for interactive galaxy rendering, orbit paths, and constellation star maps.
- Strictly frontend-only: No backend, no external API keys, no server/database/Supabase/Firebase runtime calls. All filtering, graph indexing, relationship detection, clustering, and discovery algorithms run client-side in JS/TS.
- Robust Demo Dataset: Pre-populate rich, diverse, realistic digital life receipts spanning Music, Movies & Entertainment, Places, Purchases, Photos, Messages, Searches, Events, and Personal Notes across realistic timestamps (morning, afternoon, evening, late night), categories, merchants, and coordinates/locations. Provide upload/JSON import support for custom datasets conforming to the schema.

## Key Screens & Features

1. Landing / Galaxy Overview:
   - Hero introducing TRACELORE & tagline with compact explainer.
   - Quick action triggers: "Explore Galaxy", "Find a Discovery", "Build a Constellation", "Demo Flow (Judge Walkthrough)".
   - Interactive celestial canvas displaying aggregated star clusters and data nodes without overwhelming DOM overhead.

2. Galaxy Explorer Workspace:
   - Top exploration bar: Search input ("Search the galaxy..."), category/type filters (Music, Purchases, Places, Messages, etc.), date range/time of day filters, connected vs isolated filter, reset filters, and live count of matched stars.
   - Interactive Canvas/SVG space: Pan, zoom, click stars, cluster grouping, restrained NASA/scientific editorial aesthetic (deep navy/near-black background, cyan/violet/pink subtle accents, white crisp typography).
   - Star selection: Hover preview, click to open details panel.

3. Receipt Details Panel:
   - Full record metadata (type, timestamp, title, merchant/artist/location/amount/notes/source).
   - Related signals indicator, direct connection count, cluster identifier.
   - Action buttons: "Trace This Star" (initiates Orbit Mode), "Find Connections", "Add to Constellation".

4. Connect the Dots Engine (Local Deterministic Relationship Detection):
   - Signals: Temporal proximity (e.g. within 15 mins, same hour), same date/window, shared location, repeated merchant/artist/entity, cross-category sequences (e.g. coffee purchase followed by transit followed by music track).
   - Explicit evidence explanations (e.g. "Data signal — same location and same activity window", "Possible connection — two records occurred 11 minutes apart").
   - Categorized tags: DATA SIGNAL, POSSIBLE CONNECTION, TEMPORAL OVERLAP, ACTIVITY CLUSTER.
   - Strictly objective tone: Distinguish facts from data signals and possible patterns; never invent emotion, intent, or ungrounded causation.

5. Orbit Mode:
   - Dedicated focused visualization placing the focal receipt at the core with connected stars arranged in dynamic orbital rings.
   - Animated SVG connection vectors with reason badges.
   - Controls: Inspect relationship reason, swap focal star, add to constellation, exit orbit.

6. Constellation Builder:
   - User-curated or auto-grouped set of connected receipts.
   - Visual constellation viewer drawing vector lines between starred nodes.
   - Metadata: Name, star count, types breakdown, time span, evidence summary.
   - Action: "Turn into Story" & "Export Constellation".

7. Discovery Engine ("Find something you missed"):
   - Automated local scan over loaded data detecting:
     * Burst activity clusters (high-density time windows)
     * Cross-category recurring routines (e.g., late-night music + food order)
     * Repeated entities & favorite merchants/artists
     * Temporal gaps or sudden location hops
   - Cards showing: WHAT WAS FOUND, EVIDENCE, RELATED RECEIPTS, WHY IT MATTERS AS A DATA PATTERN.

8. Digital Life Journey:
   - Non-linear temporal cluster journey showing activity waves, density shifts, anchor moments, and constellation markers.

9. Story Mode:
   - Immersive slide/chapter presentation stepping through the constellation's evidence.
   - Clearly segmented: FACT, CONNECTION, POSSIBLE PATTERN for each step.
   - Navigation: Previous, Next, Inspect Connection, Back to Galaxy.

10. Global Search & Preset Filters:
    - Search across titles, artists, merchants, notes, locations.
    - Quick pills: "Evening activity", "Connected moments", "Recurring patterns", "Dense clusters".

11. Polish, Accessibility & Responsive:
    - Responsive layout (mobile bottom sheets, tablet/desktop split panes).
    - Reduced-motion support, keyboard accessibility, accessible tables/lists as alternative to canvas.
    - Error handling, empty states, and built-in README guide in a modal or drawer explaining architecture, algorithms, and judging criteria.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f6a61971-9dcd-4a51-919d-04c2890cedf9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
