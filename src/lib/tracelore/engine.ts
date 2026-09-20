import type {
  ClusterInfo,
  Connection,
  Discovery,
  Receipt,
  Signal,
  TimeOfDay,
} from "./types";

/* ------------------------------------------------------------------ */
/* Time helpers                                                        */
/* ------------------------------------------------------------------ */

export function ms(r: Receipt) {
  return new Date(r.timestamp).getTime();
}

export function timeOfDay(r: Receipt): TimeOfDay {
  const h = new Date(r.timestamp).getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "late night";
}

export function dayKey(r: Receipt) {
  const d = new Date(r.timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function formatStamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function entityOf(r: Receipt): string | undefined {
  return r.artist ?? r.merchant;
}

function haversineKm(a: Receipt, b: Receipt) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return Infinity;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* ------------------------------------------------------------------ */
/* Connect-the-dots engine — deterministic, evidence-first             */
/* ------------------------------------------------------------------ */

const MAX_PAIR_WINDOW_MIN = 180;

export function buildConnections(receipts: Receipt[]): Connection[] {
  const sorted = [...receipts].sort((a, b) => ms(a) - ms(b));
  const connections: Connection[] = [];

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i]!;
      const b = sorted[j]!;
      const gapMinutes = Math.round((ms(b) - ms(a)) / 60000);
      if (gapMinutes > MAX_PAIR_WINDOW_MIN) break;

      const signals: Signal[] = [];

      if (gapMinutes <= 15) {
        signals.push({
          kind: "TEMPORAL OVERLAP",
          evidence: `Two records occurred ${gapMinutes} minute${gapMinutes === 1 ? "" : "s"} apart.`,
          weight: 3,
        });
      } else if (gapMinutes <= 60) {
        signals.push({
          kind: "POSSIBLE CONNECTION",
          evidence: `Both records fall inside the same hour window (${gapMinutes} minutes apart).`,
          weight: 1.5,
        });
      }

      const sameLocation =
        (a.location && b.location && a.location === b.location) ||
        haversineKm(a, b) < 0.3;
      if (sameLocation && gapMinutes <= MAX_PAIR_WINDOW_MIN) {
        signals.push({
          kind: "DATA SIGNAL",
          evidence: `Same recorded location (${a.location ?? "matching coordinates"}) within the same activity window.`,
          weight: 2.5,
        });
      }

      const ea = entityOf(a);
      const eb = entityOf(b);
      if (ea && eb && ea === eb) {
        signals.push({
          kind: "DATA SIGNAL",
          evidence: `Repeated entity: "${ea}" appears in both records.`,
          weight: 2,
        });
      }

      if (a.type !== b.type && gapMinutes <= 45) {
        signals.push({
          kind: "ACTIVITY CLUSTER",
          evidence: `Cross-category sequence: ${a.type} record followed by ${b.type} record ${gapMinutes} minutes later.`,
          weight: 1.5,
        });
      }

      if (dayKey(a) === dayKey(b) && timeOfDay(a) === timeOfDay(b) && signals.length > 0) {
        signals.push({
          kind: "DATA SIGNAL",
          evidence: `Same date and same time-of-day window (${timeOfDay(a)}).`,
          weight: 0.75,
        });
      }

      const strength = signals.reduce((s, x) => s + x.weight, 0);
      if (strength >= 2.5) {
        connections.push({
          id: `${a.id}__${b.id}`,
          a: a.id,
          b: b.id,
          signals,
          strength: Math.round(strength * 100) / 100,
          gapMinutes,
        });
      }
    }
  }
  return connections;
}

export interface GraphIndex {
  byId: Map<string, Receipt>;
  neighbors: Map<string, Connection[]>;
  connections: Connection[];
  clusterOf: Map<string, string>;
  clusters: ClusterInfo[];
}

export function buildIndex(receipts: Receipt[]): GraphIndex {
  const connections = buildConnections(receipts);
  const byId = new Map(receipts.map((r) => [r.id, r]));
  const neighbors = new Map<string, Connection[]>();
  for (const r of receipts) neighbors.set(r.id, []);
  for (const c of connections) {
    neighbors.get(c.a)?.push(c);
    neighbors.get(c.b)?.push(c);
  }

  // connected components => clusters
  const clusterOf = new Map<string, string>();
  const clusters: ClusterInfo[] = [];
  const seen = new Set<string>();
  let n = 0;
  for (const r of receipts) {
    if (seen.has(r.id)) continue;
    const stack = [r.id];
    const members: string[] = [];
    seen.add(r.id);
    while (stack.length) {
      const cur = stack.pop()!;
      members.push(cur);
      for (const c of neighbors.get(cur) ?? []) {
        const other = c.a === cur ? c.b : c.a;
        if (!seen.has(other)) {
          seen.add(other);
          stack.push(other);
        }
      }
    }
    if (members.length === 1) {
      clusterOf.set(members[0]!, "isolated");
      continue;
    }
    n += 1;
    const id = `CLUSTER-${String(n).padStart(2, "0")}`;
    const mems = members
      .map((m) => byId.get(m)!)
      .sort((a, b) => ms(a) - ms(b));
    const label = `${id} · ${mems.length} stars · ${formatStamp(mems[0]!.timestamp)}`;
    for (const m of members) clusterOf.set(m, id);
    clusters.push({ id, label, memberIds: members });
  }

  return { byId, neighbors, connections, clusterOf, clusters };
}

export function connectionsFor(index: GraphIndex, id: string): Connection[] {
  return [...(index.neighbors.get(id) ?? [])].sort((a, b) => b.strength - a.strength);
}

export function otherId(c: Connection, id: string) {
  return c.a === id ? c.b : c.a;
}

/* ------------------------------------------------------------------ */
/* Discovery engine                                                    */
/* ------------------------------------------------------------------ */

export function runDiscovery(receipts: Receipt[], index: GraphIndex): Discovery[] {
  const out: Discovery[] = [];
  const sorted = [...receipts].sort((a, b) => ms(a) - ms(b));
  if (sorted.length === 0) return out;

  /* 1. Burst activity windows (sliding 90-minute window) */
  const WINDOW = 90 * 60000;
  const bursts: { members: Receipt[]; score: number }[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const members: Receipt[] = [];
    for (let j = i; j < sorted.length; j++) {
      if (ms(sorted[j]!) - ms(sorted[i]!) > WINDOW) break;
      members.push(sorted[j]!);
    }
    if (members.length >= 6) bursts.push({ members, score: members.length });
  }
  bursts.sort((a, b) => b.score - a.score);
  const usedBurst = new Set<string>();
  for (const b of bursts) {
    if (b.members.some((m) => usedBurst.has(m.id))) continue;
    b.members.forEach((m) => usedBurst.add(m.id));
    const types = [...new Set(b.members.map((m) => m.type))];
    out.push({
      id: `burst-${b.members[0]!.id}`,
      kind: "burst",
      title: `Burst window — ${b.members.length} records in 90 minutes`,
      evidence: [
        `Window starts ${formatStamp(b.members[0]!.timestamp)} and ends ${formatStamp(
          b.members[b.members.length - 1]!.timestamp,
        )}.`,
        `Categories present: ${types.join(", ")}.`,
        `Density is ${(b.members.length / 1.5).toFixed(1)} records per hour against a dataset average of ${(
          receipts.length /
          Math.max(1, (ms(sorted[sorted.length - 1]!) - ms(sorted[0]!)) / 3600000)
        ).toFixed(2)}.`,
      ],
      receiptIds: b.members.map((m) => m.id),
      why: "High-density windows mark where multiple independent data sources recorded activity at once. This is a measurable density shift, not an inferred mood.",
      tag: "ACTIVITY CLUSTER",
    });
    if (out.length >= 3) break;
  }

  /* 2. Cross-category recurring routines */
  const seqCounts = new Map<string, Receipt[][]>();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const gap = (ms(sorted[j]!) - ms(sorted[i]!)) / 60000;
      if (gap > 45) break;
      if (sorted[i]!.type === sorted[j]!.type) continue;
      const key = `${sorted[i]!.type}→${sorted[j]!.type}@${timeOfDay(sorted[i]!)}`;
      const list = seqCounts.get(key) ?? [];
      list.push([sorted[i]!, sorted[j]!]);
      seqCounts.set(key, list);
    }
  }
  const routines = [...seqCounts.entries()]
    .filter(([, v]) => v.length >= 5)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);
  for (const [key, pairs] of routines) {
    const [seq, tod] = key.split("@");
    const days = new Set(pairs.map(([a]) => dayKey(a!)));
    out.push({
      id: `routine-${key}`,
      kind: "routine",
      title: `Recurring routine — ${seq} during ${tod}`,
      evidence: [
        `Sequence observed ${pairs.length} times across ${days.size} distinct days.`,
        `Median gap between the two records: ${median(
          pairs.map(([a, b]) => (ms(b!) - ms(a!)) / 60000),
        ).toFixed(0)} minutes.`,
      ],
      receiptIds: pairs.flatMap(([a, b]) => [a!.id, b!.id]).slice(0, 14),
      why: "A repeated ordering between two different data sources is a structural pattern in the record trail. It describes sequence frequency only.",
      tag: "POSSIBLE CONNECTION",
    });
  }

  /* 3. Repeated entities */
  const entities = new Map<string, Receipt[]>();
  for (const r of sorted) {
    const e = entityOf(r);
    if (!e) continue;
    entities.set(e, [...(entities.get(e) ?? []), r]);
  }
  const topEntities = [...entities.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);
  for (const [name, rs] of topEntities) {
    if (rs.length < 4) continue;
    const spend = rs.reduce((s, r) => s + (r.amount ?? 0), 0);
    out.push({
      id: `entity-${name}`,
      kind: "repeated-entity",
      title: `Repeated entity — ${name}`,
      evidence: [
        `${rs.length} records reference "${name}".`,
        `First on ${formatStamp(rs[0]!.timestamp)}, most recent on ${formatStamp(
          rs[rs.length - 1]!.timestamp,
        )}.`,
        spend > 0 ? `Recorded amounts total ${spend} across these records.` : `No monetary amounts recorded.`,
      ],
      receiptIds: rs.map((r) => r.id).slice(0, 12),
      why: "Frequency counts of a named merchant or artist are directly countable facts in the dataset.",
      tag: "DATA SIGNAL",
    });
  }

  /* 4. Temporal gaps */
  let biggest = { gap: 0, a: sorted[0]!, b: sorted[0]! };
  for (let i = 1; i < sorted.length; i++) {
    const gap = ms(sorted[i]!) - ms(sorted[i - 1]!);
    if (gap > biggest.gap) biggest = { gap, a: sorted[i - 1]!, b: sorted[i]! };
  }
  if (biggest.gap > 8 * 3600000) {
    out.push({
      id: "gap-largest",
      kind: "gap",
      title: `Longest silence — ${(biggest.gap / 3600000).toFixed(1)} hours with no records`,
      evidence: [
        `Last record before the gap: ${biggest.a.title} (${formatStamp(biggest.a.timestamp)}).`,
        `First record after the gap: ${biggest.b.title} (${formatStamp(biggest.b.timestamp)}).`,
      ],
      receiptIds: [biggest.a.id, biggest.b.id],
      why: "Absence of records is itself data. It shows where no connected source was logging, not necessarily where nothing happened.",
      tag: "DATA SIGNAL",
    });
  }

  /* 5. Location hops */
  const geo = sorted.filter((r) => r.lat != null);
  let hop: { km: number; a: Receipt; b: Receipt } | null = null;
  for (let i = 1; i < geo.length; i++) {
    const km = haversineKm(geo[i - 1]!, geo[i]!);
    const mins = (ms(geo[i]!) - ms(geo[i - 1]!)) / 60000;
    if (mins <= 30 && km > 4 && (!hop || km > hop.km)) {
      hop = { km, a: geo[i - 1]!, b: geo[i]! };
    }
  }
  if (hop) {
    out.push({
      id: "hop-largest",
      kind: "location-hop",
      title: `Fast location hop — ${hop.km.toFixed(1)} km in under 30 minutes`,
      evidence: [
        `${hop.a.location} at ${formatStamp(hop.a.timestamp)}.`,
        `${hop.b.location} at ${formatStamp(hop.b.timestamp)}.`,
      ],
      receiptIds: [hop.a.id, hop.b.id],
      why: "Rapid coordinate change between consecutive records indicates transit in the recorded trail.",
      tag: "TEMPORAL OVERLAP",
    });
  }

  // Keep only discoveries whose receipts exist, and annotate isolation
  return out.filter((d) => d.receiptIds.every((id) => index.byId.has(id)));
}

function median(values: number[]) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

/* ------------------------------------------------------------------ */
/* Auto constellations                                                 */
/* ------------------------------------------------------------------ */

export function constellationSummary(receipts: Receipt[], index: GraphIndex) {
  const sorted = [...receipts].sort((a, b) => ms(a) - ms(b));
  const types = new Map<string, number>();
  for (const r of sorted) types.set(r.type, (types.get(r.type) ?? 0) + 1);
  const internal = index.connections.filter(
    (c) => receipts.some((r) => r.id === c.a) && receipts.some((r) => r.id === c.b),
  );
  const spanMs = sorted.length > 1 ? ms(sorted[sorted.length - 1]!) - ms(sorted[0]!) : 0;
  return {
    count: sorted.length,
    types: [...types.entries()].sort((a, b) => b[1] - a[1]),
    first: sorted[0],
    last: sorted[sorted.length - 1],
    spanHours: spanMs / 3600000,
    connections: internal,
  };
}

/* ------------------------------------------------------------------ */
/* Filtering                                                           */
/* ------------------------------------------------------------------ */

export interface Filters {
  query: string;
  types: string[];
  timesOfDay: TimeOfDay[];
  from?: string | undefined;
  to?: string | undefined;
  linkage: "all" | "connected" | "isolated";
}

export const EMPTY_FILTERS: Filters = {
  query: "",
  types: [],
  timesOfDay: [],
  linkage: "all",
};

export function applyFilters(
  receipts: Receipt[],
  filters: Filters,
  index: GraphIndex,
): Receipt[] {
  const q = filters.query.trim().toLowerCase();
  return receipts.filter((r) => {
    if (filters.types.length && !filters.types.includes(r.type)) return false;
    if (filters.timesOfDay.length && !filters.timesOfDay.includes(timeOfDay(r))) return false;
    if (filters.from && r.timestamp < new Date(filters.from).toISOString()) return false;
    if (filters.to) {
      const end = new Date(filters.to);
      end.setHours(23, 59, 59, 999);
      if (ms(r) > end.getTime()) return false;
    }
    if (filters.linkage !== "all") {
      const degree = index.neighbors.get(r.id)?.length ?? 0;
      if (filters.linkage === "connected" && degree === 0) return false;
      if (filters.linkage === "isolated" && degree > 0) return false;
    }
    if (q) {
      const hay = [r.title, r.artist, r.merchant, r.location, r.notes, r.type, r.source]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/* ------------------------------------------------------------------ */
/* Import validation                                                   */
/* ------------------------------------------------------------------ */

export function parseReceiptsJson(text: string): { ok: true; receipts: Receipt[] } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }
  const arr = Array.isArray(raw) ? raw : (raw as { receipts?: unknown })?.receipts;
  if (!Array.isArray(arr)) {
    return { ok: false, error: "Expected an array of records, or an object with a `receipts` array." };
  }
  const receipts: Receipt[] = [];
  for (const [i, item] of arr.entries()) {
    const r = item as Partial<Receipt>;
    if (!r || typeof r !== "object") return { ok: false, error: `Record ${i + 1} is not an object.` };
    if (!r.title || !r.timestamp || !r.type) {
      return { ok: false, error: `Record ${i + 1} is missing title, type or timestamp.` };
    }
    if (Number.isNaN(new Date(r.timestamp).getTime())) {
      return { ok: false, error: `Record ${i + 1} has an unreadable timestamp.` };
    }
    receipts.push({
      ...(r as Receipt),
      id: r.id ?? `import-${i + 1}`,
      source: r.source ?? "Imported file",
    });
  }
  if (!receipts.length) return { ok: false, error: "The file contained no records." };
  return { ok: true, receipts };
}
