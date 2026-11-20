import { Link } from "react-router-dom";
import { Target, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sobre nós</h1>

      <p className="mt-4 text-lg leading-relaxed text-slate-600">
        O <strong className="text-slate-900">Imagem Fácil</strong> nasceu de uma ideia simples: editar e otimizar
        imagens não deveria exiger programas caros, cadastros complicados ou enviar seus arquivos pessoais para
        servidores desconhecidos.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Target className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-semibold text-slate-900">Nossa missão</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Colocar ferramentas de imagem profissionais ao alcance de qualquer pessoa, de graça e em poucos cliques —
            do estudante ao lojista.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-semibold text-slate-900">Privacidade em primeiro lugar</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Todo o processamento acontece no seu próprio navegador. Suas imagens nunca são enviadas para nenhum
            servidor — nem pelas nossas mãos.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Sparkles className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-semibold text-slate-900">Simplicidade</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Sem painéis complicados nem opções confusas. Cada ferramenta faz exatamente o que promete, rápido e
            direto.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-semibold text-slate-900">Gratuito para sempre</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Não pedimos cadastro nem cartão de crédito. As ferramentas são gratuitas e ilimitadas para todos.
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl bg-violet-50 p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-900">Pronto para começar?</h2>
        <p className="mt-2 text-sm text-slate-600">Escolha uma ferramenta e otimize sua primeira imagem agora.</p>
        <Link
          to="/comprimir-imagens"
          className="mt-5 inline-flex rounded-xl bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          Usar as ferramentas
        </Link>
      </div>
    </div>
  );
}
