import { ms } from "./engine";
import type { GraphIndex } from "./engine";
import type { Receipt } from "./types";

export interface StarPos {
  id: string;
  x: number;
  y: number;
  clusterId: string;
}

const GOLDEN = 2.399963229728653;

/**
 * Deterministic galaxy layout: every detected cluster becomes an island on a
 * golden-angle spiral, its member stars orbit the island core, and isolated
 * stars drift in the outer field.
 */
export function layoutGalaxy(receipts: Receipt[], index: GraphIndex): Map<string, StarPos> {
  const pos = new Map<string, StarPos>();

  const clusters = [...index.clusters].sort((a, b) => {
    const ta = Math.min(...a.memberIds.map((id) => ms(index.byId.get(id)!)));
    const tb = Math.min(...b.memberIds.map((id) => ms(index.byId.get(id)!)));
    return ta - tb;
  });

  clusters.forEach((cluster, i) => {
    const angle = i * GOLDEN;
    const radius = 150 * Math.sqrt(i + 1);
    const cx = Math.cos(angle) * radius;
    const cy = Math.sin(angle) * radius * 0.72;
    const members = [...cluster.memberIds].sort(
      (a, b) => ms(index.byId.get(a)!) - ms(index.byId.get(b)!),
    );
    members.forEach((id, k) => {
      const a = k * GOLDEN + i;
      const r = k === 0 ? 0 : 16 + 11 * Math.sqrt(k);
      pos.set(id, {
        id,
        clusterId: cluster.id,
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r * 0.85,
      });
    });
  });

  const isolated = receipts.filter((r) => !pos.has(r.id));
  isolated.forEach((r, i) => {
    const a = (i + clusters.length) * GOLDEN + 0.6;
    const radius = 220 + 170 * Math.sqrt(i + 1);
    pos.set(r.id, {
      id: r.id,
      clusterId: "isolated",
      x: Math.cos(a) * radius,
      y: Math.sin(a) * radius * 0.72,
    });
  });

  return pos;
}
