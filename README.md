# Toolbox (Text to PDF)

    npm install
    npm run dev   # http://localhost:3000

Stack: Next.js 14 (App Router), Tailwind, komponen gaya shadcn/ui (Radix), TipTap, @react-pdf/renderer.

Struktur: `src/core` (model dokumen + exporter), `src/tools/<slug>` (satu folder per tool),
`src/tools/registry.ts` (daftar tool), `src/components/shell` (sidebar + header).
Tambah komponen shadcn lain: `npx shadcn@latest add <nama>` (components.json sudah disiapkan).
