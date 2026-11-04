import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { tools } from "@/tools/registry";

type Props = { params: { slug: string } };
export const generateStaticParams = () => tools.map((t) => ({ slug: t.slug }));
export function generateMetadata({ params }: Props) {
  const t = tools.find((x) => x.slug === params.slug);
  return t ? { title: t.title, description: t.description } : {};
}

export default function ToolPage({ params }: Props) {
  const tool = tools.find((x) => x.slug === params.slug);
  if (!tool) notFound();
  const Tool = tool.Component;
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar active={tool.slug} />
      <main className="flex min-w-0 flex-1 flex-col p-3 md:p-8">
        <Suspense fallback={null}><Tool /></Suspense>
        <footer className="mt-auto pt-10 text-center text-xs text-muted-foreground">Created by @hanifroyyan</footer>
      </main>
    </div>
  );
}
