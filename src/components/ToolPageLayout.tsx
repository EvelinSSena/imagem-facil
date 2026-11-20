import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Image, ShieldCheck, Zap, Lock } from "lucide-react";

export function ToolPageLayout({
  title,
  description,
  icon,
  children,
  howTo,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  howTo: string[];
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-slate-500" aria-label="Navegação">
        <Link to="/" className="hover:text-violet-600">Início</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-700">{title}</span>
      </nav>

      <header className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-slate-600">{description}</p>
        </div>
      </header>

      <div className="space-y-8">{children}</div>

      {howTo.length > 0 && (
        <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Como usar</h2>
          <ol className="mt-4 space-y-3">
            {howTo.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
          <Lock className="h-5 w-5 shrink-0 text-violet-600" />
          <p className="text-sm text-slate-600">100% no navegador, sem envio para servidores</p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
          <Zap className="h-5 w-5 shrink-0 text-violet-600" />
          <p className="text-sm text-slate-600">Processamento rápido, sem fila nem limites</p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-violet-600" />
          <p className="text-sm text-slate-600">Gratuito e sem cadastro</p>
        </div>
      </section>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
      {message}
    </div>
  );
}

export function ProcessButton({
  onClick,
  loading,
  disabled,
  label,
}: {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {loading ? (
        <>
          <LoaderIcon />
          Processando…
        </>
      ) : (
        <>
          <Image className="h-5 w-5" />
          {label}
        </>
      )}
    </button>
  );
}

function LoaderIcon() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
