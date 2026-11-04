"use client";
import { DownloadSimple, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function PreviewDialog({ url, fileName, onDownload, onClose }: {
  url: string | null; fileName: string; onDownload: () => void; onClose: () => void;
}) {
  return (
    <Dialog open={!!url} onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined} className="flex h-[90vh] w-[min(960px,94vw)] flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
          <DialogTitle className="truncate text-base font-semibold">Preview: {fileName}</DialogTitle>
          <div className="flex items-center gap-3">
            {url && <a href={url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground underline">Buka di tab baru</a>}
            <Button onClick={onDownload}><DownloadSimple className="h-4 w-4" />Download</Button>
            <DialogClose asChild><Button variant="outline" size="icon" aria-label="Tutup preview"><X className="h-5 w-5" /></Button></DialogClose>
          </div>
        </div>
        {url && <iframe title="Preview PDF" src={`${url}#view=FitH`} className="min-h-0 w-full flex-1 bg-[#E9E9E6]" />}
      </DialogContent>
    </Dialog>
  );
}
