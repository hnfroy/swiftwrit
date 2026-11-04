// Model dokumen internal: semua tool mengubah input jadi model ini, semua exporter membaca darinya.
export type Run = { text: string; bold?: boolean; italic?: boolean; underline?: boolean };
export type Align = "center" | "right" | "justify"; // kiri = default
export type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4; runs: Run[]; align?: Align }
  | { type: "paragraph"; runs: Run[]; align?: Align }
  | { type: "list"; ordered: boolean; items: Run[][] }
  | { type: "quote"; runs: Run[]; align?: Align }
  | { type: "image"; src: string }
  | { type: "table"; rows: { header: boolean; runs: Run[] }[][] };
export type Doc = { blocks: Block[] };

export type PageSettings = {
  size: "A4" | "LETTER";
  margin: "narrow" | "normal" | "wide";
  font: "sans" | "serif" | "mono";
  theme: "light" | "cream" | "dark";
};

type N = { type?: string; text?: string; marks?: { type: string }[]; content?: N[]; attrs?: { level?: number; textAlign?: string; src?: string } };

const runsOf = (n: N): Run[] =>
  (n.content ?? []).flatMap((c): Run[] => {
    if (c.type === "text") {
      const has = (m: string) => c.marks?.some((x) => x.type === m);
      return [{ text: c.text ?? "", bold: has("bold"), italic: has("italic"), underline: has("underline") }];
    }
    return c.type === "hardBreak" ? [{ text: "\n" }] : [];
  });

const alignOf = (n: N): Align | undefined => {
  const a = n.attrs?.textAlign;
  return a === "center" || a === "right" || a === "justify" ? a : undefined;
};

export function fromTiptap(json: N): Doc {
  const blocks: Block[] = [];
  for (const n of json.content ?? []) {
    if (n.type === "heading") {
      blocks.push({ type: "heading", level: Math.min(4, n.attrs?.level ?? 1) as 1 | 2 | 3 | 4, runs: runsOf(n), align: alignOf(n) });
    } else if (n.type === "paragraph") {
      blocks.push({ type: "paragraph", runs: runsOf(n), align: alignOf(n) });
    } else if (n.type === "bulletList" || n.type === "orderedList") {
      blocks.push({
        type: "list",
        ordered: n.type === "orderedList",
        items: (n.content ?? []).map((li) => (li.content ?? []).flatMap((p) => runsOf(p))),
      });
    } else if (n.type === "blockquote") {
      for (const p of n.content ?? []) blocks.push({ type: "quote", runs: runsOf(p), align: alignOf(p) });
    } else if (n.type === "image" && n.attrs?.src) {
      blocks.push({ type: "image", src: n.attrs.src });
    } else if (n.type === "table") {
      blocks.push({
        type: "table",
        rows: (n.content ?? []).map((tr) =>
          (tr.content ?? []).map((c) => ({
            header: c.type === "tableHeader",
            runs: (c.content ?? []).flatMap((p, i): Run[] => (i ? [{ text: "\n" }, ...runsOf(p)] : runsOf(p))),
          }))
        ),
      });
    }
  }
  return { blocks };
}
