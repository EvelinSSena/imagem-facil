import { ReactNode, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Image, Menu, X } from "lucide-react";

const navItems = [
  { to: "/comprimir-imagens", label: "Comprimir" },
  { to: "/converter-imagens", label: "Converter" },
  { to: "/redimensionar-imagens", label: "Redimensionar" },
  { to: "/cortar-imagens", label: "Cortar" },
  { to: "/imagem-para-pdf", label: "PDF" },
];

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo principal
      </a>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Image className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Imagem <span className="text-violet-600">Fácil</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Ferramentas">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-violet-100 text-violet-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden" aria-label="Ferramentas">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? "bg-violet-50 text-violet-700" : "text-slate-700 hover:bg-slate-50"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main id="conteudo-principal" className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
            <div className="max-w-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
                  <Image className="h-4 w-4" />
                </span>
                <span className="font-bold text-slate-900">Imagem Fácil</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Ferramentas gratuitas para editar e otimizar imagens direto no seu navegador. Sem cadastro, sem envio de arquivos.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
              <Link to="/sobre" className="text-slate-600 hover:text-violet-600">Sobre nós</Link>
              <Link to="/contato" className="text-slate-600 hover:text-violet-600">Contato</Link>
              <Link to="/politica-de-privacidade" className="text-slate-600 hover:text-violet-600">Privacidade</Link>
              <Link to="/termos-de-uso" className="text-slate-600 hover:text-violet-600">Termos de uso</Link>
            </div>
          </div>
          <p className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-500">
            © {new Date().getFullYear()} Imagem Fácil. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
