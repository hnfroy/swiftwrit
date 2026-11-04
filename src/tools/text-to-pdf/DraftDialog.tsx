"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function DraftDialog({ open, onOpenChange, newPage, onNewPage, onConfirm, error, isUpdate }: {
  open: boolean; onOpenChange: (o: boolean) => void; newPage: boolean; onNewPage: (v: boolean) => void;
  onConfirm: () => void; error: string; isUpdate: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(440px,92vw)] space-y-4 p-6">
        <div>
          <DialogTitle className="text-lg font-semibold">Simpan draft</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">Disimpan sementara di browser ini, tidak ikut ke perangkat lain.</DialogDescription>
        </div>
        <div className="space-y-2">
          <label className="flex items-start gap-3 rounded-[14px] border border-border p-3 opacity-80">
            <input type="checkbox" checked disabled className="mt-0.5 h-4 w-4 accent-[#141414]" />
            <span><span className="block text-sm font-medium">Simpan draft</span><span className="block text-xs text-muted-foreground">{isUpdate ? "Perbarui draft yang sedang dibuka." : "Simpan isi dokumen dan pengaturan halaman."}</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-border p-3">
            <input type="checkbox" checked={newPage} onChange={(e) => onNewPage(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#141414]" />
            <span><span className="block text-sm font-medium">Buat halaman baru</span><span className="block text-xs text-muted-foreground">Kosongkan editor setelah draft tersimpan.</span></span>
          </label>
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm}>OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
