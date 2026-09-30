/** Downscale to max 1600px JPEG so uploads stay small (Vercel body limit ~4.5 MB) and fast. */
export async function shrink(file: File, max = 1600): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
    return blob && blob.size < file.size ? new File([blob], "poster.jpg", { type: "image/jpeg" }) : file;
  } catch { return file; }
}
