// Baca gambar, perkecil (maks 1600px), dan ubah ke PNG/JPEG supaya aman dipakai PDF (webp/gif ikut dikonversi).
export async function fileToDataUrl(file: File, max = 1600): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Gambar tidak bisa dibaca"));
      i.src = url;
    });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak tersedia");
    const jpeg = file.type === "image/jpeg";
    if (jpeg) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL(jpeg ? "image/jpeg" : "image/png", 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}
