export const RECEIPT_TYPES = [
  "music",
  "movies",
  "places",
  "purchases",
  "photos",
  "messages",
  "searches",
  "events",
  "notes",
] as const;

export type ReceiptType = (typeof RECEIPT_TYPES)[number];

export interface Receipt {
  id: string;
  type: ReceiptType;
  title: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  merchant?: string;
  artist?: string;
  location?: string;
  lat?: number;
  lng?: number;
  amount?: number;
  currency?: string;
  notes?: string;
  source: string;
}

export type SignalKind =
  | "DATA SIGNAL"
  | "POSSIBLE CONNECTION"
  | "TEMPORAL OVERLAP"
  | "ACTIVITY CLUSTER";

export interface Signal {
  kind: SignalKind;
  /** objective, evidence-first explanation */
  evidence: string;
  weight: number;
}

export interface Connection {
  id: string;
  a: string;
  b: string;
  signals: Signal[];
  strength: number;
  /** minutes between the two records */
  gapMinutes: number;
}

export interface ClusterInfo {
  id: string;
  label: string;
  memberIds: string[];
}

export interface Constellation {
  id: string;
  name: string;
  receiptIds: string[];
  createdAt: number;
  auto?: boolean;
}

export type DiscoveryKind =
  | "burst"
  | "routine"
  | "repeated-entity"
  | "gap"
  | "location-hop";

export interface Discovery {
  id: string;
  kind: DiscoveryKind;
  title: string;
  evidence: string[];
  receiptIds: string[];
  why: string;
  tag: SignalKind;
}

export type TimeOfDay = "morning" | "afternoon" | "evening" | "late night";
