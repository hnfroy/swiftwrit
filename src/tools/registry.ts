import type { ComponentType } from "react";
import { FilePdf } from "@phosphor-icons/react/dist/ssr";
import { TextToPdf } from "./text-to-pdf/Editor";

export type ToolManifest = {
  slug: string;
  title: string;
  description: string; // dipakai juga untuk meta SEO
  icon: ComponentType<{ className?: string }>;
  Component: ComponentType;
};

// Menambah tool baru = buat folder di /tools lalu tambahkan satu entri di sini.
export const tools: ToolManifest[] = [
  {
    slug: "text-to-pdf",
    title: "Text to PDF",
    description: "Ketik bebas, atur halaman, ekspor jadi PDF.",
    icon: FilePdf,
    Component: TextToPdf,
  },
];
