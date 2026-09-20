import type { ReceiptType, SignalKind } from "./types";

export const TYPE_COLOR: Record<ReceiptType, string> = {
  music: "#7dd3fc",
  movies: "#c4b5fd",
  places: "#5eead4",
  purchases: "#fcd34d",
  photos: "#f9a8d4",
  messages: "#a5b4fc",
  searches: "#93c5fd",
  events: "#fda4af",
  notes: "#e2e8f0",
};

export const TYPE_LABEL: Record<ReceiptType, string> = {
  music: "Music",
  movies: "Movies & Entertainment",
  places: "Places",
  purchases: "Purchases",
  photos: "Photos",
  messages: "Messages",
  searches: "Searches",
  events: "Events",
  notes: "Personal Notes",
};

export const SIGNAL_STYLE: Record<SignalKind, string> = {
  "DATA SIGNAL": "border-[#5eead4]/40 text-[#5eead4] bg-[#5eead4]/10",
  "POSSIBLE CONNECTION": "border-[#c4b5fd]/40 text-[#c4b5fd] bg-[#c4b5fd]/10",
  "TEMPORAL OVERLAP": "border-[#7dd3fc]/40 text-[#7dd3fc] bg-[#7dd3fc]/10",
  "ACTIVITY CLUSTER": "border-[#f9a8d4]/40 text-[#f9a8d4] bg-[#f9a8d4]/10",
};
