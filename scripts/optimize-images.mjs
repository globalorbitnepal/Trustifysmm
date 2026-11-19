/**
 * Generates responsive WebP derivatives for the oversized PNG/JPG art used above the fold
 * and in the footer. Source 1024×1024 files are kept untouched; the components load the
 * generated variants, so image quality is preserved at the sizes actually rendered.
 *
 * Run: node scripts/optimize-images.mjs
 */
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "img");

/** [sourceDir, sourceFile glob prefix, outputSubdir, widths[], format] */
const JOBS = [
  { dir: "public/brand/glass", prefix: "glass-", sub: "glass", widths: [64, 128, 256] },
  { dir: "public/brand/crypto", prefix: "glass-", sub: "crypto", widths: [96, 192] },
  { dir: "public/brand/crypto", prefix: "wallet-scene", sub: "crypto", widths: [256] },
  { dir: "public/brand/reviews", prefix: "review-", sub: "reviews", widths: [104] },
];

async function listFiles(dir) {
  try {
    return await readdir(path.join(ROOT, dir));
  } catch {
    return [];
  }
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(0)}KB`;
}

const report = [];

for (const job of JOBS) {
  const files = (await listFiles(job.dir)).filter(
    (name) => name.startsWith(job.prefix) && /\.(png|jpe?g)$/i.test(name),
  );
  const outDir = path.join(OUT, job.sub);
  await mkdir(outDir, { recursive: true });

  for (const file of files) {
    const sourcePath = path.join(ROOT, job.dir, file);
    const base = path.basename(file).replace(/\.(png|jpe?g)$/i, "");
    const before = (await stat(sourcePath)).size;
    let smallest = Infinity;

    for (const width of job.widths) {
      const target = path.join(outDir, `${base}-${width}.webp`);
      await sharp(sourcePath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82, effort: 6 })
        .toFile(target);
      const after = (await stat(target)).size;
      smallest = Math.min(smallest, after);
    }

    report.push({ file: `${job.dir}/${file}`, before, smallest });
  }
}

report.sort((a, b) => b.before - a.before);
let totalBefore = 0;
let totalAfter = 0;
for (const row of report) {
  totalBefore += row.before;
  totalAfter += row.smallest;
  console.log(`${row.file.padEnd(48)} ${kb(row.before).padStart(8)} -> ${kb(row.smallest).padStart(7)}`);
}
console.log(
  `\nTotal source ${kb(totalBefore)} -> widest-variant ${kb(totalAfter)} (${(100 - (totalAfter / totalBefore) * 100).toFixed(1)}% smaller)`,
);
