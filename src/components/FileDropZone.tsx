import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
}

export function FileDropZone({
  onFiles,
  accept = "image/*",
  multiple = true,
  disabled = false,
  label = "Arraste suas imagens aqui ou clique para selecionar",
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = "";
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
        dragOver
          ? "border-violet-500 bg-violet-50"
          : "border-violet-200 bg-violet-50/40 hover:border-violet-400 hover:bg-violet-50"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
        <Upload className="h-6 w-6" />
      </div>
      <p className="max-w-sm text-sm font-medium text-slate-700">{label}</p>
      <p className="text-xs text-slate-500">
        {multiple ? "Você pode selecionar várias imagens. " : ""}
        Nada é enviado para servidores — tudo acontece no seu navegador.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleSelect}
        className="hidden"
        aria-label="Selecionar imagens"
      />
    </div>
  );
}

export function RemoveImageButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-red-50 hover:text-red-600"
      aria-label="Remover imagem"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
