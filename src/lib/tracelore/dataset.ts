import type { Receipt, ReceiptType } from "./types";

/**
 * Deterministic demo dataset generator (frontend only, no network).
 * Builds a realistic 21-day digital-life receipt trail with recurring
 * routines, burst windows, repeated entities and location hops so the
 * local detection engine has real structure to find.
 */

let seed = 20260920;
function rnd() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)]!;
}

const PLACES = [
  { name: "Brew & Bloom Coffee", lat: 12.9716, lng: 77.5946 },
  { name: "Metro Line 2 — Indiranagar", lat: 12.9784, lng: 77.6408 },
  { name: "Kandala Co-working Loft", lat: 12.9611, lng: 77.6387 },
  { name: "Cubbon Park", lat: 12.9763, lng: 77.5929 },
  { name: "Lightspeed Gym", lat: 12.9352, lng: 77.6245 },
  { name: "Ursa Cinema Hall", lat: 12.9279, lng: 77.6271 },
  { name: "Home — Koramangala", lat: 12.9345, lng: 77.6266 },
  { name: "Nebula Bookstore", lat: 12.9698, lng: 77.6205 },
];

const ARTISTS = [
  "Bonobo",
  "Khruangbin",
  "Tycho",
  "Arooj Aftab",
  "Floating Points",
  "Prateek Kuhad",
  "Nils Frahm",
  "Peter Cat Recording Co.",
];

const TRACKS: Record<string, string[]> = {
  Bonobo: ["Kerala", "Cirrus", "Linked"],
  Khruangbin: ["White Gloves", "August 10", "Maria También"],
  Tycho: ["Awake", "A Walk", "Horizon"],
  "Arooj Aftab": ["Mohabbat", "Last Night"],
  "Floating Points": ["Movement 6", "Bias"],
  "Prateek Kuhad": ["Cold/Mess", "Kasoor"],
  "Nils Frahm": ["Says", "Sunson"],
  "Peter Cat Recording Co.": ["Floated By", "Where the Money Flows"],
};

const MOVIES = [
  "Arrival",
  "Everything Everywhere All At Once",
  "Interstellar",
  "The Wind Rises",
  "Past Lives",
  "Blade Runner 2049",
  "Chungking Express",
];

const MERCHANTS = [
  { name: "Brew & Bloom Coffee", low: 180, high: 420 },
  { name: "Midnight Bowl (delivery)", low: 260, high: 640 },
  { name: "Metro Card Top-up", low: 100, high: 300 },
  { name: "Nebula Bookstore", low: 320, high: 1400 },
  { name: "Orbit Grocers", low: 400, high: 2100 },
  { name: "Lightspeed Gym", low: 1200, high: 1800 },
];

const SEARCHES = [
  "how do star clusters form",
  "best filter coffee near indiranagar",
  "framer motion orbit animation",
  "late night food delivery open now",
  "what is a constellation boundary",
  "canvas pan zoom implementation",
  "arrival movie ending explained",
  "metro timings sunday",
];

const PEOPLE = ["Aarav", "Meera", "Dev", "Sana", "Ravi"];

const NOTES = [
  "Idea: map my week as a sky instead of a list.",
  "Reminder — return the borrowed book.",
  "Sleep drifting later again this week.",
  "Draft: three things that made today quieter.",
  "Track spending on coffee this month.",
];

const EVENTS = [
  "Design critique — studio",
  "Hackathon kickoff call",
  "Running group — 6km",
  "Film club screening",
  "Parents video call",
];

function iso(day: Date, hour: number, minute: number) {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

let counter = 0;
function make(r: Omit<Receipt, "id">): Receipt {
  counter += 1;
  return { id: `r${String(counter).padStart(3, "0")}`, ...r };
}

function photoTitle(place: string) {
  return `Photo captured near ${place}`;
}

export function buildDemoDataset(): Receipt[] {
  seed = 20260920;
  counter = 0;
  const out: Receipt[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 20);

  for (let dayIndex = 0; dayIndex < 21; dayIndex++) {
    const day = new Date(start);
    day.setDate(start.getDate() + dayIndex);
    const weekday = day.getDay();
    const isWeekend = weekday === 0 || weekday === 6;

    // ---- Morning routine: coffee -> transit -> music (recurring cross-category sequence)
    if (!isWeekend || rnd() > 0.4) {
      const coffee = MERCHANTS[0]!;
      const h = 8 + Math.floor(rnd() * 2);
      const m = Math.floor(rnd() * 40);
      out.push(
        make({
          type: "purchases",
          title: "Filter coffee + croissant",
          timestamp: iso(day, h, m),
          merchant: coffee.name,
          location: PLACES[0]!.name,
          lat: PLACES[0]!.lat,
          lng: PLACES[0]!.lng,
          amount: Math.round(coffee.low + rnd() * (coffee.high - coffee.low)),
          currency: "INR",
          source: "Card statement export",
        }),
      );
      out.push(
        make({
          type: "places",
          title: "Check-in — Brew & Bloom Coffee",
          timestamp: iso(day, h, m + 4),
          location: PLACES[0]!.name,
          lat: PLACES[0]!.lat,
          lng: PLACES[0]!.lng,
          source: "Location history",
        }),
      );
      out.push(
        make({
          type: "places",
          title: "Transit — Metro Line 2",
          timestamp: iso(day, h, m + 19),
          location: PLACES[1]!.name,
          lat: PLACES[1]!.lat,
          lng: PLACES[1]!.lng,
          source: "Location history",
        }),
      );
      const artist = pick(ARTISTS);
      out.push(
        make({
          type: "music",
          title: `Played "${pick(TRACKS[artist]!)}"`,
          timestamp: iso(day, h, m + 24),
          artist,
          location: PLACES[1]!.name,
          lat: PLACES[1]!.lat,
          lng: PLACES[1]!.lng,
          source: "Streaming history",
        }),
      );
    }

    // ---- Work block: searches + notes + messages
    const workHour = 11 + Math.floor(rnd() * 4);
    out.push(
      make({
        type: "searches",
        title: `Searched "${pick(SEARCHES)}"`,
        timestamp: iso(day, workHour, Math.floor(rnd() * 50)),
        location: isWeekend ? PLACES[6]!.name : PLACES[2]!.name,
        source: "Search activity export",
      }),
    );
    if (rnd() > 0.35) {
      out.push(
        make({
          type: "messages",
          title: `Message thread with ${pick(PEOPLE)}`,
          timestamp: iso(day, workHour, 10 + Math.floor(rnd() * 40)),
          notes: "12 messages exchanged",
          location: isWeekend ? PLACES[6]!.name : PLACES[2]!.name,
          source: "Chat export",
        }),
      );
    }
    if (rnd() > 0.7) {
      out.push(
        make({
          type: "notes",
          title: pick(NOTES),
          timestamp: iso(day, workHour + 1, Math.floor(rnd() * 55)),
          source: "Notes app export",
        }),
      );
    }

    // ---- Events on some days
    if (rnd() > 0.62) {
      const place = pick(PLACES);
      out.push(
        make({
          type: "events",
          title: pick(EVENTS),
          timestamp: iso(day, 17, Math.floor(rnd() * 50)),
          location: place.name,
          lat: place.lat,
          lng: place.lng,
          source: "Calendar export",
        }),
      );
    }

    // ---- Evening: photos + places
    if (rnd() > 0.45) {
      const place = pick(PLACES);
      out.push(
        make({
          type: "photos",
          title: photoTitle(place.name),
          timestamp: iso(day, 18, Math.floor(rnd() * 55)),
          location: place.name,
          lat: place.lat,
          lng: place.lng,
          notes: "1 image, no album",
          source: "Photo library metadata",
        }),
      );
      out.push(
        make({
          type: "places",
          title: `Check-in — ${place.name}`,
          timestamp: iso(day, 18, 4 + Math.floor(rnd() * 50)),
          location: place.name,
          lat: place.lat,
          lng: place.lng,
          source: "Location history",
        }),
      );
    }

    // ---- Movie nights (Fri/Sat cluster)
    if (weekday === 5 || weekday === 6) {
      out.push(
        make({
          type: "movies",
          title: `Watched "${pick(MOVIES)}"`,
          timestamp: iso(day, 21, Math.floor(rnd() * 40)),
          location: rnd() > 0.5 ? PLACES[5]!.name : PLACES[6]!.name,
          source: "Watch history",
        }),
      );
      out.push(
        make({
          type: "messages",
          title: `Message thread with ${pick(PEOPLE)}`,
          timestamp: iso(day, 23, Math.floor(rnd() * 30)),
          notes: "Discussed the film afterwards",
          source: "Chat export",
        }),
      );
    }

    // ---- Late-night recurring routine: music + food order + search
    if (rnd() > 0.4) {
      const artist = pick(ARTISTS);
      const baseM = Math.floor(rnd() * 30);
      out.push(
        make({
          type: "music",
          title: `Played "${pick(TRACKS[artist]!)}"`,
          timestamp: iso(day, 23, 30 + Math.min(baseM, 29)),
          artist,
          location: PLACES[6]!.name,
          lat: PLACES[6]!.lat,
          lng: PLACES[6]!.lng,
          source: "Streaming history",
        }),
      );
      const food = MERCHANTS[1]!;
      out.push(
        make({
          type: "purchases",
          title: "Late night food order",
          timestamp: iso(day, 23, 40 + Math.min(baseM, 19)),
          merchant: food.name,
          amount: Math.round(food.low + rnd() * (food.high - food.low)),
          currency: "INR",
          location: PLACES[6]!.name,
          lat: PLACES[6]!.lat,
          lng: PLACES[6]!.lng,
          source: "Order history export",
        }),
      );
    }

    // ---- Occasional other purchases
    if (rnd() > 0.72) {
      const merchant = pick(MERCHANTS.slice(2));
      out.push(
        make({
          type: "purchases",
          title: `Purchase at ${merchant.name}`,
          timestamp: iso(day, 15 + Math.floor(rnd() * 4), Math.floor(rnd() * 59)),
          merchant: merchant.name,
          amount: Math.round(merchant.low + rnd() * (merchant.high - merchant.low)),
          currency: "INR",
          source: "Card statement export",
        }),
      );
    }
  }

  // ---- One deliberate dense burst window (hackathon night) on the most recent day
  const burstDay = new Date(start);
  burstDay.setDate(start.getDate() + 20);
  const burst: Array<[ReceiptType, string, number, number, Partial<Receipt>]> = [
    ["events", "Hackathon kickoff call", 19, 0, { location: PLACES[2]!.name }],
    ["searches", 'Searched "canvas pan zoom implementation"', 19, 12, {}],
    ["searches", 'Searched "framer motion orbit animation"', 19, 19, {}],
    ["purchases", "Filter coffee + croissant", 19, 26, { merchant: "Brew & Bloom Coffee", amount: 260 }],
    ["music", 'Played "Cirrus"', 19, 31, { artist: "Bonobo" }],
    ["notes", "Idea: map my week as a sky instead of a list.", 19, 44, {}],
    ["messages", "Message thread with Meera", 19, 52, { notes: "Shared the first prototype" }],
    ["photos", "Photo captured near Kandala Co-working Loft", 20, 3, { location: PLACES[2]!.name }],
  ];
  for (const [type, title, h, m, extra] of burst) {
    out.push(
      make({
        type,
        title,
        timestamp: iso(burstDay, h, m),
        source: "Mixed export",
        lat: PLACES[2]!.lat,
        lng: PLACES[2]!.lng,
        location: PLACES[2]!.name,
        ...extra,
      }),
    );
  }

  return out.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export const DEMO_RECEIPTS = buildDemoDataset();
