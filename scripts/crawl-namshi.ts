/**
 * Namshi Product Crawler
 * Fetches men's clothing from Namshi API and saves to a local catalog JSON + downloads images.
 *
 * Usage: npx tsx scripts/crawl-namshi.ts
 */

import fs from "fs";
import path from "path";

const NAMSHI_HEADERS = {
  accept: "application/json",
  "x-mp": "namshi_v2",
  "x-platform": "android",
  "x-cms": "v2",
  "x-content": "mobile",
  "content-type": "application/json",
  "cache-control": "no-cache",
  "x-device-id": "f027dee88bac2c16",
  "x-build": "17630",
  "x-device-type": "mobile",
  "x-appversion": "15.2",
  "x-visitor-id": "69b6aeee-8535-4eca-abab-3f39ccdd8e1f",
  "x-locale": "en-ae",
  "user-agent": "okhttp/4.12.0",
};

// Categories to crawl with search queries
const CATEGORIES = [
  // Tops
  { query: "polo shirt", category: "tops", style: "smart casual" },
  { query: "t-shirt men", category: "tops", style: "casual" },
  { query: "dress shirt men", category: "tops", style: "formal" },
  { query: "linen shirt men", category: "tops", style: "resort" },
  { query: "sweater men", category: "tops", style: "smart casual" },
  // Outerwear
  { query: "blazer men", category: "outerwear", style: "formal" },
  { query: "leather jacket men", category: "outerwear", style: "edgy" },
  { query: "bomber jacket men", category: "outerwear", style: "streetwear" },
  { query: "hoodie men", category: "outerwear", style: "streetwear" },
  { query: "denim jacket men", category: "outerwear", style: "casual" },
  // Bottoms
  { query: "chinos men", category: "bottoms", style: "smart casual" },
  { query: "jeans men slim", category: "bottoms", style: "casual" },
  { query: "trousers men formal", category: "bottoms", style: "formal" },
  { query: "shorts men", category: "bottoms", style: "casual" },
  { query: "joggers men", category: "bottoms", style: "athleisure" },
  // Footwear
  { query: "sneakers men white", category: "footwear", style: "casual" },
  { query: "loafers men", category: "footwear", style: "smart casual" },
  { query: "formal shoes men", category: "footwear", style: "formal" },
];

interface NamshiProduct {
  id: string;
  label: string;
  brand: string;
  price: number;
  originalPrice: number;
  currency: string;
  imageUrl: string;
  localImage: string;
  productUrl: string;
  category: string;
  style: string;
  keywords: string[];
  color: string;
  sku: string;
}

function extractColor(title: string): string {
  const colors = [
    "black", "white", "navy", "blue", "grey", "gray", "red", "green",
    "olive", "khaki", "beige", "tan", "camel", "brown", "cream",
    "pink", "burgundy", "maroon", "charcoal", "indigo", "teal",
    "coral", "mustard", "lavender", "purple", "orange", "yellow",
  ];
  const lower = title.toLowerCase();
  for (const c of colors) {
    if (lower.includes(c)) return c === "gray" ? "grey" : c;
  }
  return "";
}

function extractKeywords(title: string, category: string): string[] {
  const lower = title.toLowerCase();
  const keywords: string[] = [];

  // Category-specific keywords
  const kwMap: Record<string, string[]> = {
    tops: ["shirt", "polo", "t-shirt", "tee", "henley", "sweater", "knit", "linen", "oxford", "dress shirt", "button"],
    outerwear: ["blazer", "jacket", "coat", "hoodie", "bomber", "denim", "leather", "puffer", "windbreaker"],
    bottoms: ["chinos", "jeans", "trousers", "pants", "shorts", "joggers", "sweatpants", "cargo", "slim", "straight"],
    footwear: ["sneakers", "loafers", "boots", "shoes", "sandals", "trainers", "oxford", "derby"],
  };

  for (const kw of kwMap[category] || []) {
    if (lower.includes(kw)) keywords.push(kw);
  }

  // Add color
  const color = extractColor(title);
  if (color) keywords.push(color);

  return keywords;
}

async function searchNamshi(query: string): Promise<any[]> {
  const url = `https://apiv2.namshi.com/_svc/catalog/catalog/men/search?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: NAMSHI_HEADERS,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`  [WARN] Search "${query}" returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    // Extract products from productBox modules
    const products: any[] = [];
    for (const section of data.data || []) {
      for (const col of section.columns || []) {
        for (const mod of col.modules || []) {
          if (mod.type === "productBox" && mod.product) {
            products.push(mod.product);
          }
        }
      }
    }

    return products;
  } catch (error) {
    console.error(`  [ERROR] Search "${query}" failed:`, error);
    return [];
  }
}

async function downloadImage(
  imageKey: string,
  filename: string,
  outDir: string
): Promise<boolean> {
  const url = `https://f.nooncdn.com/p/${imageKey}`;
  const outPath = path.join(outDir, filename);

  if (fs.existsSync(outPath)) return true; // Already downloaded

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return false;

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outPath, Buffer.from(buffer));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("=== Namshi Product Crawler ===\n");

  const imgDir = path.join(process.cwd(), "public", "products");
  const catalogPath = path.join(process.cwd(), "src", "data", "namshi-catalog.json");

  // Ensure directories exist
  fs.mkdirSync(imgDir, { recursive: true });
  fs.mkdirSync(path.dirname(catalogPath), { recursive: true });

  const allProducts: NamshiProduct[] = [];
  const seenSkus = new Set<string>();

  for (const cat of CATEGORIES) {
    console.log(`\nSearching: "${cat.query}" (${cat.category})...`);
    const raw = await searchNamshi(cat.query);
    console.log(`  Found ${raw.length} raw products`);

    let added = 0;
    for (const p of raw) {
      if (added >= 8) break; // Max 8 per query
      if (seenSkus.has(p.parentSku)) continue;

      const imageKeys = p.imageKeys || [];
      if (!imageKeys.length) continue;

      const imageKey = imageKeys[0];
      const sku = p.parentSku;
      const filename = `${sku}.jpg`;

      // Download image
      const downloaded = await downloadImage(imageKey, filename, imgDir);
      if (!downloaded) {
        console.log(`  [SKIP] Failed to download image for ${sku}`);
        continue;
      }

      const title = p.title || "";
      const brand = p.brand || "";
      const price = p.salePrice || p.normalPrice || 0;
      const originalPrice = p.normalPrice || price;

      const product: NamshiProduct = {
        id: `namshi-${sku}`,
        label: `${brand} ${title}`.substring(0, 60).trim(),
        brand,
        price,
        originalPrice,
        currency: "AED",
        imageUrl: `https://f.nooncdn.com/p/${imageKey}`,
        localImage: `/products/${filename}`,
        productUrl: `https://www.namshi.com${p.uri || ""}`,
        category: cat.category,
        style: cat.style,
        keywords: extractKeywords(title, cat.category),
        color: extractColor(title),
        sku,
      };

      allProducts.push(product);
      seenSkus.add(sku);
      added++;
    }
    console.log(`  Added ${added} products`);

    // Rate limit
    await new Promise((r) => setTimeout(r, 500));
  }

  // Save catalog
  fs.writeFileSync(catalogPath, JSON.stringify(allProducts, null, 2));

  console.log(`\n=== Done ===`);
  console.log(`Total products: ${allProducts.length}`);
  console.log(`Catalog saved to: ${catalogPath}`);
  console.log(`Images saved to: ${imgDir}`);

  // Summary by category
  const byCat: Record<string, number> = {};
  for (const p of allProducts) {
    byCat[p.category] = (byCat[p.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(byCat)) {
    console.log(`  ${cat}: ${count} products`);
  }
}

main().catch(console.error);
