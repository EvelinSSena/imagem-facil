import { useRef, useState } from "react";
import { FileImage, Trash2, Loader2, Package, CheckCircle2 } from "lucide-react";
import { ToolPageLayout, ErrorBanner } from "@/components/ToolPageLayout";
import { RelatedTools } from "@/components/RelatedTools";
import { FileDropZone } from "@/components/FileDropZone";
import { ResultsGrid } from "@/components/ResultsGrid";
import {
  processFile,
  formatBytes,
  createZipBlob,
  downloadBlob,
  type ProcessedResult,
} from "@/lib/imageUtils";

interface Item {
  file: File;
  previewUrl: string;
  id: string;
}

type TargetFormat = "image/jpeg" | "image/png" | "image/webp";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const formatInfo: Record<TargetFormat, { label: string; ext: string; note: string }> = {
  "image/jpeg": { label: "JPG", ext: "jpg", note: "Compacto, ideal para fotos" },
  "image/png": { label: "PNG", ext: "png", note: "Suporta transparência" },
  "image/webp": { label: "WebP", ext: "webp", note: "Moderno, menor tamanho" },
};

function originalFormatLabel(file: File): string {
  if (file.type === "image/png") return "PNG";
  if (file.type === "image/webp") return "WebP";
  if (file.type === "image/jpeg") return "JPG";
  return file.type || "Desconhecido";
}

export function ConverterPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [target, setTarget] = useState<TargetFormat>("image/webp");
  const [quality, setQuality] = useState(90);
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [zipState, setZipState] = useState<"idle" | "preparing" | "done">("idle");
  const [zipUrl, setZipUrl] = useState("");
  const zipName = "imagem-facil-convertidas.zip";
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: File[]) => {
    setError("");
    const accepted: Item[] = [];
    const problems: string[] = [];
    for (const f of files) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        problems.push(
          `"${f.name}" não é um arquivo aceito. Use apenas JPG, JPEG, PNG ou WebP.`
        );
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

  const convert = async () => {
    if (!items.length) return;
    setLoading(true);
    setError("");
    setProgress(0);
    setZipState("idle");
    try {
      const processed: ProcessedResult[] = [];
      for (let i = 0; i < items.length; i++) {
        processed.push(
          await processFile(
            items[i].file,
            (canvas, bitmap) => {
              canvas.width = bitmap.width;
              canvas.height = bitmap.height;
              const ctx = canvas.getContext("2d")!;
              if (target === "image/jpeg") {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
              ctx.drawImage(bitmap, 0, 0);
            },
            target,
            target === "image/png" ? undefined : quality / 100
          )
        );
        setProgress(Math.round(((i + 1) / items.length) * 100));
      }
      setResults(processed);
    } catch {
      setError(
        "Não foi possível converter uma ou mais imagens. Verifique se os arquivos estão íntegros e tente novamente."
      );
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

  const convertedCount = results.length;

  return (
    <ToolPageLayout
      title="Conversor JPG, PNG e WebP"
      description="Converta suas imagens entre os formatos JPG, PNG e WebP com controle de qualidade. A transparência é preservada em PNG e WebP; ao converter para JPG, o fundo transparente recebe branco."
      icon={<FileImage className="h-6 w-6" />}
      howTo={[
        "Selecione ou arraste as imagens que deseja converter (JPG, PNG ou WebP).",
        "Escolha o formato de saída: JPG, PNG ou WebP.",
        "Ajuste a qualidade (exceto PNG), clique em Converter e baixe os resultados individualmente ou em ZIP.",
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
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
              >
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="h-full w-full object-cover"
                  style={{ backgroundColor: "#ffffff" }}
                />
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-600 opacity-0 shadow transition hover:text-red-600 group-hover:opacity-100"
                  aria-label={`Remover ${item.file.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-center text-[10px] text-white">
                  {originalFormatLabel(item.file)} · {formatBytes(item.file.size)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900">Converter para</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(formatInfo) as TargetFormat[]).map((key) => {
            const info = formatInfo[key];
            const selected = target === key;
            return (
              <button
                key={key}
                onClick={() => setTarget(key)}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  selected
                    ? "border-violet-600 bg-violet-50"
                    : "border-slate-200 bg-white hover:border-violet-300"
                }`}
              >
                <span className={`block text-base font-bold ${selected ? "text-violet-700" : "text-slate-900"}`}>
                  {info.label}
                </span>
                <span className="mt-1 block text-xs text-slate-500">{info.note}</span>
              </button>
            );
          })}
        </div>

        {target !== "image/png" && (
          <div>
            <label htmlFor="conv-quality" className="flex items-center justify-between text-sm font-medium text-slate-700">
              Qualidade
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">{quality}%</span>
            </label>
            <input
              id="conv-quality"
              type="range"
              min={10}
              max={100}
              step={5}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="mt-2 w-full accent-violet-600"
            />
          </div>
        )}

        {loading ? (
          <div className="space-y-2" role="status" aria-live="polite">
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                Convertendo {Math.max(1, Math.ceil((progress / 100) * items.length))} de {items.length}…
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
            onClick={convert}
            disabled={!items.length}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <FileImage className="h-5 w-5" />
            Converter {items.length || ""} {items.length === 1 ? "imagem" : "imagens"} para {formatInfo[target].label}
          </button>
        )}
      </section>

      <ResultsGrid
        results={results}
        onRemove={(id) => setResults((prev) => prev.filter((r) => r.id !== id))}
      />

      {convertedCount > 1 && (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Package className="h-6 w-6" />
          </span>
          <p className="text-sm text-slate-600">
            Baixe as {convertedCount} imagens convertidas para {formatInfo[target].label} em um único arquivo ZIP.
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
      <RelatedTools current="/converter-imagens" />
    </ToolPageLayout>
  );
}
