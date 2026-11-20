# Project memory

## Product intent & audience

- **Imagem Fácil**: free online image editing & optimization portal.
- Audience: general users needing quick, no-signup image tools in Portuguese (likely Brazilian).
- Core promise: fast, private, no account required, images never leave the browser.
- Monetization intent: Google AdSense (prepared but not yet active).

## Brand personality & voice

- Professional, modern, trustworthy, privacy-first.
- Direct and practical tone; no marketing fluff.
- Portuguese (pt-BR) UI copy.

## Visual design & UX direction

- White background; purple as primary brand color.
- Fully responsive layout; simple, intuitive top menu.
- Modern, non-cookie-cutter aesthetic (per global `.bolt/prompt` guidance).
- Reusable UI components: layout shell, file selector, results grid.
- Lucide icons for tool/feature logos; Tailwind utility styling.
- Each tool supports multi-file selection, preview, and individual or batch download of results.
- Tool UX patterns: drag/crop overlays, aspect-ratio presets (1:1, 4:3, 16:9, 3:2), quality/format controls, dimension lock, percentage resize.

## Decisions, constraints & rationale

- **Framework**: vite-react (JSX + Tailwind + React hooks + Lucide React); `@/` path alias maps to `src/`.
- **Processing**: all image operations run client-side in-browser via Canvas/File APIs; no image uploads to servers.
- **Routing**: individual route per tool, plus home, About, Contact, Privacy Policy, Terms of Use.
- **Tools implemented**: Compressor, Converter (JPG/PNG/WebP with transparency), Resizer (px/percent + ratio lock), Cropper (drag + presets), Image-to-PDF (multi-page, A4/Letter, adjustable margin, page reorder).
- **Contact form**: persists messages to a Supabase database table created for the project (real persistence, no mock).
- **SEO/AdSense scaffolding**: per-page titles/descriptions, Open Graph tags, structured data; AdSense slot ready for a publisher ID.
- **Code quality**: reusable shared utilities and components; no placeholder/no-op buttons; build passes cleanly.
- **Auth**: none required anywhere.

## Open questions & assumptions

- AdSense not yet active — needs a Google AdSense account and publisher ID inserted into the prepared slot.
- Custom domain (e.g. imagemfacil.com.br) not yet purchased/linked; required for AdSense approval.
- Supabase credentials/config assumed present in the environment; verify connection details before production deploy.
- Browser support assumed modern (Canvas, Blob, File API); no legacy fallbacks built.
- No analytics/tracking added beyond AdSense slot; undecided if needed.
- Language localization beyond pt-BR not scoped.