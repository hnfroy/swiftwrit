"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import ImageExt from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import {
  ArrowClockwise, ArrowCounterClockwise, ArrowsHorizontal, ArrowsVertical, CaretDoubleDown, CaretDoubleUp, CaretDown,
  CaretLeft, CaretRight, CaretUp, Check, ColumnsPlusRight, DotsSix, FloppyDisk, GearSix, ImageSquare, ListBullets,
  ListNumbers, Minus, Plus, Quotes, RowsPlusBottom, Table as TableIcon, TextAlignCenter, TextAlignJustify,
  TextAlignLeft, TextAlignRight, TextB, TextH, TextHFour, TextHOne, TextHThree, TextHTwo, TextItalic,
  TextUnderline, Trash, type Icon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Segmented } from "@/components/ui/segmented";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToolHeader } from "@/components/shell/ToolHeader";
import { PreviewDialog } from "@/components/shell/PreviewDialog";
import { ImageDialog } from "./ImageDialog";
import { DraftDialog } from "./DraftDialog";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getDraft, newId, saveDraft } from "@/core/drafts";
import { fromTiptap, type PageSettings } from "@/core/document";
import { pdfExporter } from "@/core/export/pdf";
import { download, safeName } from "@/core/export/download";
import { cn } from "@/lib/utils";

type Edge = "left" | "right";
type Mode = Edge | "float";
type Side = "top" | "right" | "bottom" | "left";
const SNAP = 40; // jarak (px) dari tepi untuk menempel
const WS_DIR: Record<Mode, string> = { left: "flex-row", right: "flex-row-reverse", float: "flex-row" };
const TIP_SIDE: Record<Mode, Side> = { left: "right", right: "left", float: "right" };

const PAGE_H = { A4: 848, LETTER: 776 };
const PAD = { narrow: [40, 36], normal: [64, 56], wide: [88, 80] }; // [atas-bawah, kiri-kanan] dalam px
const GAP = 24; // jarak antar halaman pada layout samping
const FONT = {
  sans: "var(--font-inter), system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, Menlo, Consolas, monospace",
};
const THEME = { light: ["#FFFFFF", "#141414"], cream: ["#F6EFE2", "#2B2418"], dark: ["#17171A", "#F2F2F3"] };
const DEFAULT_S: PageSettings = { size: "A4", margin: "normal", font: "sans", theme: "light" };
const BLANK = "<h1>Judul dokumen</h1><p>Mulai ketik di sini. Klik tombol H untuk mengganti level judul.</p>";
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

const LEVELS = [1, 2, 3, 4] as const;
type Level = (typeof LEVELS)[number];
const HEAD_ICON = [TextH, TextHOne, TextHTwo, TextHThree, TextHFour];
const ic = (I: Icon) => <I className="h-[18px] w-[18px]" />;

// Satu tombol heading: tiap klik naik level H1 → H2 → H3 → H4 → teks biasa → H1.
const cycleHeading = (e: Editor, cur: Level | undefined) => {
  const c = e.chain().focus();
  if (!cur) c.setHeading({ level: 1 }).run();
  else if (cur === 4) c.setParagraph().run();
  else c.setHeading({ level: (cur + 1) as Level }).run();
};

// core = tampil juga saat toolbar diringkas. group "table" hanya muncul saat kursor di dalam tabel.
const toolbarItems = (e: Editor, openImage: () => void) => {
  const lvl = LEVELS.find((l) => e.isActive("heading", { level: l }));
  const c = () => e.chain().focus();
  const mk = (id: string, group: string, tip: string, content: ReactNode, run: () => void, on = false, core = false) => ({ id, group, tip, content, run, on, core });
  const al = (v: string, tip: string, I: Icon) => mk("al-" + v, "align", tip, ic(I), () => c().setTextAlign(v).run(), e.isActive({ textAlign: v }));
  const txt = (t: string) => <span className="text-[11px] font-semibold">{t}</span>;
  return [
    mk("heading", "text", `Judul${lvl ? " H" + lvl : ""}: klik untuk ganti level`,
      <span className="relative">{ic(HEAD_ICON[lvl ?? 0])}<CaretUp weight="bold" className="absolute -right-1.5 -top-1 h-2.5 w-2.5 opacity-70" aria-hidden="true" /></span>,
      () => cycleHeading(e, lvl), !!lvl, true),
    mk("bold", "text", "Tebal", ic(TextB), () => c().toggleBold().run(), e.isActive("bold"), true),
    mk("italic", "text", "Miring", ic(TextItalic), () => c().toggleItalic().run(), e.isActive("italic"), true),
    mk("underline", "text", "Garis bawah", ic(TextUnderline), () => c().toggleUnderline().run(), e.isActive("underline")),
    al("left", "Rata kiri", TextAlignLeft),
    al("center", "Rata tengah", TextAlignCenter),
    al("right", "Rata kanan", TextAlignRight),
    al("justify", "Rata kiri-kanan (justify)", TextAlignJustify),
    mk("ul", "list", "Daftar poin", ic(ListBullets), () => c().toggleBulletList().run(), e.isActive("bulletList"), true),
    mk("ol", "list", "Daftar nomor", ic(ListNumbers), () => c().toggleOrderedList().run(), e.isActive("orderedList")),
    mk("quote", "list", "Kutipan", ic(Quotes), () => c().toggleBlockquote().run(), e.isActive("blockquote")),
    mk("image", "insert", "Sisipkan gambar", ic(ImageSquare), openImage, false, true),
    mk("table", "insert", "Sisipkan tabel 3×3", ic(TableIcon), () => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), e.isActive("table"), true),
    mk("row+", "table", "Tambah baris di bawah", ic(RowsPlusBottom), () => c().addRowAfter().run()),
    mk("col+", "table", "Tambah kolom di kanan", ic(ColumnsPlusRight), () => c().addColumnAfter().run()),
    mk("row-", "table", "Hapus baris", txt("−B"), () => c().deleteRow().run()),
    mk("col-", "table", "Hapus kolom", txt("−K"), () => c().deleteColumn().run()),
    mk("tbl-", "table", "Hapus tabel", ic(Trash), () => c().deleteTable().run()),
    mk("undo", "history", "Urungkan", ic(ArrowCounterClockwise), () => c().undo().run(), false, true),
    mk("redo", "history", "Ulangi", ic(ArrowClockwise), () => c().redo().run()),
  ];
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-1.5"><div className="text-[13px] text-muted-foreground">{label}</div>{children}</div>
);
const Tip = ({ tip, side, children }: { tip: string; side: Side; children: ReactNode }) => (
  <Tooltip><TooltipTrigger asChild>{children}</TooltipTrigger><TooltipContent side={side}>{tip}</TooltipContent></Tooltip>
);

export function TextToPdf() {
  const [s, setS] = useState<PageSettings>(DEFAULT_S);
  const [mode, setMode] = useState<Mode>("left");
  const [pos, setPos] = useState({ x: 16, y: 16 });
  const [snap, setSnap] = useState<Edge | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [imageOpen, setImageOpen] = useState(false);
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [newPage, setNewPage] = useState(true);
  const [draftErr, setDraftErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [layout, setLayout] = useState<"v" | "h">("v"); // v = scroll ke bawah, h = scroll ke samping
  const [pages, setPages] = useState(1);
  const pagesRef = useRef(1);
  const cols = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const measureRef = useRef<() => void>();
  const router = useRouter();
  const pathname = usePathname();
  const param = useSearchParams().get("draft");
  const ws = useRef<HTMLDivElement>(null);
  const tb = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{ sx: number; sy: number; bx: number; by: number; active: boolean } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageExt.configure({ allowBase64: true }),
      Table.configure({ resizable: false }), TableRow, TableHeader, TableCell,
    ],
    immediatelyRender: false,
    content: BLANK,
  });

  // Buka draft dari sidebar (?draft=<id>).
  useEffect(() => {
    if (!editor || !param) return;
    const d = getDraft(param);
    if (!d) return;
    editor.commands.setContent(d.content as never);
    setS(d.settings);
    setName(d.name);
    setDraftId(d.id);
  }, [editor, param]);

  const onSaveDraft = () => {
    if (!editor) return;
    const id = draftId ?? newId();
    const title = name.trim() || editor.getText().trim().split("\n")[0]?.slice(0, 40) || "Tanpa judul";
    try {
      saveDraft({ id, toolSlug: "text-to-pdf", title, name, updatedAt: Date.now(), content: editor.getJSON(), settings: s });
    } catch {
      setDraftErr("Draft gagal disimpan: penyimpanan browser penuh. Kurangi jumlah atau ukuran gambar.");
      return;
    }
    setDraftErr("");
    setDraftOpen(false);
    if (newPage) {
      editor.commands.setContent(BLANK);
      setS(DEFAULT_S);
      setName("");
      setDraftId(null);
      if (param) router.replace(pathname);
    } else setDraftId(id);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  // Layout samping: isi mengalir ke kolom (1 kolom = 1 halaman); jumlah halaman dihitung dari posisi blok terakhir.
  useEffect(() => { pagesRef.current = pages; }, [pages]);
  useEffect(() => {
    if (layout !== "h" || !editor) return;
    const px = PAD[s.margin][1];
    const measure = () => {
      const el = cols.current;
      const last = el?.querySelector(".ProseMirror")?.lastElementChild;
      if (!el || !last) return;
      const er = el.getBoundingClientRect();
      const n = pagesRef.current;
      const z = er.width / (n * 600 + (n - 1) * GAP) || 1; // skala tampil (zoom)
      const right = Math.max(...Array.from(last.getClientRects()).map((r) => r.right));
      setPages(Math.max(1, Math.floor(((right - er.left) / z - px - 1) / (600 + GAP)) + 1));
    };
    const run = () => requestAnimationFrame(measure);
    measureRef.current = run;
    run();
    editor.on("update", run);
    return () => { editor.off("update", run); };
  }, [layout, editor, s]);

  // Zoom yang pas dengan lebar kanvas (maks 100%).
  const fit = (n = 1) => {
    const w = (canvas.current?.clientWidth ?? 0) - (window.innerWidth < 768 ? 24 : 64);
    return w > 0 ? Math.max(0.3, Math.min(1, Math.floor((w / (n * 600 + (n - 1) * GAP)) * 10) / 10)) : 1;
  };
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setCollapsed(true); // mobile: toolbar mulai dalam mode ringkas
  }, []);
  useEffect(() => {
    if (editor && window.matchMedia("(max-width: 767px)").matches) setZoom(fit()); // setelah toolbar tampil, sesuaikan zoom
  }, [!!editor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Layout samping dengan halaman > 2: zoom otomatis menyesuaikan agar semua halaman muat; kembali normal saat <= 2.
  const autoFit = useRef(false);
  useEffect(() => {
    if (layout !== "h") return;
    if (pages > 2) { setZoom(fit(pages)); autoFit.current = true; }
    else if (autoFit.current) { setZoom(fit()); autoFit.current = false; }
  }, [layout, pages]); // eslint-disable-line react-hooks/exhaustive-deps

  const setZ = (v: number) => setZoom(Math.max(0.3, Math.min(2, Math.round(v * 10) / 10)));
  const pickLayout = (v: "v" | "h") => {
    setLayout(v);
    scroller.current?.scrollTo(0, 0);
    if (v === "v" && autoFit.current) { setZoom(fit()); autoFit.current = false; }
  };
  const flip = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * (600 + GAP) * zoom, behavior: "smooth" });
  const set = <K extends keyof PageSettings>(k: K) => (v: PageSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const [bg, fg] = THEME[s.theme];
  const pageH = PAGE_H[s.size];
  const guide = `repeating-linear-gradient(to bottom, transparent 0, transparent ${pageH - 2}px, rgba(0,0,0,.14) ${pageH - 2}px, rgba(0,0,0,.14) ${pageH}px)`;
  const fileName = `${safeName(name)}.pdf`;
  const [py, px] = PAD[s.margin];
  const isH = layout === "h";
  const totalW = pages * 600 + (pages - 1) * GAP;
  const edge = "#BDBDBA";
  const pagesBg = `repeating-linear-gradient(to right, ${edge} 0, ${edge} 1px, transparent 1px, transparent 599px, ${edge} 599px, ${edge} 600px, transparent 600px, transparent ${600 + GAP}px), repeating-linear-gradient(to right, ${bg} 0, ${bg} 600px, transparent 600px, transparent ${600 + GAP}px)`;

  const onExport = async () => {
    if (!editor) return;
    setBusy(true);
    try {
      const blob = await pdfExporter.render(fromTiptap(editor.getJSON()), s);
      setPreview({ blob, url: URL.createObjectURL(blob) });
    } finally {
      setBusy(false);
    }
  };
  const closePreview = () => { if (preview) URL.revokeObjectURL(preview.url); setPreview(null); };

  // Seret grip: geser bebas; dekat tepi kanvas (kiri/kanan/atas/bawah) → menempel di sisi itu saat dilepas.
  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const w = ws.current, t = tb.current;
    if (!w || !t) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const wr = w.getBoundingClientRect(), tr = t.getBoundingClientRect();
    drag.current = { sx: e.clientX, sy: e.clientY, bx: tr.left - wr.left, by: tr.top - wr.top, active: false };
  };
  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current, w = ws.current, t = tb.current;
    if (!d || !w || !t) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.active) {
      if (Math.hypot(dx, dy) < 4) return;
      d.active = true;
      setMode("float");
    }
    const maxX = w.clientWidth - t.offsetWidth, maxY = w.clientHeight - t.offsetHeight;
    const x = clamp(d.bx + dx, 0, maxX), y = clamp(d.by + dy, 0, maxY);
    setPos({ x, y });
    const near: [Edge, number][] = [["left", x], ["right", maxX - x]];
    const [edge, dist] = near.reduce((a, b) => (b[1] < a[1] ? b : a));
    setSnap(dist < SNAP ? edge : null);
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.active && snap) setMode(snap);
    setSnap(null);
  };

  const tipSide = TIP_SIDE[mode];
  let prev = "";
  const nodes = !editor ? [] : toolbarItems(editor, () => setImageOpen(true))
    .filter((it) => (it.group === "table" ? editor.isActive("table") : !collapsed || it.core))
    .flatMap((it) => {
      const sep = prev !== "" && prev !== it.group;
      prev = it.group;
      return [
        sep ? <div key={"s" + it.id} aria-hidden="true" className="col-span-full my-0.5 h-px bg-border" /> : null,
        <Tip key={it.id} tip={it.tip} side={tipSide}>
          <Button variant="ghost" size="tool" aria-label={it.tip} aria-pressed={it.on} onClick={it.run} className={cn("flex-none", it.on && "bg-muted")}>{it.content}</Button>
        </Tip>,
      ];
    });

  return (
    <div className="flex flex-col gap-6">
      <ToolHeader title="SwiftWrit." subtitle="Your workspace, made simple.">
        <label className="flex h-12 w-full items-center rounded-[14px] border border-border bg-white pl-4 pr-3 focus-within:ring-2 focus-within:ring-ring md:w-auto">
          <input
            aria-label="Nama file"
            value={name}
            maxLength={80}
            placeholder="document"
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground md:w-40 md:flex-none"
          />
          <span className="text-sm text-muted-foreground">.pdf</span>
        </label>
        <Button variant="outline" disabled={!editor} onClick={() => { setDraftErr(""); setDraftOpen(true); }}>
          {saved ? <Check className="h-4 w-4" /> : <FloppyDisk className="h-4 w-4" />}
          {saved ? "Tersimpan" : "Draft"}
        </Button>
        <Button onClick={onExport} disabled={busy || !editor} className="flex-1 md:flex-none">{busy ? "Memproses…" : "Export PDF"}</Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Pengaturan halaman"><GearSix className="h-5 w-5" /></Button>
          </PopoverTrigger>
          <PopoverContent className="max-w-[90vw] space-y-4">
            <Field label="Ukuran"><Segmented label="Ukuran" value={s.size} onChange={set("size")} options={[{ value: "A4", label: "A4" }, { value: "LETTER", label: "Letter" }]} /></Field>
            <Field label="Margin"><Segmented label="Margin" value={s.margin} onChange={set("margin")} options={[{ value: "narrow", label: "Sempit" }, { value: "normal", label: "Normal" }, { value: "wide", label: "Lebar" }]} /></Field>
            <Field label="Font">
              <div className="relative">
                <select
                  aria-label="Font"
                  value={s.font}
                  onChange={(e) => set("font")(e.target.value as PageSettings["font"])}
                  className="h-10 w-full appearance-none rounded-[10px] border border-border bg-white px-3 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="sans">Sans</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Mono</option>
                </select>
                <CaretDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </Field>
            <Field label="Tema halaman">
              <div role="radiogroup" aria-label="Tema halaman" className="flex gap-3 p-0.5">
                {(["light", "cream", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={s.theme === t}
                    aria-label={`Tema ${t === "light" ? "terang" : t === "cream" ? "krem" : "gelap"}`}
                    onClick={() => set("theme")(t)}
                    style={{ backgroundColor: THEME[t][0] }}
                    className={cn("h-8 w-8 rounded-full border border-[#BDBDBA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", s.theme === t && "outline outline-2 outline-offset-2 outline-primary")}
                  />
                ))}
              </div>
            </Field>
            <Field label="Posisi toolbar"><Segmented label="Posisi toolbar" value={mode} onChange={setMode} options={[{ value: "left", label: "Kiri" }, { value: "right", label: "Kanan" }, { value: "float", label: "Bebas" }]} /></Field>
          </PopoverContent>
        </Popover>
      </ToolHeader>

      <div ref={ws} className={cn("relative flex gap-4", WS_DIR[mode])}>
        {editor && (
          <TooltipProvider delayDuration={250}>
            <div
              ref={tb}
              role="toolbar"
              aria-label="Format teks"
              aria-orientation="vertical"
              style={mode === "float" ? { position: "absolute", left: pos.x, top: pos.y, zIndex: 20 } : undefined}
              className={cn(
                "flex flex-none gap-1 rounded-[18px] border border-border bg-[#FBFBFA] p-1.5",
                "flex-col self-start",
                mode === "float" && "shadow-xl"
              )}
            >
              <Tip tip="Seret ke tepi untuk menempel" side={tipSide}>
                <div
                  onPointerDown={startDrag}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  className="grid h-5 w-full flex-none cursor-grab touch-none place-items-center text-[#8E8E93]"
                >
                  <DotsSix className="h-4 w-4" />
                </div>
              </Tip>
              <div className={cn("grid gap-0.5", collapsed ? "grid-cols-1" : "grid-cols-2")}>{nodes}</div>
              <Tip tip={collapsed ? "Tampilkan semua alat" : "Ringkas alat"} side={tipSide}>
                <Button variant="ghost" size="tool" aria-label={collapsed ? "Tampilkan semua alat" : "Ringkas alat"} onClick={() => setCollapsed((v) => !v)} className="w-full flex-none">
                  {collapsed ? <CaretDoubleDown className="h-[18px] w-[18px]" /> : <CaretDoubleUp className="h-[18px] w-[18px]" />}
                </Button>
              </Tip>
            </div>
          </TooltipProvider>
        )}

        <div ref={canvas} className="relative h-[70vh] min-w-0 flex-1 overflow-hidden rounded-[18px] bg-[#E9E9E6] md:h-[780px]">
          <div ref={scroller} className="noscroll absolute inset-0 overflow-auto p-3 md:p-8">
            <div style={{ zoom, width: isH ? totalW : 600 }} className="mx-auto">
              {isH ? (
                <div
                  ref={cols}
                  className="doc-h"
                  onClick={(e) => e.target === e.currentTarget && editor?.commands.focus("end")}
                  onLoadCapture={() => measureRef.current?.()}
                  style={{ width: totalW, height: pageH, boxSizing: "border-box", padding: `${py}px ${px}px`, columnCount: pages, columnGap: 2 * px + GAP, columnFill: "auto", backgroundImage: pagesBg, color: fg, fontFamily: FONT[s.font] }}
                >
                  <EditorContent editor={editor} className="doc" />
                </div>
              ) : (
                <article
                  style={{ minHeight: pageH, padding: `${py}px ${px}px`, backgroundColor: bg, backgroundImage: guide, color: fg, fontFamily: FONT[s.font] }}
                  className="border border-[#BDBDBA] shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
                >
                  <EditorContent editor={editor} className="doc" />
                </article>
              )}
            </div>
          </div>
          {snap && (
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute z-30 rounded-full bg-ring/70",
                snap === "left" && "bottom-4 left-0 top-4 w-1.5",
                snap === "right" && "bottom-4 right-0 top-4 w-1.5"
              )}
            />
          )}
          <TooltipProvider delayDuration={250}>
          <div role="group" aria-label="Layout dan zoom kanvas" className="absolute bottom-4 right-4 z-10 flex items-center gap-0.5 rounded-[14px] border border-border bg-white p-1 shadow-lg">
            <Tip tip="Layout vertikal: scroll ke bawah" side="top">
              <Button variant="ghost" size="tool" aria-label="Layout vertikal, scroll ke bawah" aria-pressed={!isH} onClick={() => pickLayout("v")} className={cn(!isH && "bg-muted")}><ArrowsVertical className="h-4 w-4" /></Button>
            </Tip>
            <Tip tip="Layout horizontal: scroll ke samping" side="top">
              <Button variant="ghost" size="tool" aria-label="Layout horizontal, scroll ke samping" aria-pressed={isH} onClick={() => pickLayout("h")} className={cn(isH && "bg-muted")}><ArrowsHorizontal className="h-4 w-4" /></Button>
            </Tip>
            {isH && (
              <>
                <Tip tip="Halaman sebelumnya" side="top"><Button variant="ghost" size="tool" aria-label="Halaman sebelumnya" onClick={() => flip(-1)}><CaretLeft className="h-4 w-4" /></Button></Tip>
                <Tip tip="Halaman berikutnya" side="top"><Button variant="ghost" size="tool" aria-label="Halaman berikutnya" onClick={() => flip(1)}><CaretRight className="h-4 w-4" /></Button></Tip>
                <span className="px-1.5 text-xs text-muted-foreground">{pages} hal.</span>
              </>
            )}
            <div aria-hidden="true" className="mx-1 h-6 w-px bg-border" />
            <Button variant="ghost" size="tool" aria-label="Perkecil" onClick={() => setZ(zoom - 0.1)}><Minus className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" aria-label="Sesuaikan zoom dengan lebar kanvas" onClick={() => setZ(fit(isH ? pages : 1))} className="min-w-[56px]">{Math.round(zoom * 100)}%</Button>
            <Button variant="ghost" size="tool" aria-label="Perbesar" onClick={() => setZ(zoom + 0.1)}><Plus className="h-4 w-4" /></Button>
          </div>
          </TooltipProvider>
        </div>
      </div>

      <DraftDialog open={draftOpen} onOpenChange={setDraftOpen} newPage={newPage} onNewPage={setNewPage} onConfirm={onSaveDraft} error={draftErr} isUpdate={!!draftId} />
      <ImageDialog open={imageOpen} onOpenChange={setImageOpen} onInsert={(src) => editor?.chain().focus().setImage({ src }).run()} />
      <PreviewDialog url={preview?.url ?? null} fileName={fileName} onDownload={() => preview && download(preview.blob, fileName)} onClose={closePreview} />
    </div>
  );
}
