import { useTracelore } from "@/lib/tracelore/store";
import { formatStamp, timeOfDay } from "@/lib/tracelore/engine";
import { TYPE_LABEL } from "@/lib/tracelore/style";

export function RecordsTable() {
  const { visible, index, select, selectedId } = useTracelore();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold">Records list</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Keyboard-accessible equivalent of the galaxy canvas. {visible.length} matching records.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {visible.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">
            No records match the current filters. Reset the filters to see the full galaxy again.
          </p>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">Matching digital life receipts</caption>
            <thead className="sticky top-0 bg-card text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2">Record</th>
                <th scope="col" className="px-3 py-2">Type</th>
                <th scope="col" className="px-3 py-2">When</th>
                <th scope="col" className="px-3 py-2">Links</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.id}
                  className={`border-t border-border ${selectedId === r.id ? "bg-primary/10" : ""}`}
                >
                  <th scope="row" className="px-3 py-2 font-normal">
                    <button
                      onClick={() => select(r.id)}
                      className="text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {r.title}
                    </button>
                    {r.location && (
                      <span className="block text-[10px] text-muted-foreground">{r.location}</span>
                    )}
                  </th>
                  <td className="px-3 py-2 text-muted-foreground">{TYPE_LABEL[r.type]}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatStamp(r.timestamp)}
                    <span className="block text-[10px]">{timeOfDay(r)}</span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {index.neighbors.get(r.id)?.length ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
