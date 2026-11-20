import { Link } from "react-router-dom";
import {
  FileImage,
  FileText,
  Minimize2,
  Scan,
  Crop,
  Lock,
  Zap,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const tools = [
  {
    to: "/comprimir-imagens",
    icon: Minimize2,
    title: "Compressor de imagens",
    description: "Reduza o tamanho dos arquivos mantendo a qualidade visual. Perfeito para sites e e-mail.",
  },
  {
    to: "/converter-imagens",
    icon: FileImage,
    title: "Conversor JPG, PNG e WebP",
    description: "Converta entre JPG, PNG e WebP em segundos, com controle de qualidade.",
  },
  {
    to: "/redimensionar-imagens",
    icon: Scan,
    title: "Redimensionador de imagens",
    description: "Ajuste largura e altura em pixels ou porcentagem, mantendo a proporção.",
  },
  {
    to: "/cortar-imagens",
    icon: Crop,
    title: "Cortador de imagens",
    description: "Recorte livre ou use proporções prontas como 1:1, 16:9 e 4:3.",
  },
  {
    to: "/imagem-para-pdf",
    icon: FileText,
    title: "Imagem para PDF",
    description: "Junte várias imagens em um único PDF, uma página por imagem.",
  },
];

const features = [
  { icon: Lock, title: "Privacidade total", text: "Suas imagens nunca saem do seu dispositivo. Todo o processamento acontece no navegador." },
  { icon: Zap, title: "Rápido e ilimitado", text: "Sem filas, sem espera e sem limite de uso. Processe quantas imagens quiser." },
  { icon: ShieldCheck, title: "Sem cadastro", text: "Nada de contas ou e-mails. Abra a ferramenta e use imediatamente, de graça." },
];

export function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-b from-violet-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="inline-block rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-700">
            Grátis · Sem cadastro · 100% no navegador
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Edite e otimize suas imagens de forma <span className="text-violet-600">simples e segura</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Comprima, converta, redimensione, corte e transforme imagens em PDF. Rápido, gratuito e sem enviar
            seus arquivos para nenhum servidor.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/comprimir-imagens"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              Começar agora
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#ferramentas"
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver ferramentas
            </a>
          </div>
        </div>
      </section>

      <section id="ferramentas" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Ferramentas</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Tudo o que você precisa para preparar suas imagens, em um só lugar.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">
                <tool.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{tool.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{tool.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-violet-600">
                Usar ferramenta
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
          <div className="hidden lg:block" />
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="text-center sm:text-left">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600 sm:mx-0">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
