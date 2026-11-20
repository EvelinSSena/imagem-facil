import { useState } from "react";
import { Mail, MapPin, Send, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const update = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    if (!form.name.trim()) return "Informe seu nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Informe um e-mail válido.";
    if (!form.subject.trim()) return "Informe o assunto.";
    if (form.message.trim().length < 10) return "Escreva uma mensagem com pelo menos 10 caracteres.";
    return "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setSending(true);
    setError("");
    const { error: dbError } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setSending(false);
    if (dbError) {
      setError("Não foi possível enviar sua mensagem agora. Tente novamente em instantes.");
      return;
    }
    setSent(true);
  };

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contato</h1>
      <p className="mt-3 text-slate-600">
        Tem uma dúvida, sugestão ou encontrou um problema? Envie sua mensagem — responderemos pelo e-mail informado.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
          <Mail className="h-5 w-5 shrink-0 text-violet-600" />
          <div>
            <p className="text-sm font-medium text-slate-900">E-mail</p>
            <p className="text-sm text-slate-600">contato@imagemfacil.com.br</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
          <MapPin className="h-5 w-5 shrink-0 text-violet-600" />
          <div>
            <p className="text-sm font-medium text-slate-900">Atendimento</p>
            <p className="text-sm text-slate-600">Segunda a sexta, 9h às 18h</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-violet-600" />
          <div>
            <p className="text-sm font-medium text-slate-900">Resposta</p>
            <p className="text-sm text-slate-600">Geralmente em até 2 dias úteis</p>
          </div>
        </div>
      </div>

      {sent ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <h2 className="text-xl font-semibold text-green-800">Mensagem enviada!</h2>
          <p className="text-sm text-green-700">Obrigado pelo contato. Responderemos o mais breve possível.</p>
          <button
            onClick={() => {
              setSent(false);
              setForm({ name: "", email: "", subject: "", message: "" });
            }}
            className="mt-2 rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100"
          >
            Enviar outra mensagem
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 p-6" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-slate-700">Nome *</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={inputClass}
                placeholder="Seu nome"
                maxLength={120}
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-700">E-mail *</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputClass}
                placeholder="voce@exemplo.com"
                maxLength={180}
              />
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="text-sm font-medium text-slate-700">Assunto *</label>
            <input
              id="subject"
              type="text"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              className={inputClass}
              placeholder="Sobre o que você quer falar?"
              maxLength={200}
            />
          </div>
          <div>
            <label htmlFor="message" className="text-sm font-medium text-slate-700">Mensagem *</label>
            <textarea
              id="message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              rows={5}
              className={inputClass}
              placeholder="Escreva sua mensagem aqui…"
              maxLength={3000}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {sending ? "Enviando…" : "Enviar mensagem"}
          </button>
        </form>
      )}
    </div>
  );
}
