import { useState } from "react";
import { FileText, Trash2, Loader2, Download } from "lucide-react";
import jsPDF from "jspdf";
import { ToolPageLayout, ErrorBanner } from "@/components/ToolPageLayout";
import { RelatedTools } from "@/components/RelatedTools";
import { FileDropZone } from "@/components/FileDropZone";
import { loadBitmap, loadImageElement } from "@/lib/imageUtils";

interface Item {
  file: File;
  previewUrl: string;
  id: string;
}

export function PdfPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<"a4" | "letter">("a4");
  const [margin, setMargin] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfName, setPdfName] = useState("imagens.pdf");
  const [error, setError] = useState("");

  const addFiles = (files: File[]) => {
    setError("");
    setPdfUrl("");
    setItems((prev) => [
      ...prev,
      ...files.map((f) => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      })),
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const move = (index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const clearAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setItems([]);
    setPdfUrl("");
    setError("");
  };

  const generate = async () => {
    if (!items.length) return;
    setGenerating(true);
    setError("");
    try {
      const format = pageSize === "a4" ? "a4" : "letter";
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const innerW = pageW - margin * 2;
      const innerH = pageH - margin * 2;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const bitmap = await loadBitmap(item.file);
        const imgEl = await loadImageElement(item.file);
        const scale = Math.min(innerW / imgEl.width, innerH / imgEl.height);
        const w = imgEl.width * scale;
        const h = imgEl.height * scale;
        const x = (pageW - w) / 2;
        const y = (pageH - h) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", x, y, w, h);
        bitmap.close();
      }

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);
      setPdfName("imagem-facil.pdf");
    } catch {
      setError("Não foi possível gerar o PDF. Verifique as imagens e tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ToolPageLayout
      title="Imagem para PDF"
      description="Transforme uma ou várias imagens em um único PDF, com uma página por imagem. A ordem das imagens define a ordem das páginas."
      icon={<FileText className="h-6 w-6" />}
      howTo={[
        "Selecione as imagens na ordem desejada (você pode reordenar depois).",
        "Escolha o tamanho da página e a margem.",
        "Clique em Gerar PDF e baixe o arquivo.",
      ]}
    >
      <FileDropZone onFiles={addFiles} />

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((item, i) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-2">
                <div className="relative aspect-square overflow-hidden rounded border border-slate-100 bg-slate-50">
                  <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-contain" />
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white">{i + 1}</span>
                </div>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="rounded px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
                    aria-label="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    className="rounded px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
                    aria-label="Mover para baixo"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="rounded px-2 py-1 text-xs text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900">Opções do PDF</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pagesize" className="text-sm font-medium text-slate-700">Tamanho da página</label>
            <select
              id="pagesize"
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as "a4" | "letter")}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            >
              <option value="a4">A4</option>
              <option value="letter">Carta (Letter)</option>
            </select>
          </div>
          <div>
            <label htmlFor="margin" className="flex items-center justify-between text-sm font-medium text-slate-700">
              Margem
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">{margin} mm</span>
            </label>
            <input
              id="margin"
              type="range"
              min={0}
              max={30}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="mt-3 w-full accent-violet-600"
            />
          </div>
        </div>
        <button
          onClick={generate}
          disabled={generating || !items.length}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Gerando PDF…
            </>
          ) : (
            <>
              <FileText className="h-5 w-5" />
              Gerar PDF ({items.length} página{items.length === 1 ? "" : "s"})
            </>
          )}
        </button>
      </section>

      {error && <ErrorBanner message={error} />}

      {pdfUrl && !error && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <FileText className="h-7 w-7" />
          </span>
          <div>
            <h3 className="font-semibold text-green-800">PDF pronto!</h3>
            <p className="mt-1 text-sm text-green-700">Seu documento foi criado com {items.length} página{items.length === 1 ? "" : "s"}.</p>
          </div>
          <a
            href={pdfUrl}
            download={pdfName}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            <Download className="h-5 w-5" />
            Baixar PDF
          </a>
        </div>
      )}
      <RelatedTools current="/imagem-para-pdf" />
    </ToolPageLayout>
  );
}
