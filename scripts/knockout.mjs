import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const dir = path.join(process.cwd(), "public", "brand");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg"));

function alphaFromRgb(r, g, b) {
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const maxc = Math.max(r, g, b);
  const minc = Math.min(r, g, b);
  const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
  if (luma < 18 && sat < 0.28) return 0;
  if (luma < 32 && sat < 0.18) return Math.round(((luma - 18) / 14) * 80);
  if (luma < 46 && sat < 0.12) return Math.round(((luma - 32) / 14) * 160);
  return 255;
}

for (const file of files) {
  const input = path.join(dir, file);
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = alphaFromRgb(data[i], data[i + 1], data[i + 2]);
  }

  const out = path.join(dir, file.replace(/\.jpg$/i, ".png"));
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(out);

  console.log("knockout", path.basename(out), info.width, info.height);
}
