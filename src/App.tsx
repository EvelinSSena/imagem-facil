import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { HomePage } from "@/pages/HomePage";

const CompressorPage = lazy(() => import("@/pages/CompressorPage").then((m) => ({ default: m.CompressorPage })));
const ConverterPage = lazy(() => import("@/pages/ConverterPage").then((m) => ({ default: m.ConverterPage })));
const ResizerPage = lazy(() => import("@/pages/ResizerPage").then((m) => ({ default: m.ResizerPage })));
const CropperPage = lazy(() => import("@/pages/CropperPage").then((m) => ({ default: m.CropperPage })));
const PdfPage = lazy(() => import("@/pages/PdfPage").then((m) => ({ default: m.PdfPage })));
const AboutPage = lazy(() => import("@/pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import("@/pages/ContactPage").then((m) => ({ default: m.ContactPage })));
const PrivacyPage = lazy(() => import("@/pages/LegalPages").then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("@/pages/LegalPages").then((m) => ({ default: m.TermsPage })));

const SITE_URL = "https://imagemfacil.com.br";

const pageMeta: Record<
  string,
  { title: string; description: string; ogType?: "website" | "article" }
> = {
  "/": {
    title: "Imagem Fácil — Ferramentas gratuitas para editar e otimizar imagens online",
    description:
      "Comprima, converta, redimensione, corte e transforme imagens em PDF de graça. Processamento 100% no navegador, sem cadastro e sem enviar arquivos para servidores.",
  },
  "/comprimir-imagens": {
    title: "Compressor de imagens online grátis — Imagem Fácil",
    description:
      "Comprima JPG, PNG e WebP reduzindo o tamanho dos arquivos mantendo a qualidade. Grátis, sem cadastro e 100% no seu navegador.",
  },
  "/converter-imagens": {
    title: "Conversor de imagens JPG, PNG e WebP online — Imagem Fácil",
    description:
      "Converta imagens entre JPG, PNG e WebP com controle de qualidade. Ferramenta gratuita que funciona direto no navegador.",
  },
  "/redimensionar-imagens": {
    title: "Redimensionar imagens online grátis — Imagem Fácil",
    description:
      "Redimensione imagens com tamanhos prontos para Marketplace e Instagram ou em pixels personalizados, sem distorção. Grátis e no navegador.",
  },
  "/cortar-imagens": {
    title: "Cortar imagens online grátis — Imagem Fácil",
    description:
      "Corte imagens com área interativa, proporções prontas para Instagram e Stories, e opção de girar em 90 graus. Grátis e direto no navegador.",
  },
  "/imagem-para-pdf": {
    title: "Converter imagens em PDF online grátis — Imagem Fácil",
    description:
      "Junte várias imagens em um único PDF com uma página por imagem. Escolha tamanho de página e margem. Grátis e sem cadastro.",
  },
  "/sobre": { title: "Sobre nós — Imagem Fácil", description: "Conheça o Imagem Fácil: ferramentas gratuitas de edição de imagens que processam tudo no seu navegador." },
  "/contato": { title: "Contato — Imagem Fácil", description: "Fale com a equipe do Imagem Fácil. Dúvidas, sugestões e suporte." },
  "/politica-de-privacidade": { title: "Política de Privacidade — Imagem Fácil", description: "Saiba como o Imagem Fácil trata seus dados. Suas imagens nunca saem do seu navegador." },
  "/termos-de-uso": { title: "Termos de Uso — Imagem Fácil", description: "Termos de uso das ferramentas gratuitas do Imagem Fácil." },
};

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(url: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = url;
}

function PageMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const meta = pageMeta[pathname] ?? pageMeta["/"];
    const url = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;
    document.title = meta.title;
    setMetaTag("name", "description", meta.description);
    setCanonical(url);
    setMetaTag("property", "og:url", url);
    setMetaTag("property", "og:title", meta.title);
    setMetaTag("property", "og:description", meta.description);
    setMetaTag("property", "og:type", meta.ogType ?? "website");
    setMetaTag("name", "twitter:title", meta.title);
    setMetaTag("name", "twitter:description", meta.description);
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <PageMeta />
      <Layout>
        <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-24 text-center text-slate-500">Carregando…</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/comprimir-imagens" element={<CompressorPage />} />
            <Route path="/converter-imagens" element={<ConverterPage />} />
            <Route path="/redimensionar-imagens" element={<ResizerPage />} />
            <Route path="/cortar-imagens" element={<CropperPage />} />
            <Route path="/imagem-para-pdf" element={<PdfPage />} />
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="/contato" element={<ContactPage />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPage />} />
            <Route path="/termos-de-uso" element={<TermsPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}
