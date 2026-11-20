import { Link } from "react-router-dom";
import { Minimize2, FileImage, Scan, Crop, FileText, ArrowRight } from "lucide-react";

const relatedLinks = [
  { to: "/comprimir-imagens", icon: Minimize2, label: "Comprimir imagens" },
  { to: "/converter-imagens", icon: FileImage, label: "Converter JPG, PNG e WebP" },
  { to: "/redimensionar-imagens", icon: Scan, label: "Redimensionar imagens" },
  { to: "/cortar-imagens", icon: Crop, label: "Cortar imagens" },
  { to: "/imagem-para-pdf", icon: FileText, label: "Imagem para PDF" },
];

export function RelatedTools({ current }: { current: string }) {
  const others = relatedLinks.filter((l) => l.to !== current);
  return (
    <section className="mt-12 rounded-2xl border border-slate-200 p-6" aria-labelledby="related-tools-title">
      <h2 id="related-tools-title" className="text-lg font-semibold text-slate-900">
        Ferramentas relacionadas
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {others.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:border-violet-300 hover:bg-violet-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <l.icon className="h-4 w-4" />
              </span>
              <span className="flex-1 text-sm font-medium text-slate-700 group-hover:text-violet-700">
                {l.label}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
