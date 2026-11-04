import type { Run } from "../document";
import type { Exporter } from "./types";

// Font bawaan PDF (tanpa embed): urutan = [biasa, tebal, miring, tebal-miring].
const FONTS = {
  sans: ["Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique"],
  serif: ["Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic"],
  mono: ["Courier", "Courier-Bold", "Courier-Oblique", "Courier-BoldOblique"],
};
const THEME = { light: ["#FFFFFF", "#141414"], cream: ["#F6EFE2", "#2B2418"], dark: ["#17171A", "#F2F2F3"] };
const PAD = { narrow: [40, 36], normal: [64, 56], wide: [88, 80] };
const PAGE = { A4: [595.28, 841.89], LETTER: [612, 792] };
const H_SIZE = { 1: 24, 2: 18, 3: 15, 4: 13 };

const dims = (src: string) =>
  new Promise<[number, number]>((res) => {
    const i = new window.Image();
    i.onload = () => res([i.naturalWidth, i.naturalHeight]);
    i.onerror = () => res([0, 0]);
    i.src = src;
  });

export const pdfExporter: Exporter = {
  id: "pdf",
  label: "PDF",
  ext: "pdf",
  mime: "application/pdf",
  async render(doc, s) {
    const { pdf, Document, Page, Text, View, Image } = await import("@react-pdf/renderer");
    const [bg, fg] = THEME[s.theme];
    const [py, px] = PAD[s.margin];
    const [pw, ph] = PAGE[s.size];
    const f = FONTS[s.font];
    const face = (bold?: boolean, italic?: boolean) => f[(bold ? 1 : 0) + (italic ? 2 : 0)];
    const runs = (rs: Run[], bold?: boolean, italic?: boolean) =>
      rs.map((r, k) => (
        <Text key={k} style={{ fontFamily: face(bold || r.bold, italic || r.italic), textDecoration: r.underline ? "underline" : "none" }}>
          {r.text}
        </Text>
      ));

    const sizes = new Map<string, [number, number]>();
    for (const b of doc.blocks) if (b.type === "image" && !sizes.has(b.src)) sizes.set(b.src, await dims(b.src));

    const body = doc.blocks.map((b, i) => {
      if (b.type === "heading")
        return <Text key={i} style={{ fontSize: H_SIZE[b.level], marginTop: 10, marginBottom: 8, textAlign: b.align ?? "left" }}>{runs(b.runs, true)}</Text>;
      if (b.type === "paragraph")
        return <Text key={i} style={{ lineHeight: 1.5, marginBottom: 10, textAlign: b.align ?? "left" }}>{runs(b.runs)}</Text>;
      if (b.type === "quote")
        return (
          <View key={i} style={{ borderLeftWidth: 2, borderLeftColor: fg, paddingLeft: 10, marginBottom: 10 }}>
            <Text style={{ lineHeight: 1.5, textAlign: b.align ?? "left" }}>{runs(b.runs, false, true)}</Text>
          </View>
        );
      if (b.type === "image") {
        const [nw, nh] = sizes.get(b.src) ?? [0, 0];
        if (!nw || !nh) return null;
        let w = Math.min(pw - 2 * px, nw);
        let h = (w * nh) / nw;
        const maxH = ph - 2 * py - 24;
        if (h > maxH) { h = maxH; w = (h * nw) / nh; }
        return <Image key={i} src={b.src} style={{ width: w, height: h, marginBottom: 10 }} />;
      }
      if (b.type === "table")
        return (
          <View key={i} style={{ marginBottom: 10, borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#9A9A9A" }}>
            {b.rows.map((r, ri) => (
              <View key={ri} wrap={false} style={{ flexDirection: "row" }}>
                {r.map((c, ci) => (
                  <View key={ci} style={{ flex: 1, padding: 5, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#9A9A9A", backgroundColor: c.header ? (s.theme === "dark" ? "#2A2A2E" : "#EEEEEA") : undefined }}>
                    <Text style={{ fontSize: 10 }}>{runs(c.runs, c.header)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      return (
        <View key={i} style={{ marginBottom: 10 }}>
          {b.items.map((it, k) => (
            <View key={k} style={{ flexDirection: "row", marginBottom: 3 }}>
              <Text style={{ width: 18 }}>{b.ordered ? `${k + 1}.` : "\u2022"}</Text>
              <Text style={{ flex: 1, lineHeight: 1.5 }}>{runs(it)}</Text>
            </View>
          ))}
        </View>
      );
    });

    const file = (
      <Document>
        <Page size={s.size} style={{ backgroundColor: bg, color: fg, paddingVertical: py, paddingHorizontal: px, fontFamily: f[0], fontSize: 11 }}>
          {body}
        </Page>
      </Document>
    );
    return pdf(file).toBlob();
  },
};
