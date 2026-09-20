import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_RECEIPTS } from "./dataset";
import {
  applyFilters,
  buildIndex,
  EMPTY_FILTERS,
  runDiscovery,
  type Filters,
  type GraphIndex,
} from "./engine";
import type { Constellation, Receipt } from "./types";

interface TraceloreState {
  receipts: Receipt[];
  index: GraphIndex;
  filters: Filters;
  setFilters: (f: Filters | ((f: Filters) => Filters)) => void;
  resetFilters: () => void;
  visible: Receipt[];
  discoveries: ReturnType<typeof runDiscovery>;
  selectedId: string | null;
  select: (id: string | null) => void;
  orbitId: string | null;
  setOrbitId: (id: string | null) => void;
  constellations: Constellation[];
  activeConstellationId: string | null;
  setActiveConstellationId: (id: string | null) => void;
  createConstellation: (name: string, receiptIds: string[]) => string;
  addToConstellation: (constellationId: string, receiptId: string) => void;
  removeFromConstellation: (constellationId: string, receiptId: string) => void;
  deleteConstellation: (id: string) => void;
  renameConstellation: (id: string, name: string) => void;
  loadReceipts: (receipts: Receipt[]) => void;
  resetToDemo: () => void;
  datasetLabel: string;
}

const Ctx = createContext<TraceloreState | null>(null);

export function TraceloreProvider({ children }: { children: ReactNode }) {
  const [receipts, setReceipts] = useState<Receipt[]>(DEMO_RECEIPTS);
  const [datasetLabel, setDatasetLabel] = useState("Demo dataset");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orbitId, setOrbitId] = useState<string | null>(null);
  const [constellations, setConstellations] = useState<Constellation[]>([]);
  const [activeConstellationId, setActiveConstellationId] = useState<string | null>(null);

  const index = useMemo(() => buildIndex(receipts), [receipts]);
  const visible = useMemo(
    () => applyFilters(receipts, filters, index),
    [receipts, filters, index],
  );
  const discoveries = useMemo(() => runDiscovery(receipts, index), [receipts, index]);

  const createConstellation = useCallback((name: string, receiptIds: string[]) => {
    const id = `c-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
    setConstellations((prev) => [
      ...prev,
      { id, name, receiptIds: [...new Set(receiptIds)], createdAt: Date.now() },
    ]);
    setActiveConstellationId(id);
    return id;
  }, []);

  const value: TraceloreState = {
    receipts,
    index,
    filters,
    setFilters,
    resetFilters: () => setFilters(EMPTY_FILTERS),
    visible,
    discoveries,
    selectedId,
    select: setSelectedId,
    orbitId,
    setOrbitId,
    constellations,
    activeConstellationId,
    setActiveConstellationId,
    createConstellation,
    addToConstellation: (cid, rid) =>
      setConstellations((prev) =>
        prev.map((c) =>
          c.id === cid ? { ...c, receiptIds: [...new Set([...c.receiptIds, rid])] } : c,
        ),
      ),
    removeFromConstellation: (cid, rid) =>
      setConstellations((prev) =>
        prev.map((c) =>
          c.id === cid ? { ...c, receiptIds: c.receiptIds.filter((x) => x !== rid) } : c,
        ),
      ),
    deleteConstellation: (id) => {
      setConstellations((prev) => prev.filter((c) => c.id !== id));
      setActiveConstellationId((cur) => (cur === id ? null : cur));
    },
    renameConstellation: (id, name) =>
      setConstellations((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c))),
    loadReceipts: (next) => {
      setReceipts(next);
      setDatasetLabel("Imported dataset");
      setSelectedId(null);
      setOrbitId(null);
      setConstellations([]);
      setFilters(EMPTY_FILTERS);
    },
    resetToDemo: () => {
      setReceipts(DEMO_RECEIPTS);
      setDatasetLabel("Demo dataset");
      setSelectedId(null);
      setOrbitId(null);
      setFilters(EMPTY_FILTERS);
    },
    datasetLabel,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTracelore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTracelore must be used inside TraceloreProvider");
  return ctx;
}
