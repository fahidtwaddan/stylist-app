/**
 * Generate occasion preview images using FASHN AI try-on.
 *
 * Usage:
 *   npx tsx scripts/generate-occasion-images.ts
 *
 * Requires: FASHN_API_KEY in .env.local
 *
 * For each occasion + gender, this script:
 *  1. Searches Namshi for example top & bottom garments
 *  2. Applies them to the model image via FASHN (top first, then bottom)
 *  3. Saves the final image to public/model/{gender}/{occasion_id}.png
 */

import * as fs from "fs";
import * as path from "path";
import Fashn from "fashn";

// Load env
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const fashn = new Fashn({ apiKey: process.env.FASHN_API_KEY! });

const NAMSHI_HEADERS: Record<string, string> = {
  accept: "application/json", "x-mp": "namshi_v2", "x-platform": "android",
  "x-cms": "v2", "x-content": "mobile", "content-type": "application/json",
  "x-device-id": "f027dee88bac2c16", "x-build": "17630", "x-device-type": "mobile",
  "x-appversion": "15.2", "x-visitor-id": "69b6aeee-8535-4eca-abab-3f39ccdd8e1f",
  "x-locale": "en-ae", "user-agent": "okhttp/4.12.0",
};

const OCCASIONS = [
  { id: "brunch", men: { top: "linen shirt men", bottom: "chino pants men" }, women: { top: "blouse women", bottom: "midi skirt women" } },
  { id: "office", men: { top: "formal shirt men slim fit", bottom: "dress pants men" }, women: { top: "blazer women", bottom: "tailored trousers women" } },
  { id: "evening", men: { top: "black shirt men slim", bottom: "slim fit trousers men" }, women: { top: "satin top women", bottom: "wide leg pants women" } },
  { id: "date", men: { top: "polo shirt men", bottom: "slim chinos men" }, women: { top: "wrap top women", bottom: "pencil skirt women" } },
  { id: "beach", men: { top: "resort shirt men", bottom: "swim shorts men" }, women: { top: "crop top women", bottom: "linen pants women" } },
  { id: "wedding", men: { top: "suit blazer men", bottom: "suit trousers men" }, women: { top: "embroidered top women", bottom: "maxi skirt women" } },
  { id: "gym", men: { top: "sport t-shirt men", bottom: "jogger pants men" }, women: { top: "sports bra top women", bottom: "leggings women" } },
  { id: "travel", men: { top: "hoodie men", bottom: "cargo pants men" }, women: { top: "oversized sweater women", bottom: "jogger pants women" } },
  { id: "modest", men: { top: "long sleeve shirt men", bottom: "loose trousers men" }, women: { top: "tunic women", bottom: "palazzo pants women" } },
  { id: "streetwear", men: { top: "graphic t-shirt men", bottom: "cargo pants men" }, women: { top: "oversized t-shirt women", bottom: "cargo pants women" } },
  { id: "mall", men: { top: "casual t-shirt men", bottom: "jeans men" }, women: { top: "casual top women", bottom: "jeans women" } },
  { id: "ramadan", men: { top: "thobe men", bottom: "formal trousers men" }, women: { top: "abaya women", bottom: "wide leg trousers women" } },
];

async function searchNamshiImage(query: string, gender: string): Promise<string> {
  const cat = gender === "women" ? "women" : "men";
  const url = `https://apiv2.namshi.com/_svc/catalog/catalog/${cat}/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: NAMSHI_HEADERS });
  if (!res.ok) throw new Error(`Namshi search failed for "${query}"`);
  const data = await res.json();

  for (const section of data.data || [])
    for (const col of section.columns || [])
      for (const mod of col.modules || [])
        if (mod.type === "productBox" && mod.product) {
          const ik = (mod.product.imageKeys || [])[0];
          if (ik) return `https://f.nooncdn.com/p/${ik}`;
        }

  throw new Error(`No product found for "${query}"`);
}

async function downloadToDataUri(url: string): Promise<string> {
  const r = await fetch(url);
  const ct = r.headers.get("content-type") || "image/png";
  const buf = await r.arrayBuffer();
  return `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
}

async function downloadToFile(url: string, filePath: string): Promise<void> {
  const r = await fetch(url);
  const buf = await r.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buf));
}

async function fashnTryOn(modelImage: string, garmentUrl: string, category: "tops" | "bottoms", gender: string = "men"): Promise<string | null> {
  const topPrompts: Record<string, string> = { men: "apply shirt", women: "apply top" };
  const bottomPrompts: Record<string, string> = { men: "apply pant", women: "apply skirt or pant" };
  const promptText = category === "tops" ? (topPrompts[gender] || "apply top") : (bottomPrompts[gender] || "apply bottom");
  try {
    const r = await fashn.predictions.subscribe({
      model_name: "product-to-model",
      inputs: {
        model_image: modelImage,
        product_image: garmentUrl,
        prompt: promptText,
        resolution: "1k",
        output_format: "png",
      },
      onQueueUpdate: (s) => process.stdout.write(`  [FASHN] ${s.status}\r`),
    });
    return r.status === "completed" && r.output?.[0] ? r.output[0] : null;
  } catch (e) {
    console.error(`  [FASHN] Error:`, (e as Error).message);
    return null;
  }
}

function fileToDataUri(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function generateForOccasion(occasionId: string, topQuery: string, bottomQuery: string, gender: string) {
  const outPath = path.resolve(__dirname, `../public/model/${gender}/${occasionId}.png`);

  if (fs.existsSync(outPath)) {
    console.log(`  [SKIP] ${outPath} already exists`);
    return;
  }

  console.log(`  Searching Namshi: top="${topQuery}", bottom="${bottomQuery}"`);

  let topUrl: string, bottomUrl: string;
  try {
    [topUrl, bottomUrl] = await Promise.all([
      searchNamshiImage(topQuery, gender),
      searchNamshiImage(bottomQuery, gender),
    ]);
  } catch (e) {
    console.error(`  [SKIP] Search failed:`, (e as Error).message);
    return;
  }

  console.log(`  Found garments. Starting FASHN try-on...`);

  // Read model image from disk as data URI
  const modelAbsPath = path.resolve(__dirname, `../public/model/${gender}-model.png`);
  const modelDataUri = fileToDataUri(modelAbsPath);

  console.log(`  Applying top...`);
  const afterTop = await fashnTryOn(modelDataUri, topUrl, "tops", gender);

  if (!afterTop) {
    console.error(`  [FAIL] Top try-on failed`);
    return;
  }

  // Step 2: Download intermediate, apply bottom
  console.log(`  Applying bottom...`);
  const intermediateUri = await downloadToDataUri(afterTop);
  const afterBottom = await fashnTryOn(intermediateUri, bottomUrl, "bottoms", gender);

  const finalUrl = afterBottom || afterTop;
  console.log(`  Downloading final image...`);
  await downloadToFile(finalUrl, outPath);
  console.log(`  Saved: ${outPath}`);
}

async function main() {
  if (!process.env.FASHN_API_KEY) {
    console.error("Error: FASHN_API_KEY not found in .env.local");
    process.exit(1);
  }

  const genders = ["men", "women"] as const;

  for (const gender of genders) {
    console.log(`\n=== Generating ${gender}'s occasion images ===\n`);

    for (const occ of OCCASIONS) {
      const queries = occ[gender];
      console.log(`[${gender}] ${occ.id}:`);
      await generateForOccasion(occ.id, queries.top, queries.bottom, gender);
      console.log();
    }
  }

  console.log("\nDone! All occasion images generated.");
}

main().catch(console.error);
