import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { formatBytes, formatDimensions, downloadBlob, downloadAllAsZip, type ProcessedResult } from "@/lib/imageUtils";
import { useState } from "react";

interface ResultsGridProps {
  results: ProcessedResult[];
  onRemove?: (id: string) => void;
}

export function ResultsGrid({ results, onRemove }: ResultsGridProps) {
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      await downloadAllAsZip(results);
    } finally {
      setDownloadingAll(false);
    }
  };

  if (!results.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">
          Resultados <span className="text-slate-500">({results.length})</span>
        </h3>
        {results.length > 1 && (
          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100 disabled:opacity-60"
          >
            {downloadingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Baixar todos
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => {
          const delta = r.originalSize > 0 ? Math.round((1 - r.newSize / r.originalSize) * 100) : 0;
          const changed = r.width !== r.originalWidth || r.height !== r.originalHeight;
          return (
            <div
              key={r.id}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative flex h-44 items-center justify-center overflow-hidden bg-slate-50">
                <img src={r.url} alt={r.outputName} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="space-y-2 p-4">
                <p className="truncate text-sm font-medium text-slate-900" title={r.outputName}>
                  {r.outputName}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDimensions(r.width, r.height)} · {formatBytes(r.newSize)}
                  {r.originalSize > 0 && r.newSize < r.originalSize && (
                    <span className="ml-1 font-medium text-green-600">−{delta}%</span>
                  )}
                  {changed && (
                    <span className="ml-1 text-slate-400">
                      (de {formatDimensions(r.originalWidth, r.originalHeight)})
                    </span>
                  )}
                </p>
                <button
                  onClick={() => downloadBlob(r.blob, r.outputName)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Baixar
                </button>
                {onRemove && (
                  <button
                    onClick={() => onRemove(r.id)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
                  >
                    Remover da lista
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
