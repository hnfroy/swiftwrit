import { notFound } from "next/navigation";
import { tools } from "@/tools/registry";
import { ToolRenderer } from "@/components/shell/ToolRenderer";

type Props = { params: { slug: string } };

export const generateStaticParams = () =>
  tools.map((t) => ({ slug: t.slug }));

export function generateMetadata({ params }: Props) {
  const t = tools.find((x) => x.slug === params.slug);

  return t
    ? { title: t.title, description: t.description }
    : {};
}

export default function ToolPage({ params }: Props) {
  const tool = tools.find((x) => x.slug === params.slug);

  if (!tool) notFound();

  return <ToolRenderer tool={tool} />;
}