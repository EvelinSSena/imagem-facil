import { useEffect, useRef, useState } from "react";
import { Crop, Trash2, Loader2, Package, CheckCircle2, RotateCw, Undo2 } from "lucide-react";
import { ToolPageLayout, ErrorBanner } from "@/components/ToolPageLayout";
import { RelatedTools } from "@/components/RelatedTools";
import { FileDropZone } from "@/components/FileDropZone";
import { ResultsGrid } from "@/components/ResultsGrid";
import {
  processFile,
  canvasToBlob,
  formatBytes,
  formatDimensions,
  createZipBlob,
  downloadBlob,
  type ProcessedResult,
} from "@/lib/imageUtils";

interface Item {
  file: File;
  previewUrl: string;
  id: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type PresetKey = "free" | "1:1" | "4:5" | "3:4" | "16:9" | "9:16";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MIN_RECT_PCT = 2;

const presets: { key: PresetKey; label: string; ratio: number | null }[] = [
  { key: "free", label: "Livre", ratio: null },
  { key: "1:1", label: "1:1 (Quadrado)", ratio: 1 },
  { key: "4:5", label: "4:5 (Instagram)", ratio: 4 / 5 },
  { key: "3:4", label: "3:4", ratio: 3 / 4 },
  { key: "16:9", label: "16:9", ratio: 16 / 9 },
  { key: "9:16", label: "9:16 (Stories)", ratio: 9 / 16 },
];

const handles: { id: "nw" | "ne" | "sw" | "se"; cursor: string; style: React.CSSProperties }[] = [
  { id: "nw", cursor: "nwse-resize", style: { left: -6, top: -6 } },
  { id: "ne", cursor: "nesw-resize", style: { right: -6, top: -6 } },
  { id: "sw", cursor: "nesw-resize", style: { left: -6, bottom: -6 } },
  { id: "se", cursor: "nwse-resize", style: { right: -6, bottom: -6 } },
];

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function defaultRect(k: number | null): Rect {
  if (k === null || k <= 0) return { x: 20, y: 20, w: 60, h: 60 };
  // Largest centered rect with pixel ratio k = wPct/hPct that fits in the image
  const hPct = Math.min(100, 100 / k);
  const wPct = k * hPct;
  return { x: (100 - wPct) / 2, y: (100 - hPct) / 2, w: wPct, h: hPct };
}

export function CropperPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [presetKey, setPresetKey] = useState<PresetKey>("free");
  const [rect, setRect] = useState<Rect>({ x: 20, y: 20, w: 60, h: 60 });
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState("");
  const [zipState, setZipState] = useState<"idle" | "preparing" | "done">("idle");
  const [zipUrl, setZipUrl] = useState("");
  const [natSize, setNatSize] = useState({ w: 0, h: 0 });
  const zipName = "imagem-facil-recortes.zip";
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ mode: string; startX: number; startY: number; rect: Rect } | null>(null);

  const active = items[activeIndex];
  const ratio = presets.find((p) => p.key === presetKey)?.ratio ?? null;
  // Pixel ratio target expressed in %-coordinate space: wPct = k * hPct
  const k = ratio && natSize.h > 0 ? ratio * (natSize.h / natSize.w) : null;
  const cropWpx = natSize.w > 0 ? Math.round((rect.w / 100) * natSize.w) : 0;
  const cropHpx = natSize.h > 0 ? Math.round((rect.h / 100) * natSize.h) : 0;

  useEffect(() => {
    setRect(defaultRect(k));
  }, [presetKey, activeIndex, items.length === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = (files: File[]) => {
    setError("");
    const accepted: Item[] = [];
    const problems: string[] = [];
    for (const f of files) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        problems.push(`"${f.name}" não é um arquivo aceito. Use apenas JPG, JPEG, PNG ou WebP.`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        problems.push(`"${f.name}" é maior que o limite de 50 MB.`);
        continue;
      }
      accepted.push({
        file: f,
        previewUrl: URL.createObjectURL(f),
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
    }
    if (accepted.length) {
      setItems((prev) => {
        if (prev.length === 0) setActiveIndex(0);
        return [...prev, ...accepted];
      });
    }
    if (problems.length) setError(problems.join(" "));
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      const next = prev.filter((i) => i.id !== id);
      if (activeIndex >= next.length) setActiveIndex(Math.max(0, next.length - 1));
      return next;
    });
  };

  const clearAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setItems([]);
    setResults([]);
    setActiveIndex(0);
    setError("");
    setZipState("idle");
  };

  const pointerPct = (clientX: number, clientY: number) => {
    const bounds = containerRef.current!.getBoundingClientRect();
    return {
      px: ((clientX - bounds.left) / bounds.width) * 100,
      py: ((clientY - bounds.top) / bounds.height) * 100,
    };
  };

  const startDrag = (mode: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, rect };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onDragMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !containerRef.current) return;
    const start = drag.rect;

    if (drag.mode === "move") {
      const bounds = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - drag.startX) / bounds.width) * 100;
      const dy = ((e.clientY - drag.startY) / bounds.height) * 100;
      setRect({
        ...start,
        x: clamp(start.x + dx, 0, 100 - start.w),
        y: clamp(start.y + dy, 0, 100 - start.h),
      });
      return;
    }

    // Corner resize
    const { px, py } = pointerPct(e.clientX, e.clientY);
    const anchorX = drag.mode === "nw" || drag.mode === "sw" ? start.x + start.w : start.x;
    const anchorY = drag.mode === "nw" || drag.mode === "ne" ? start.y + start.h : start.y;
    const rawW = Math.abs(px - anchorX);
    const rawH = Math.abs(py - anchorY);

    let w = rawW;
    let h = rawH;
    if (k) {
      const wFromX = rawW;
      const wFromY = rawH * k;
      w = Math.max(wFromX, wFromY);
      h = w / k;
    }

    // Clamp inside image bounds, keeping the ratio
    const availLeft = anchorX;
    const availRight = 100 - anchorX;
    const availTop = anchorY;
    const availBottom = 100 - anchorY;
    const maxWAvail = Math.max(availLeft, availRight);
    const maxHAvail = Math.max(availTop, availBottom);

    if (w > maxWAvail) {
      w = maxWAvail;
      h = k ? w / k : h;
    }
    if (h > maxHAvail) {
      h = maxHAvail;
      if (k) w = h * k;
    }
    w = clamp(w, MIN_RECT_PCT, 100);
    h = clamp(h, MIN_RECT_PCT, 100);
    if (k) h = w / k;

    const x2 = drag.mode === "nw" || drag.mode === "sw" ? anchorX - w : anchorX;
    const y2 = drag.mode === "nw" || drag.mode === "ne" ? anchorY - h : anchorY;
    setRect({
      x: clamp(x2, 0, 100 - w),
      y: clamp(y2, 0, 100 - h),
      w,
      h,
    });
  };

  const stopDrag = () => {
    dragRef.current = null;
  };

  const setCropFromPixels = (wpx: number, hpx: number) => {
    if (!natSize.w || !natSize.h) return;
    let wPct = clamp((wpx / natSize.w) * 100, MIN_RECT_PCT, 100 - rect.x);
    let hPct = clamp((hpx / natSize.h) * 100, MIN_RECT_PCT, 100 - rect.y);
    if (k) {
      hPct = wPct / k;
      if (hPct > 100 - rect.y) {
        hPct = 100 - rect.y;
        wPct = hPct * k;
      }
    }
    setRect((r) => ({ ...r, w: wPct, h: hPct }));
  };

  const rotate = async () => {
    if (!active || rotating) return;
    setRotating(true);
    setError("");
    try {
      const bitmap = await createImageBitmap(active.file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.height;
      canvas.height = bitmap.width;
      const ctx = canvas.getContext("2d")!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
      bitmap.close();
      const blob = await canvasToBlob(canvas, "image/png");
      const rotated = new File([blob], `${active.file.name.replace(/\.[^.]+$/, "")}.png`, {
        type: "image/png",
      });
      setItems((prev) =>
        prev.map((item, i) => {
          if (i !== activeIndex) return item;
          URL.revokeObjectURL(item.previewUrl);
          return { ...item, file: rotated, previewUrl: URL.createObjectURL(rotated) };
        })
      );
    } catch {
      setError("Não foi possível girar a imagem. Tente novamente.");
    } finally {
      setRotating(false);
    }
  };

  const crop = async () => {
    if (!active) return;
    setLoading(true);
    setError("");
    try {
      const cropRect = { x: rect.x / 100, y: rect.y / 100, w: rect.w / 100, h: rect.h / 100 };
      const keepTransparency = active.file.type === "image/png" || active.file.type === "image/webp";
      const result = await processFile(
        active.file,
        (canvas, bitmap) => {
          const sx = Math.min(Math.round(bitmap.width * cropRect.x), bitmap.width - 1);
          const sy = Math.min(Math.round(bitmap.height * cropRect.y), bitmap.height - 1);
          const sw = Math.max(1, Math.min(Math.round(bitmap.width * cropRect.w), bitmap.width - sx));
          const sh = Math.max(1, Math.min(Math.round(bitmap.height * cropRect.h), bitmap.height - sy));
          canvas.width = sw;
          canvas.height = sh;
          const ctx = canvas.getContext("2d")!;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
        },
        keepTransparency ? "image/png" : "image/jpeg",
        0.95
      );
      setResults((prev) => [...prev, result]);
      // Advance to the next image, if any
      if (activeIndex < items.length - 1) setActiveIndex(activeIndex + 1);
    } catch {
      setError("Não foi possível cortar a imagem. Ajuste a área e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!results.length) return;
    setZipState("preparing");
    setError("");
    try {
      const blob = await createZipBlob(results);
      if (zipUrl) URL.revokeObjectURL(zipUrl);
      const url = URL.createObjectURL(blob);
      setZipUrl(url);
      setZipState("done");
      downloadBlob(blob, zipName);
    } catch {
      setError("Não foi possível criar o arquivo ZIP. Tente novamente.");
      setZipState("idle");
    }
  };

  return (
    <ToolPageLayout
      title="Cortador de imagens"
      description="Recorte suas imagens com área interativa: arraste, redimensione pelos cantos ou informe o tamanho exato. Proporções prontas para Instagram e Stories, com opção de girar em 90 graus."
      icon={<Crop className="h-6 w-6" />}
      howTo={[
        "Selecione uma ou mais imagens e clique na miniatura da que deseja cortar.",
        "Escolha a proporção, arraste a área de corte e redimensione pelos cantos ou informe a largura e a altura em pixels.",
        "Clique em Cortar para guardar o recorte; repita para cada imagem e baixe individualmente ou em ZIP.",
      ]}
    >
      <FileDropZone onFiles={addFiles} accept="image/jpeg,image/png,image/webp" />

      <button
        onClick={() => inputRef.current?.click()}
        className="text-sm font-medium text-violet-600 transition hover:text-violet-700"
      >
        + Adicionar mais imagens
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
        className="hidden"
        aria-label="Adicionar mais imagens"
      />

      {error && <ErrorBanner message={error} />}

      {items.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              Imagens <span className="font-normal text-slate-500">({items.length})</span>
            </h2>
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Limpar tudo
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setActiveIndex(i)}
                className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                  i === activeIndex
                    ? "border-violet-600 ring-2 ring-violet-200"
                    : "border-slate-200 hover:border-violet-300"
                }`}
                aria-label={`Editar ${item.file.name}`}
              >
                <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && removeItem(item.id)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow transition hover:text-red-600"
                  aria-label={`Remover ${item.file.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {active && (
        <section className="space-y-4 rounded-2xl border border-slate-200 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => setPresetKey(p.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  presetKey === p.key
                    ? "bg-violet-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-violet-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative mx-auto max-w-2xl select-none overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <img
              src={active.previewUrl}
              alt={active.file.name}
              className="block w-full"
              draggable={false}
              onLoad={(e) =>
                setNatSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
              }
            />
            <div
              role="button"
              tabIndex={0}
              aria-label="Área de recorte — arraste para posicionar"
              onPointerDown={startDrag("move")}
              onPointerMove={onDragMove}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 5 : 1;
                if (e.key === "ArrowLeft") setRect((r) => ({ ...r, x: clamp(r.x - step, 0, 100 - r.w) }));
                else if (e.key === "ArrowRight") setRect((r) => ({ ...r, x: clamp(r.x + step, 0, 100 - r.w) }));
                else if (e.key === "ArrowUp") setRect((r) => ({ ...r, y: clamp(r.y - step, 0, 100 - r.h) }));
                else if (e.key === "ArrowDown") setRect((r) => ({ ...r, y: clamp(r.y + step, 0, 100 - r.h) }));
              }}
              className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
              style={{
                left: `${rect.x}%`,
                top: `${rect.y}%`,
                width: `${rect.w}%`,
                height: `${rect.h}%`,
                touchAction: "none",
              }}
            >
              {handles.map((h) => (
                <span
                  key={h.id}
                  role="button"
                  tabIndex={-1}
                  aria-label={`Redimensionar canto ${h.id}`}
                  onPointerDown={startDrag(h.id)}
                  onPointerMove={onDragMove}
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                  className="absolute h-5 w-5 rounded-full border-2 border-violet-600 bg-white shadow"
                  style={{ ...h.style, cursor: h.cursor, touchAction: "none" }}
                />
              ))}
              <span className="absolute -top-7 left-0 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                {cropWpx} × {cropHpx} px
              </span>
            </div>
            {rotating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="crop-w" className="text-sm font-medium text-slate-700">Largura do corte (px)</label>
              <input
                id="crop-w"
                type="number"
                min={1}
                value={cropWpx || ""}
                onChange={(e) => setCropFromPixels(Number(e.target.value), cropHpx)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div>
              <label htmlFor="crop-h" className="text-sm font-medium text-slate-700">Altura do corte (px)</label>
              <input
                id="crop-h"
                type="number"
                min={1}
                value={cropHpx || ""}
                onChange={(e) => setCropFromPixels(cropWpx, Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={rotate}
              disabled={rotating}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-300 disabled:opacity-50"
            >
              <RotateCw className="h-4 w-4" />
              Girar 90°
            </button>
            <button
              onClick={() => setRect(defaultRect(k))}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-300"
            >
              <Undo2 className="h-4 w-4" />
              Redefinir corte
            </button>
          </div>

          <p className="text-center text-xs text-slate-500">
            Arraste a área (ou use as setas do teclado) e redimensione pelos cantos. O recorte respeita exatamente a área
            selecionada.
          </p>

          <button
            onClick={crop}
            disabled={loading || rotating || rect.w <= 0 || rect.h <= 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crop className="h-5 w-5" />}
            {loading ? "Cortando…" : "Cortar imagem"}
          </button>
        </section>
      )}

      <ResultsGrid
        results={results}
        onRemove={(id) => setResults((prev) => prev.filter((r) => r.id !== id))}
      />

      {results.length > 1 && (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Package className="h-6 w-6" />
          </span>
          <p className="text-sm text-slate-600">
            Baixe os {results.length} recortes ({formatBytes(results.reduce((s, r) => s + r.newSize, 0))}) em um único
            arquivo ZIP.
          </p>
          <button
            onClick={handleDownloadZip}
            disabled={zipState === "preparing"}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
          >
            {zipState === "preparing" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Preparando ZIP…
              </>
            ) : zipState === "done" ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Baixar ZIP novamente
              </>
            ) : (
              <>
                <Package className="h-5 w-5" />
                Baixar todas em ZIP
              </>
            )}
          </button>
        </section>
      )}
      <RelatedTools current="/cortar-imagens" />
    </ToolPageLayout>
  );
}
