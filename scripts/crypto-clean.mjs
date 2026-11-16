import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const cryptoDir = path.join(process.cwd(), "public", "brand", "crypto");
const inputs = fs
  .readdirSync(cryptoDir)
  .filter((f) => f.endsWith(".png") || f.endsWith(".jpg"));

function isBackdrop(r, g, b) {
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const maxc = Math.max(r, g, b);
  const minc = Math.min(r, g, b);
  const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
  const neutral = Math.abs(r - g) < 12 && Math.abs(g - b) < 12;
  const checkerLike = neutral && luma > 155 && luma < 252;
  return checkerLike || (luma > 188 && sat < 0.16) || (luma < 58 && sat < 0.42);
}

async function cleanFile(input, outputPng) {
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
    if (!isBackdrop(data[p], data[p + 1], data[p + 2])) continue;
    data[p + 3] = 0;
    const x = i % width;
    const y = (i / width) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  const neighborAlpha = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0;
    return data[(y * width + x) * 4 + 3];
  };

  for (let pass = 0; pass < 8; pass++) {
    const next = Uint8Array.from(data);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (data[i + 3] === 0) continue;
        const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        const maxc = Math.max(data[i], data[i + 1], data[i + 2]);
        const minc = Math.min(data[i], data[i + 1], data[i + 2]);
        const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
        const softEdge = luma > 150 && sat < 0.2;
        if (!softEdge) continue;
        const touchesClear =
          neighborAlpha(x - 1, y) === 0 ||
          neighborAlpha(x + 1, y) === 0 ||
          neighborAlpha(x, y - 1) === 0 ||
          neighborAlpha(x, y + 1) === 0;
        if (touchesClear) next[i + 3] = 0;
      }
    }
    data.set(next);
  }

  const tmp = `${outputPng}.tmp`;
  await sharp(data, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(tmp);
  await sharp(tmp).trim({ threshold: 12 }).png({ compressionLevel: 9 }).toFile(outputPng);
  fs.unlinkSync(tmp);
}

for (const file of inputs) {
  const input = path.join(cryptoDir, file);
  const outputPng = path.join(cryptoDir, file.replace(/\.(png|jpg)$/i, ".png"));
  await cleanFile(input, outputPng);
  console.log("crypto-clean", path.basename(outputPng));
}