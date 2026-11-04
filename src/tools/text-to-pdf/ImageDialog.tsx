"use client";
import { useRef, useState } from "react";
import { UploadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { fileToDataUrl } from "@/core/image";
import { cn } from "@/lib/utils";

const OK = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function ImageDialog({ open, onOpenChange, onInsert }: {
  open: boolean; onOpenChange: (o: boolean) => void; onInsert: (src: string) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const close = (o: boolean) => { if (!o) { setSrc(null); setErr(""); } onOpenChange(o); };
  const pick = async (f?: File) => {
    if (!f) return;
    if (!OK.includes(f.type)) return setErr("Format harus PNG, JPG, JPEG, WEBP, atau GIF.");
    if (f.size > 10 * 1024 * 1024) return setErr("Ukuran maksimal 10 MB.");
    try { setSrc(await fileToDataUrl(f)); setErr(""); } catch { setErr("Gambar tidak bisa dibaca."); }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="w-[min(480px,92vw)] space-y-4 p-6">
        <div>
          <DialogTitle className="text-lg font-semibold">Sisipkan gambar</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">PNG, JPG, JPEG, WEBP, atau GIF. Maksimal 10 MB.</DialogDescription>
        </div>
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
          className={cn("flex h-44 w-full flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-border bg-[#FBFBFA] text-sm text-muted-foreground", over && "border-ring bg-muted")}
        >
          {src ? <img src={src} alt="Pratinjau gambar" className="max-h-40 max-w-full object-contain" /> : (<><UploadSimple className="h-7 w-7" />Klik untuk memilih atau seret gambar ke sini</>)}
        </button>
        <input ref={input} type="file" accept=".png,.jpg,.jpeg,.webp,.gif,image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => close(false)}>Batal</Button>
          <Button disabled={!src} onClick={() => { if (src) onInsert(src); close(false); }}>Sisipkan</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
