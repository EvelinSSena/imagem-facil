import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Package, Minimize2, Trash2 } from "lucide-react";
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

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

type OutputFormat = "image/jpeg" | "image/webp" | "image/png";

const formatOptions: { value: OutputFormat; label: string; ext: string }[] = [
  { value: "image/jpeg", label: "JPG", ext: "jpg" },
  { value: "image/webp", label: "WebP (menor arquivo)", ext: "webp" },
  { value: "image/png", label: "PNG (sem perdas)", ext: "png" },
];

function describeFileError(reason: "type" | "size", fileName: string): string {
  if (reason === "type")
    return `"${fileName}" não é um arquivo aceito. Use apenas JPG, JPEG, PNG ou WebP.`;
  return `"${fileName}" é maior que o limite de 50 MB.`;
}

export function CompressorPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [quality, setQuality] = useState(70);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [progress, setProgress] = useState(0);
  const [zipState, setZipState] = useState<"idle" | "preparing" | "done">("idle");
  const [zipUrl, setZipUrl] = useState("");
  const zipName = "imagem-facil-comprimidas.zip";
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: File[]) => {
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
      accepted.push({
        file: f,
        previewUrl: URL.createObjectURL(f),
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
    }
    if (accepted.length) setItems((prev) => [...prev, ...accepted]);
    setError(problems.join(" "));
    if (problems.length && !accepted.length) setSummary("");
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
    setSummary("");
    setProgress(0);
    setZipState("idle");
  };

  const compress = async () => {
    if (!items.length) return;
    setLoading(true);
    setError("");
    setSummary("");
    setProgress(0);
    setZipState("idle");
    try {
      const totalBefore = items.reduce((s, i) => s + i.file.size, 0);
      const processed: ProcessedResult[] = [];
      for (let i = 0; i < items.length; i++) {
        processed.push(
          await processFile(
            items[i].file,
            (canvas, bitmap) => {
              canvas.width = bitmap.width;
              canvas.height = bitmap.height;
              canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
            },
            outputFormat,
            outputFormat === "image/png" ? undefined : quality / 100
          )
        );
        setProgress(Math.round(((i + 1) / items.length) * 100));
      }
      const totalAfter = processed.reduce((s, r) => s + r.newSize, 0);
      setResults(processed);
      if (totalAfter < totalBefore) {
        const saved = Math.round((1 - totalAfter / totalBefore) * 100);
        setSummary(
          `${items.length} ${items.length === 1 ? "imagem comprimida" : "imagens comprimidas"}: ${formatBytes(
            totalBefore
          )} → ${formatBytes(totalAfter)}. Você economizou ${formatBytes(totalBefore - totalAfter)} (${saved}% menos).`
        );
      } else {
        setSummary(
          "Processamento concluído. Os arquivos já estavam bem otimizados — para reduzir mais, diminua a qualidade ou escolha WebP."
        );
      }
    } catch {
      setError(
        "Não foi possível comprimir uma ou mais imagens. Verifique se os arquivos estão íntegros e tente novamente."
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

  const totalOriginal = items.reduce((s, i) => s + i.file.size, 0);
  const totalCompressed = results.reduce((s, r) => s + r.newSize, 0);

  return (
    <ToolPageLayout
      title="Compressor de imagens"
      description="Reduza o tamanho das suas imagens mantendo a melhor qualidade possível. Ideal para sites, lojas virtuais e envio por e-mail."
      icon={<Minimize2 className="h-6 w-6" />}
      howTo={[
        "Selecione ou arraste uma ou mais imagens (JPG, PNG ou WebP).",
        "Escolha a qualidade desejada (quanto menor, menor o arquivo) e o formato de saída.",
        "Clique em Comprimir e baixe as imagens individualmente ou todas em um ZIP.",
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
                <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-600 opacity-0 shadow transition hover:text-red-600 group-hover:opacity-100"
                  aria-label={`Remover ${item.file.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-center text-[10px] text-white">
                  {formatBytes(item.file.size)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-right text-xs text-slate-500">
            Total: {formatBytes(totalOriginal)}
          </p>
        </section>
      )}

      <section className="space-y-4 rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900">Opções de compressão</h2>

        <div>
          <label htmlFor="quality" className="flex items-center justify-between text-sm font-medium text-slate-700">
            Qualidade
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">{quality}%</span>
          </label>
          <input
            id="quality"
            type="range"
            min={10}
            max={100}
            step={5}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="mt-2 w-full accent-violet-600"
          />
          <p className="mt-1 text-xs text-slate-500">50–80% é recomendado para a maioria dos casos.</p>
        </div>

        <div>
          <span className="text-sm font-medium text-slate-700">Formato de saída</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {formatOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setOutputFormat(opt.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  outputFormat === opt.value
                    ? "bg-violet-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-violet-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2" role="status" aria-live="polite">
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                Comprimindo {Math.max(1, Math.ceil((progress / 100) * items.length))} de {items.length}…
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
            onClick={compress}
            disabled={!items.length}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Minimize2 className="h-5 w-5" />
            Comprimir {items.length || ""} {items.length === 1 ? "imagem" : "imagens"}
          </button>
        )}
      </section>

      {summary && !error && results.length > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {summary}
        </div>
      )}

      <ResultsGrid results={results} onRemove={(id) => setResults((prev) => prev.filter((r) => r.id !== id))} />

      {results.length > 1 && (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Package className="h-6 w-6" />
          </span>
          <p className="text-sm text-slate-600">
            Baixe as {results.length} imagens comprimidas ({formatBytes(totalCompressed)}) em um único arquivo ZIP.
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
      <RelatedTools current="/comprimir-imagens" />
    </ToolPageLayout>
  );
}
