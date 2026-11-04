import { notFound } from "next/navigation";
import { tools } from "@/tools/registry";
import { ToolRenderer } from "@/components/shell/ToolRenderer";

export default function Home() {
  const tool = tools.find((t) => t.slug === "text-to-pdf");

  if (!tool) notFound();

  return <ToolRenderer tool={tool} />;
}