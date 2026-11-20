import { useEffect, useRef, useState } from "react";
import { Scan, Trash2, Loader2, Package, CheckCircle2, Link2, Link2Off } from "lucide-react";
import { ToolPageLayout, ErrorBanner } from "@/components/ToolPageLayout";
import { RelatedTools } from "@/components/RelatedTools";
import { FileDropZone } from "@/components/FileDropZone";
import { ResultsGrid } from "@/components/ResultsGrid";
import {
  processFile,
  formatBytes,
  formatDimensions,
  createZipBlob,
  downloadBlob,
  loadBitmap,
  type ProcessedResult,
} from "@/lib/imageUtils";

interface Item {
  file: File;
  previewUrl: string;
  id: string;
  width: number;
  height: number;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_DIMENSION = 10000;

type PresetKey = "custom" | "marketplace" | "ig-square" | "ig-portrait" | "stories";

const presets: { key: PresetKey; label: string; sub: string; w: number; h: number }[] = [
  { key: "marketplace", label: "Marketplace", sub: "1200 × 1200", w: 1200, h: 1200 },
  { key: "ig-square", label: "Instagram quadrado", sub: "1080 × 1080", w: 1080, h: 1080 },
  { key: "ig-portrait", label: "Instagram retrato", sub: "1080 × 1350", w: 1080, h: 1350 },
  { key: "stories", label: "Stories", sub: "1080 × 1920", w: 1080, h: 1920 },
  { key: "custom", label: "Personalizado", sub: "Defina largura e altura", w: 0, h: 0 },
];

function fitInside(iw: number, ih: number, boxW: number, boxH: number) {
  const scale = Math.min(boxW / iw, boxH / ih);
  return { w: Math.max(1, Math.round(iw * scale)), h: Math.max(1, Math.round(ih * scale)) };
}

function describeFileError(reason: "type" | "size", fileName: string): string {
  if (reason === "type")
    return `"${fileName}" não é um arquivo aceito. Use apenas JPG, JPEG, PNG ou WebP.`;
  return `"${fileName}" é maior que o limite de 50 MB.`;
}

export function ResizerPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [presetKey, setPresetKey] = useState<PresetKey>("marketplace");
  const [width, setWidth] = useState("1200");
  const [height, setHeight] = useState("1200");
  const [lockRatio, setLockRatio] = useState(true);
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [zipState, setZipState] = useState<"idle" | "preparing" | "done">("idle");
  const [zipUrl, setZipUrl] = useState("");
  const zipName = "imagem-facil-redimensionadas.zip";
  const inputRef = useRef<HTMLInputElement>(null);

  const first = items[0];
  const isCustom = presetKey === "custom";
  const preset = presets.find((p) => p.key === presetKey)!;
  const boxW = isCustom ? Number(width) : preset.w;
  const boxH = isCustom ? Number(height) : preset.h;

  useEffect(() => {
    if (isCustom && first) {
      setWidth(String(first.width));
      setHeight(String(first.height));
    }
  }, [presetKey, isCustom, first]);

  const addFiles = async (files: File[]) => {
    setError("");
    const accepted: Item[] = [];
    const problems: string[] = [];
    for (const f of files) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        problems.push(describeFileError("type", f.name));
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        problems.push(describeFileError("size", f.name));
        continue;
      }
      try {
        const bitmap = await loadBitmap(f);
        accepted.push({
          file: f,
          previewUrl: URL.createObjectURL(f),
          id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          width: bitmap.width,
          height: bitmap.height,
        });
        bitmap.close();
      } catch {
        problems.push(`Não foi possível ler o arquivo "${f.name}".`);
      }
    }
    if (accepted.length) setItems((prev) => [...prev, ...accepted]);
    if (problems.length) setError(problems.join(" "));
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setItems([]);
    setResults([]);
    setError("");
    setProgress(0);
    setZipState("idle");
  };

  // Applies the ratio lock only in custom mode (presets use "fit inside" instead)
  const handleWidthChange = (value: string) => {
    setWidth(value);
    if (lockRatio && first && value) {
      const w = Number(value);
      if (w > 0) setHeight(String(Math.round((first.height / first.width) * w)));
    }
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    if (lockRatio && first && value) {
      const h = Number(value);
      if (h > 0) setWidth(String(Math.round((first.width / first.height) * h)));
    }
  };

  const finalSizeFor = (item: Item) => {
    if (!boxW || !boxH) return null;
    if (!lockRatio || isCustom) {
      return { w: boxW, h: boxH, locked: lockRatio && !isCustom };
    }
    const fitted = fitInside(item.width, item.height, boxW, boxH);
    return { w: fitted.w, h: fitted.h, locked: true };
  };

  const validate = (): string => {
    if (!items.length) return "Selecione pelo menos uma imagem.";
    if (!boxW || !boxH || boxW < 1 || boxH < 1 || boxW > MAX_DIMENSION || boxH > MAX_DIMENSION)
      return `Informe dimensões entre 1 e ${MAX_DIMENSION} pixels.`;
    return "";
  };

  const resize = async () => {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setLoading(true);
    setError("");
    setProgress(0);
    setZipState("idle");
    try {
      const processed: ProcessedResult[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let tw: number;
        let th: number;
        if (lockRatio && !isCustom) {
          const fitted = fitInside(item.width, item.height, boxW, boxH);
          tw = fitted.w;
          th = fitted.h;
        } else {
          tw = boxW;
          th = boxH;
        }
        const keepTransparency = item.file.type === "image/png" || item.file.type === "image/webp";
        processed.push(
          await processFile(
            item.file,
            (canvas, bitmap) => {
              canvas.width = tw;
              canvas.height = th;
              const ctx = canvas.getContext("2d")!;
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = "high";
              if (!keepTransparency) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, tw, th);
              }
              ctx.drawImage(bitmap, 0, 0, tw, th);
            },
            keepTransparency ? "image/png" : "image/jpeg",
            0.92
          )
        );
        setProgress(Math.round(((i + 1) / items.length) * 100));
      }
      setResults(processed);
    } catch {
      setError("Não foi possível redimensionar uma ou mais imagens. Verifique os arquivos e tente novamente.");
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

  const preview = first ? finalSizeFor(first) : null;

  return (
    <ToolPageLayout
      title="Redimensionador de imagens"
      description="Altere as dimensões das suas imagens com tamanhos predefinidos para Marketplace e Instagram ou em pixels personalizados, sempre sem distorção quando a proporção estiver ativa."
      icon={<Scan className="h-6 w-6" />}
      howTo={[
        "Selecione ou arraste as imagens (JPG, PNG ou WebP).",
        "Escolha um tamanho predefinido ou informe largura e altura em pixels.",
        "Clique em Redimensionar e baixe as imagens individualmente ou em ZIP.",
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
              Imagens selecionadas <span className="font-normal text-slate-500">({items.length})</span>
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
            {items.map((item) => {
              const size = finalSizeFor(item);
              return (
                <div
                  key={item.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-600 opacity-0 shadow transition hover:text-red-600 group-hover:opacity-100"
                    aria-label={`Remover ${item.file.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-center text-[10px] text-white">
                    {size ? `${formatDimensions(item.width, item.height)} → ${formatDimensions(size.w, size.h)}` : formatDimensions(item.width, item.height)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900">Tamanho final</h2>

        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => setPresetKey(p.key)}
              className={`rounded-xl border-2 px-4 py-2.5 text-left transition ${
                presetKey === p.key
                  ? "border-violet-600 bg-violet-50"
                  : "border-slate-200 bg-white hover:border-violet-300"
              }`}
            >
              <span className={`block text-sm font-bold ${presetKey === p.key ? "text-violet-700" : "text-slate-900"}`}>
                {p.label}
              </span>
              <span className="block text-xs text-slate-500">{p.sub}</span>
            </button>
          ))}
        </div>

        {isCustom ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="w" className="text-sm font-medium text-slate-700">Largura (px)</label>
                <input
                  id="w"
                  type="number"
                  min={1}
                  max={MAX_DIMENSION}
                  value={width}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  placeholder="Ex.: 1200"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label htmlFor="h" className="text-sm font-medium text-slate-700">Altura (px)</label>
                <input
                  id="h"
                  type="number"
                  min={1}
                  max={MAX_DIMENSION}
                  value={height}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  placeholder="Ex.: 800"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setLockRatio(true)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  lockRatio ? "bg-violet-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-violet-300"
                }`}
              >
                <Link2 className="h-4 w-4" />
                Manter proporção
              </button>
              <button
                onClick={() => setLockRatio(false)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  !lockRatio ? "bg-violet-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-violet-300"
                }`}
              >
                <Link2Off className="h-4 w-4" />
                Redimensionamento livre
              </button>
            </div>
            {lockRatio && items.length > 1 && (
              <p className="text-xs text-slate-500">
                Com a proporção ativa, cada imagem é redimensionada a partir das suas próprias dimensões originais.
              </p>
            )}
          </div>
        ) : (
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={lockRatio}
              onChange={(e) => setLockRatio(e.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            Ajustar mantendo a proporção, sem distorcer (recomendado)
          </label>
        )}

        {preview && (
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Pré-visualização do tamanho:</span>{" "}
            {formatDimensions(first.width, first.height)} → {formatDimensions(preview.w, preview.h)}
            {items.length > 1 && " (as demais imagens seguem a mesma regra, cada uma a partir do seu tamanho original)"}
          </div>
        )}

        {loading ? (
          <div className="space-y-2" role="status" aria-live="polite">
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                Redimensionando {Math.max(1, Math.ceil((progress / 100) * items.length))} de {items.length}…
              </span>
              <span className="text-violet-700">{progress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-violet-100">
              <div
                className="h-full rounded-full bg-violet-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={resize}
            disabled={!items.length}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Scan className="h-5 w-5" />
            Redimensionar {items.length || ""} {items.length === 1 ? "imagem" : "imagens"}
          </button>
        )}
      </section>

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
            Baixe as {results.length} imagens redimensionadas em um único arquivo ZIP.
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
      <RelatedTools current="/redimensionar-imagens" />
    </ToolPageLayout>
  );
}
