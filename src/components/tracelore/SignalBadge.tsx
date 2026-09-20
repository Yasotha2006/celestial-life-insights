import { cn } from "@/lib/utils";
import { SIGNAL_STYLE } from "@/lib/tracelore/style";
import type { SignalKind } from "@/lib/tracelore/types";

export function SignalBadge({ kind, className }: { kind: SignalKind; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
        SIGNAL_STYLE[kind],
        className,
      )}
    >
      {kind}
    </span>
  );
}
