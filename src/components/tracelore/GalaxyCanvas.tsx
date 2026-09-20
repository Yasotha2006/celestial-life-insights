import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { useTracelore } from "@/lib/tracelore/store";
import { layoutGalaxy } from "@/lib/tracelore/layout";
import { TYPE_COLOR } from "@/lib/tracelore/style";
import { formatStamp } from "@/lib/tracelore/engine";
import type { Receipt } from "@/lib/tracelore/types";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function GalaxyCanvas({ compact = false }: { compact?: boolean }) {
  const { receipts, index, visible, selectedId, select } = useTracelore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const positions = useMemo(() => layoutGalaxy(receipts, index), [receipts, index]);
  const visibleIds = useMemo(() => new Set(visible.map((r) => r.id)), [visible]);

  const camera = useRef({ x: 0, y: 0, scale: compact ? 0.45 : 0.75 });
  const [, force] = useState(0);
  const [hover, setHover] = useState<{ receipt: Receipt; sx: number; sy: number } | null>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // background nebula wash
      const grd = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.8);
      grd.addColorStop(0, "rgba(56,89,148,0.20)");
      grd.addColorStop(0.5, "rgba(88,52,140,0.10)");
      grd.addColorStop(1, "rgba(3,6,18,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      const cam = camera.current;
      const toScreen = (x: number, y: number) => ({
        sx: w / 2 + (x + cam.x) * cam.scale,
        sy: h / 2 + (y + cam.y) * cam.scale,
      });

      // faint background dust
      ctx.fillStyle = "rgba(255,255,255,0.13)";
      for (let i = 0; i < 160; i++) {
        const dx = ((i * 9301 + 49297) % 233280) / 233280;
        const dy = ((i * 4931 + 7919) % 49999) / 49999;
        ctx.fillRect(dx * w, dy * h, 1, 1);
      }

      // connections
      ctx.lineWidth = 1;
      for (const c of index.connections) {
        const pa = positions.get(c.a);
        const pb = positions.get(c.b);
        if (!pa || !pb) continue;
        const both = visibleIds.has(c.a) && visibleIds.has(c.b);
        const A = toScreen(pa.x, pa.y);
        const B = toScreen(pb.x, pb.y);
        if (Math.max(A.sx, B.sx) < -50 || Math.min(A.sx, B.sx) > w + 50) continue;
        const touchesSelection = selectedId === c.a || selectedId === c.b;
        ctx.strokeStyle = touchesSelection
          ? "rgba(125,211,252,0.85)"
          : both
            ? `rgba(148,190,255,${Math.min(0.32, 0.07 + c.strength / 40)})`
            : "rgba(120,140,190,0.05)";
        ctx.beginPath();
        ctx.moveTo(A.sx, A.sy);
        ctx.lineTo(B.sx, B.sy);
        ctx.stroke();
      }

      // stars
      for (const r of receipts) {
        const p = positions.get(r.id);
        if (!p) continue;
        const { sx, sy } = toScreen(p.x, p.y);
        if (sx < -30 || sx > w + 30 || sy < -30 || sy > h + 30) continue;
        const on = visibleIds.has(r.id);
        const degree = index.neighbors.get(r.id)?.length ?? 0;
        const pulse = reduced ? 1 : 1 + Math.sin(time / 900 + p.x) * 0.08;
        const base = (1.8 + Math.min(degree, 8) * 0.34) * (compact ? 0.9 : 1);
        const radius = base * pulse * (selectedId === r.id ? 2.1 : 1);
        const color = TYPE_COLOR[r.type];

        if (on) {
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(sx, sy, radius * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = on ? 1 : 0.16;
        ctx.fillStyle = on ? color : "#64748b";
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();

        if (selectedId === r.id) {
          ctx.globalAlpha = 1;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(sx, sy, radius + 6, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    },
    [receipts, index, positions, visibleIds, selectedId, reduced, compact],
  );

  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  const hit = (clientX: number, clientY: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const rect = wrap.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const cam = camera.current;
    let best: { r: Receipt; d: number; sx: number; sy: number } | null = null;
    for (const r of visible) {
      const p = positions.get(r.id);
      if (!p) continue;
      const sx = rect.width / 2 + (p.x + cam.x) * cam.scale;
      const sy = rect.height / 2 + (p.y + cam.y) * cam.scale;
      const d = Math.hypot(sx - px, sy - py);
      if (d < 14 && (!best || d < best.d)) best = { r, d, sx, sy };
    }
    return best;
  };

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-[#05060f]"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, moved: false };
      }}
      onPointerMove={(e) => {
        if (drag.current) {
          const dx = e.clientX - drag.current.x;
          const dy = e.clientY - drag.current.y;
          if (Math.abs(dx) + Math.abs(dy) > 3) {
            drag.current.moved = true;
            camera.current.x += dx / camera.current.scale;
            camera.current.y += dy / camera.current.scale;
            drag.current.x = e.clientX;
            drag.current.y = e.clientY;
            setHover(null);
          }
          return;
        }
        const found = hit(e.clientX, e.clientY);
        setHover(found ? { receipt: found.r, sx: found.sx, sy: found.sy } : null);
      }}
      onPointerUp={(e) => {
        const wasDrag = drag.current?.moved;
        drag.current = null;
        if (wasDrag) return;
        const found = hit(e.clientX, e.clientY);
        if (found) select(found.r.id);
      }}
      onPointerLeave={() => {
        drag.current = null;
        setHover(null);
      }}
      onWheel={(e) => {
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        camera.current.scale = Math.min(4, Math.max(0.15, camera.current.scale * factor));
        force((n) => n + 1);
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full cursor-crosshair touch-none" />

      {hover && (
        <div
          className="pointer-events-none absolute z-10 max-w-[240px] rounded-lg border border-border bg-popover/95 p-3 text-xs shadow-xl backdrop-blur"
          style={{
            left: Math.max(8, Math.min(hover.sx + 14, (wrapRef.current?.clientWidth ?? 300) - 250)),
            top: Math.max(8, hover.sy - 10),
          }}
        >
          <p className="font-medium text-foreground">{hover.receipt.title}</p>
          <p className="mt-1 text-muted-foreground">
            {hover.receipt.type} · {formatStamp(hover.receipt.timestamp)}
          </p>
          {hover.receipt.location && (
            <p className="text-muted-foreground">{hover.receipt.location}</p>
          )}
        </div>
      )}

      <div className="absolute bottom-3 right-3 flex gap-1">
        {[
          { icon: Plus, label: "Zoom in", act: () => (camera.current.scale *= 1.25) },
          { icon: Minus, label: "Zoom out", act: () => (camera.current.scale /= 1.25) },
          {
            icon: Maximize2,
            label: "Reset view",
            act: () => (camera.current = { x: 0, y: 0, scale: compact ? 0.45 : 0.75 }),
          },
        ].map(({ icon: Icon, label, act }) => (
          <button
            key={label}
            aria-label={label}
            onClick={() => {
              act();
              force((n) => n + 1);
            }}
            className="rounded-md border border-border bg-card/80 p-2 text-muted-foreground backdrop-blur transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>

      <p className="pointer-events-none absolute bottom-3 left-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {visible.length} of {receipts.length} stars · drag to pan · scroll to zoom
      </p>
    </div>
  );
}
