import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const glassDir = path.join(process.cwd(), "public", "brand", "glass");
const files = fs.readdirSync(glassDir).filter((f) => f.endsWith(".png"));

function isDarkCanvas(r, g, b) {
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const maxc = Math.max(r, g, b);
  const minc = Math.min(r, g, b);
  const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
  return luma < 30 && sat < 0.32;
}

function isDarkReflection(r, g, b, y, height) {
  if (y < height * 0.42) return false;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const maxc = Math.max(r, g, b);
  const minc = Math.min(r, g, b);
  const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
  return luma < 48 && sat < 0.38;
}

for (const file of files) {
  const input = path.join(glassDir, file);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const visited = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (visited[i]) return;
    visited[i] = 1;
    stack.push(i);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length) {
    const i = stack.pop();
    const p = i * 4;
    if (!isDarkCanvas(data[p], data[p + 1], data[p + 2])) continue;
    data[p + 3] = 0;
    const x = i % width;
    const y = (i / width) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] === 0) continue;
      if (isDarkReflection(data[i], data[i + 1], data[i + 2], y, height)) {
        data[i + 3] = 0;
      }
    }
  }

  const tmp = path.join(glassDir, `.${file}.tmp`);
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(tmp);
  fs.renameSync(tmp, input);
  console.log("glass-clean", file);
}