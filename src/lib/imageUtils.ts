export interface ProcessedResult {
  id: string;
  name: string;
  outputName: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  originalSize: number;
  newSize: number;
  originalWidth: number;
  originalHeight: number;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function loadBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

export async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao processar a imagem."));
      },
      type,
      quality
    );
  });
}

export async function processFile(
  file: File,
  transform: (canvas: HTMLCanvasElement, bitmap: ImageBitmap) => void,
  mimeType: string,
  quality?: number,
  outputName?: string
): Promise<ProcessedResult> {
  const bitmap = await loadBitmap(file);
  const canvas = document.createElement("canvas");
  transform(canvas, bitmap);
  const blob = await canvasToBlob(canvas, mimeType, quality);
  const { width, height } = canvas;

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const name = outputName ?? `${baseName}.${ext}`;

  return {
    id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    outputName: name,
    blob,
    url: URL.createObjectURL(blob),
    width,
    height,
    originalSize: file.size,
    newSize: blob.size,
    originalWidth: bitmap.width,
    originalHeight: bitmap.height,
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function downloadAllAsZip(results: ProcessedResult[]): Promise<void> {
  // Simulates a sequential download of all files, respecting browser limits
  for (const r of results) {
    downloadBlob(r.blob, r.outputName);
    await new Promise((res) => setTimeout(res, 300));
  }
}

export async function createZipBlob(results: ProcessedResult[]): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const usedNames = new Set<string>();
  for (const r of results) {
    let name = r.outputName;
    let n = 1;
    while (usedNames.has(name)) {
      const dot = r.outputName.lastIndexOf(".");
      name = `${r.outputName.slice(0, dot)}-${n}${r.outputName.slice(dot)}`;
      n++;
    }
    usedNames.add(name);
    zip.file(name, r.blob);
  }
  return zip.generateAsync({ type: "blob" });
}

export function formatDimensions(w: number, h: number): string {
  return `${w} × ${h}`;
}
