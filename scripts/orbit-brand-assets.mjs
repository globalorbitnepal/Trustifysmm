import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const brand = path.join(process.cwd(), "public", "brand");

async function trimPng(input, output, width) {
  const pipeline = sharp(input).ensureAlpha().trim({ threshold: 12 });
  const meta = await pipeline.metadata();
  const w = width ?? Math.min(1920, (meta.width ?? 900) * 2);
  await pipeline.resize({ width: w, withoutEnlargement: false }).png({ compressionLevel: 9 }).toFile(output);
  console.log("wrote", output);
}

await trimPng(path.join(brand, "logo-header-clear.png"), path.join(brand, "orbit-logo-light.png"), 964);
await trimPng(path.join(brand, "logo-clear.png"), path.join(brand, "orbit-logo-dark.png"), 964);

const heroSrc = fs.existsSync(path.join(brand, "hero-orbit-cluster.png"))
  ? path.join(brand, "hero-orbit-cluster.png")
  : path.join(brand, "hero-cluster-crop.png");
await sharp(heroSrc)
  .ensureAlpha()
  .trim({ threshold: 18 })
  .resize({ width: 1804, withoutEnlargement: false })
  .png({ compressionLevel: 9 })
  .toFile(path.join(brand, "orbit-hero-art.png"));
console.log("wrote orbit-hero-art.png");