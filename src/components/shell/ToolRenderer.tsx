import { Suspense } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import type { ToolManifest } from "@/tools/registry";

type Props = {
  tool: ToolManifest;
};

export function ToolRenderer({ tool }: Props) {
  const Tool = tool.Component;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar active={tool.slug} />

      <main className="flex min-w-0 flex-1 flex-col p-3 md:p-8">
        <Suspense fallback={null}>
          <Tool />
        </Suspense>

        <footer className="mt-auto pt-10 text-center text-xs text-muted-foreground">
          Created by @hanifroyyan
        </footer>
      </main>
    </div>
  );
}