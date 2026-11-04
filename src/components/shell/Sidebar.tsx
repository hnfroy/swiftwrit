"use client";
import { useState } from "react";
import Link from "next/link";
import { FolderOpen, Plus, Trash } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { tools } from "@/tools/registry";
import { deleteDraft, useDrafts } from "@/core/drafts";
import { cn } from "@/lib/utils";

const blk = "flex h-11 flex-row items-center justify-center gap-2 rounded-[14px] border px-3 text-center text-[11px] font-medium leading-tight md:h-[76px] md:w-[72px] md:flex-col md:px-0";

export function Sidebar({ active }: { active: string }) {
  const drafts = useDrafts();
  const [open, setOpen] = useState(false);
  return (
    <aside className="sticky top-0 z-40 flex w-full flex-none flex-row items-center gap-3 bg-[#0B0B0C] px-3 py-2 md:static md:w-24 md:flex-col md:gap-7 md:py-6">
      <div aria-label="Logo" className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-lime font-bold text-[#0B0B0C]">SW.</div>
      <nav aria-label="Daftar tools" className="flex flex-row gap-2 md:flex-col md:gap-2.5">
        {/* {tools.map((t) => {
          const Icon = t.icon;
          const on = t.slug === active;
          return (
            <Link
              key={t.slug}
              href={`/tools/${t.slug}`}
              aria-current={on ? "page" : undefined}
              className={cn(blk, on ? "border-[#3A3A3D] bg-[#1F1F21] text-white" : "border-[#2A2A2C] bg-[#161617] text-[#B4B4B9] hover:text-white")}
            >
              <Icon className={cn("h-5 w-5 md:h-6 md:w-6", on ? "text-lime" : "text-[#8E8E93]")} />
              {t.title}
            </Link>
          );
        })} */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" aria-label={`Draft, ${drafts.length} tersimpan`} className={cn(blk, "relative border-[#2A2A2C] bg-[#161617] text-[#B4B4B9] hover:text-white")}>
              <FolderOpen className="h-5 w-5 text-[#8E8E93] md:h-6 md:w-6" />
              Draft
              {drafts.length > 0 && <span className="absolute right-1.5 top-1.5 min-w-[18px] rounded-full bg-lime px-1 text-[10px] font-bold leading-[18px] text-[#0B0B0C]">{drafts.length}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" className="w-72 max-w-[92vw] p-3">
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Draft tersimpan</div>
            {drafts.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">Belum ada draft. Klik tombol Draft di editor untuk menyimpan.</p>
            ) : (
              <ul className="max-h-72 space-y-1 overflow-auto">
                {drafts.map((d) => (
                  <li key={d.id} className="flex items-center gap-1 rounded-xl hover:bg-muted">
                    <Link href={`/tools/${d.toolSlug}?draft=${d.id}`} onClick={() => setOpen(false)} className="min-w-0 flex-1 px-3 py-2">
                      <div className="truncate text-sm font-medium">{d.title}</div>
                      <div className="text-xs text-muted-foreground">{new Date(d.updatedAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                    </Link>
                    <button type="button" aria-label={`Hapus draft ${d.title}`} onClick={() => deleteDraft(d.id)} className="grid h-9 w-9 flex-none place-items-center rounded-lg text-muted-foreground hover:text-foreground">
                      <Trash className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>
        <div className="hidden h-[76px] w-[72px] flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#2A2A2C] text-[11px] text-[#8E8E93] md:flex">
          <Plus className="h-6 w-6" />
          Tool lain
        </div>
      </nav>
    </aside>
  );
}
