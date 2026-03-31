import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Fashn from "fashn";
import { findGarmentImage } from "@/lib/garment-images";
import fs from "fs";
import path from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 40000,
});

const fashn = process.env.FASHN_API_KEY
  ? new Fashn({ apiKey: process.env.FASHN_API_KEY })
  : null;

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (jsonMatch) return jsonMatch[1];
  return text;
}

// ═══════════════════════════════════════════════════════════════════════
// JOB STORE
// ═══════════════════════════════════════════════════════════════════════
interface NamshiProduct {
  title: string;
  brand: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  productUrl: string;
  sku: string;
  sizes: string[];
}

interface SearchResult {
  query: string;
  category: string;
  candidates: { brand: string; title: string; imageUrl: string; price: number }[];
  pickedIndex: number;
  picked: NamshiProduct | null;
}

interface OutfitResult {
  outfit: { name: string; items: { name: string; brand: string; category: string; price: number; currency: string }[]; totalPrice: number };
  analysis: Record<string, unknown>;
  tryOnImage: string | null;
  products: { top: NamshiProduct | null; bottom: NamshiProduct | null };
  searchResults: { top: SearchResult | null; bottom: SearchResult | null };
}

interface Job {
  id: string;
  status: "running" | "completed" | "failed";
  step: string;
  outfits: OutfitResult[];
  currentOutfitIndex: number;
  // Live search results for the outfit currently being processed
  liveSearchResults?: { top: SearchResult | null; bottom: SearchResult | null };
  error?: string;
  createdAt: number;
}

const jobs = new Map<string, Job>();

setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  jobs.forEach((job, id) => {
    if (job.createdAt < cutoff) jobs.delete(id);
  });
}, 5 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════════════
// SIZE ESTIMATION from height + weight
// ═══════════════════════════════════════════════════════════════════════
function estimateSize(height: string, weight: string, gender: string): { alpha: string; topSize: string; bottomSize: string; description: string } {
  const h = parseInt(height) || 170;
  const w = parseInt(weight) || 70;
  const bmi = w / ((h / 100) ** 2);

  let alpha: string;
  if (gender === "women") {
    if (bmi < 18.5) alpha = "XS";
    else if (bmi < 21) alpha = "S";
    else if (bmi < 24) alpha = "M";
    else if (bmi < 28) alpha = "L";
    else if (bmi < 32) alpha = "XL";
    else alpha = "2XL";
  } else {
    if (bmi < 19) alpha = "S";
    else if (bmi < 22) alpha = "M";
    else if (bmi < 25) alpha = "L";
    else if (bmi < 29) alpha = "XL";
    else alpha = "2XL";
  }

  // Estimate bottom size (waist in inches) from height/weight/gender
  let waist: number;
  if (gender === "women") {
    waist = Math.round(w * 0.35 + h * 0.05 - 5);
  } else {
    waist = Math.round(w * 0.38 + h * 0.04 - 2);
  }
  const bottomSize = `${Math.max(26, Math.min(42, waist))}`;

  return {
    alpha,
    topSize: alpha,
    bottomSize,
    description: `${h}cm / ${w}kg → Size ${alpha} (top), ~${bottomSize}" waist (bottom)`,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// PIPELINE STEPS
// ═══════════════════════════════════════════════════════════════════════

const NAMSHI_HEADERS: Record<string, string> = {
  accept: "application/json", "x-mp": "namshi_v2", "x-platform": "android",
  "x-cms": "v2", "x-content": "mobile", "content-type": "application/json",
  "x-device-id": "f027dee88bac2c16", "x-build": "17630", "x-device-type": "mobile",
  "x-appversion": "15.2", "x-visitor-id": "69b6aeee-8535-4eca-abab-3f39ccdd8e1f",
  "x-locale": "en-ae", "user-agent": "okhttp/4.12.0",
};

async function searchNamshi(query: string, gender: string = "men"): Promise<NamshiProduct[]> {
  try {
    const cat = gender === "women" ? "women" : "men";
    const url = `https://apiv2.namshi.com/_svc/catalog/catalog/${cat}/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: NAMSHI_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return [];
    const data = await response.json();
    const products: NamshiProduct[] = [];
    for (const section of data.data || [])
      for (const col of section.columns || [])
        for (const mod of col.modules || [])
          if (mod.type === "productBox" && mod.product) {
            const p = mod.product;
            const ik = (p.imageKeys || [])[0];
            if (!ik) continue;
            const sizes: string[] = [];
            for (const field of [p.sizes, p.availableSizes, p.sizeOptions, p.variants]) {
              if (Array.isArray(field) && field.length > 0) {
                for (const s of field) {
                  if (typeof s === "string") sizes.push(s);
                  else if (s?.label) sizes.push(s.label);
                  else if (s?.size) sizes.push(String(s.size));
                  else if (s?.value) sizes.push(String(s.value));
                  else if (s?.name) sizes.push(s.name);
                }
                break;
              }
            }
            const skuMatch = (p.uri || "").match(/-(\d+)\.html/);
            products.push({
              title: p.title || "", brand: p.brand || "",
              price: p.salePrice || p.normalPrice || 0, originalPrice: p.normalPrice || 0,
              imageUrl: `https://f.nooncdn.com/p/${ik}`,
              productUrl: `https://www.namshi.com${p.uri || ""}`,
              sku: p.sku || p.parentSku || (skuMatch ? skuMatch[1] : ""),
              sizes,
            });
          }
    return products;
  } catch { return []; }
}

async function fetchAvailableSizes(productUrl: string): Promise<string[]> {
  if (!productUrl) return [];
  try {
    const path = productUrl.replace("https://www.namshi.com", "").replace(/^\//, "");
    const apiUrl = `https://www.namshi.com/_svc/catalog/catalog/uae-en/${path}`;
    const r = await fetch(apiUrl, {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "accept": "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return [];
    const json = await r.json();
    const variants = json?.data?.product?.variants;
    if (!Array.isArray(variants)) return [];
    const available = variants
      .filter((v: { stockInfo?: { code?: string }; maxQty?: number }) =>
        v.stockInfo?.code !== "out_of_stock" && (v.maxQty === undefined || v.maxQty > 0))
      .map((v: { title?: string; sizeUnitsConversions?: Record<string, string> }) =>
        v.sizeUnitsConversions?.ALPHA || v.title || "")
      .filter(Boolean);
    return [...new Set(available)] as string[];
  } catch (e) {
    console.log("[Namshi] Size fetch failed:", (e as Error).message);
    return [];
  }
}

// Generate 3 DIFFERENT outfits in one Claude call
async function generate3Outfits(photoBase64: string, mediaType: string, profile: Record<string, unknown>, occasion: string, gender: string, sizeInfo?: { alpha: string; bottomSize: string; description: string }, height?: string, weight?: string) {
  const genderLabel = gender === "women" ? "women's" : "men's";
  const bodyInfo = [
    height ? `Height: ${height}cm` : "",
    weight ? `Weight: ${weight}kg` : "",
    sizeInfo ? `Estimated size: ${sizeInfo.description}` : "",
    (profile as { bodyType?: string }).bodyType ? `Body type: ${(profile as { bodyType?: string }).bodyType}` : "",
  ].filter(Boolean).join(" | ");

  // Build message content: include photo if available, text-only for body-type users
  const messageContent: Anthropic.MessageCreateParams["messages"][0]["content"] = [];
  if (photoBase64) {
    messageContent.push({ type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: photoBase64 } });
  }
  messageContent.push({ type: "text", text: `You are an expert personal stylist for the GCC market. ${photoBase64 ? "Look at this person's photo and create" : "Based on the profile below, create"} 3 COMPLETELY DIFFERENT ${genderLabel} outfits for: ${occasion}.

Style Profile: ${JSON.stringify(profile)}
Gender: ${gender}
Body measurements: ${bodyInfo || "Not provided"}
Recommended clothing size: ${sizeInfo?.alpha || "M"} (top), ~${sizeInfo?.bottomSize || "32"}" (bottom waist)

Create outfits using ${genderLabel} items findable on Namshi (UAE's biggest fashion store).

Here are brands Namshi carries for ${gender} — you MUST use a DIFFERENT brand for EVERY single item across all 3 outfits (6 unique brands minimum):
${gender === "women"
  ? "Mango, H&M, Vero Moda, ONLY, Dorothy Perkins, Topshop, New Look, River Island, Miss Selfridge, Forever 21, DeFacto, LC Waikiki, Trendyol, Stradivarius, Bershka, Pull&Bear, Pieces, Vila, Object, Noisy May"
  : "Mango, H&M, GANT, Superdry, Lacoste, BOSS, Tommy Hilfiger, Calvin Klein, Adidas, Nike, Polo Ralph Lauren, Jack & Jones, Selected Homme, DeFacto, LC Waikiki, Puma, New Balance, Levi's, Bershka, Celio"}

Return JSON array of 3 outfits:
[
  {"name":"Creative name 1","items":[{"name":"Specific product","brand":"Brand A","category":"tops","price":250,"currency":"AED","searchQuery":"Brand A specific product ${gender}","fashnPrompt":"apply this polo shirt"},{"name":"...","brand":"Brand B","category":"bottoms","price":200,"currency":"AED","searchQuery":"Brand B specific product ${gender}","fashnPrompt":"apply this chino trouser"}],"totalPrice":450},
  {"name":"Creative name 2 (different brands!)","items":[...],"totalPrice":...},
  {"name":"Creative name 3 (different brands!)","items":[...],"totalPrice":...}
]

CRITICAL RULES:
- Each outfit MUST have exactly 1 top + 1 bottom
- EVERY item across ALL 3 outfits must be a DIFFERENT brand — no brand appears twice!
  Example: Outfit 1 top=Mango, bottom=H&M | Outfit 2 top=BOSS, bottom=GANT | Outfit 3 top=Lacoste, bottom=Calvin Klein
- ALL 3 outfits must use DIFFERENT styles (not just different colors of the same thing)
- searchQuery MUST include "${gender}" keyword (e.g. "Mango linen shirt ${gender}")
- searchQuery must NEVER include size, waist, height, weight, or any measurements — just brand + product type + gender (e.g. "Tommy Hilfiger chino trousers men" NOT "Tommy Hilfiger chino trousers men 26 waist")
- fashnPrompt: a short instruction for virtual try-on AI to apply this garment (e.g. "apply this polo shirt", "apply this slim chino", "apply this blazer", "apply this midi skirt", "apply this jogger pants"). Be specific about the garment type.
- For "${occasion}": use appropriate garment types (beach = shorts/swim shorts, office = formal, gym = athletic, etc.)
- Prices in AED, realistic for the brand
- Consider this person's body type, skin tone, and color season
- SIZING: This person wears size ${sizeInfo?.alpha || "M"} tops and ~${sizeInfo?.bottomSize || "32"}" waist bottoms. Choose items and brands that commonly stock these sizes. For body type "${(profile as { bodyType?: string }).bodyType || "average"}":
  * Pick flattering cuts (e.g. slim fit for athletic builds, regular/relaxed for oval/fuller builds)
  * Avoid too-tight or too-loose styles for this body shape

Return ONLY the JSON array.` });

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001", max_tokens: 2500,
    messages: [{ role: "user", content: messageContent }],
  });
  const tb = response.content.find((b) => b.type === "text");
  if (!tb || tb.type !== "text") throw new Error("No response");
  const parsed = JSON.parse(extractJSON(tb.text));
  return Array.isArray(parsed) ? parsed : [parsed];
}

async function aiPickBest(photoBase64: string, mediaType: string, itemDesc: string, candidates: NamshiProduct[], profile: Record<string, unknown>, excludeSkus: string[] = []): Promise<number> {
  // Filter out already-used products
  const filtered = candidates.map((c, i) => ({ ...c, origIdx: i })).filter(c => !excludeSkus.includes(c.sku));
  if (filtered.length === 0) return 0;
  if (filtered.length === 1) return filtered[0].origIdx;

  const list = filtered.slice(0, 8).map((c, i) => `${i}: "${c.brand} ${c.title}" — ${c.price} AED`).join("\n");
  try {
    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];
    if (photoBase64) {
      content.push({ type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: photoBase64 } });
    }
    content.push({ type: "text", text: `Pick the best "${itemDesc}" for ${photoBase64 ? "this person" : "someone with profile"} (${(profile as { archetype?: string }).archetype || ""}, ${(profile as { colorSeason?: string }).colorSeason || ""}):\n${list}\nReply JSON: {"pick": 0}` });
    const r = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001", max_tokens: 100,
      messages: [{ role: "user", content }],
    });
    const tb = r.content.find((b) => b.type === "text");
    if (!tb || tb.type !== "text") return filtered[0].origIdx;
    const res = JSON.parse(extractJSON(tb.text));
    const pickIdx = Math.min(typeof res.pick === "number" ? res.pick : 0, filtered.length - 1);
    return filtered[pickIdx].origIdx;
  } catch { return filtered[0].origIdx; }
}

async function findBestProduct(photoBase64: string, mediaType: string, item: { name: string; brand: string; category: string; searchQuery?: string }, profile: Record<string, unknown>, gender: string = "men", excludeSkus: string[] = [], userSize?: string): Promise<{ url: string; product?: NamshiProduct; searchResult?: SearchResult }> {
  const query = item.searchQuery || `${item.brand} ${item.name} ${gender}`;
  const results = await searchNamshi(query, gender);
  if (results.length > 0) {
    const candidates = results.slice(0, 8);
    const idx = await aiPickBest(photoBase64, mediaType, `${item.brand} ${item.name}`, candidates, profile, excludeSkus);
    let picked = results[idx];

    // Fetch sizes for picked product
    if (picked.sizes.length === 0 && picked.productUrl) {
      picked.sizes = await fetchAvailableSizes(picked.productUrl);
    }

    // If user's size is not in stock, try other candidates
    if (userSize && picked.sizes.length > 0 && !sizeMatches(picked.sizes, userSize)) {
      console.log(`[Size] ${picked.title} doesn't have size ${userSize} (has: ${picked.sizes.join(",")}). Checking alternatives...`);
      for (let altIdx = 0; altIdx < candidates.length; altIdx++) {
        if (altIdx === idx) continue;
        if (excludeSkus.includes(candidates[altIdx].sku)) continue;
        const alt = candidates[altIdx];
        if (alt.sizes.length === 0 && alt.productUrl) {
          alt.sizes = await fetchAvailableSizes(alt.productUrl);
        }
        if (alt.sizes.length === 0 || sizeMatches(alt.sizes, userSize)) {
          console.log(`[Size] Switched to ${alt.title} (has size ${userSize})`);
          picked = alt;
          break;
        }
      }
    }

    const searchResult: SearchResult = {
      query, category: item.category,
      candidates: candidates.map((c) => ({ brand: c.brand, title: c.title, imageUrl: c.imageUrl, price: c.price })),
      pickedIndex: candidates.indexOf(picked), picked,
    };
    return { url: picked.imageUrl, product: picked, searchResult };
  }
  const catalogUrl = findGarmentImage(query, item.category);
  return { url: catalogUrl || "" };
}

// Check if any available size matches the user's size (fuzzy match)
function sizeMatches(availableSizes: string[], userSize: string): boolean {
  const target = userSize.toUpperCase().trim();
  return availableSizes.some((s) => {
    const sz = s.toUpperCase().trim();
    return sz === target || sz.includes(target) || target.includes(sz);
  });
}

// Product-to-model: applies garment onto model image (user photo or body shape)
async function fashnProductToModel(model: string, garment: string, promptText: string): Promise<string | null> {
  if (!fashn) { console.log("[FASHN] No API key configured"); return null; }
  console.log(`[FASHN] product-to-model: "${promptText}", model=${model.substring(0, 30)}..., garment=${garment.substring(0, 50)}...`);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await (fashn.predictions.subscribe as any)({
      model_name: "product-to-model",
      inputs: {
        model_image: model,
        product_image: garment,
        prompt: promptText,
        mode: "fast",
        resolution: "1k",
        output_format: "png",
      },
      onQueueUpdate: (s: { status: string }) => console.log(`[FASHN] ${s.status}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
    console.log(`[FASHN] Result: ${r.status}, has output: ${!!r.output?.[0]}`);
    return r.status === "completed" && r.output?.[0] ? r.output[0] : null;
  } catch (e) { console.error(`[FASHN] Error:`, e); return null; }
}


async function downloadToDataUri(url: string): Promise<string> {
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const ct = r.headers.get("content-type") || "image/png";
  const buf = await r.arrayBuffer();
  return `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
}

async function analyzeOutfit(photoBase64: string, mediaType: string, outfit: { name: string; items: { name: string; brand: string; category: string; price: number; currency: string }[] }, profile: Record<string, unknown>, products: { category: string; product?: NamshiProduct }[]) {
  const items = outfit.items.map((item) => {
    const p = products.find((x) => x.category === item.category);
    return p?.product ? `- ${item.category}: ${p.product.brand} ${p.product.title} (${p.product.price} AED)` : `- ${item.category}: ${item.brand} ${item.name} (${item.price} ${item.currency})`;
  }).join("\n");
  const analyzeContent: Anthropic.MessageCreateParams["messages"][0]["content"] = [];
  if (photoBase64) {
    analyzeContent.push({ type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: photoBase64 } });
  }
  analyzeContent.push({ type: "text", text: `You are a world-class stylist. ${photoBase64 ? "This person is" : "A client is"} trying on:\n\n**${outfit.name}**\n${items}\n\nProfile: ${(profile as { archetype?: string }).archetype || ""}, ${(profile as { colorSeason?: string }).colorSeason || ""}, ${(profile as { bodyType?: string }).bodyType || ""}\n\nReturn JSON: {"overallLook":"1 short sentence max 15 words","fitAnalysis":"1 short sentence max 12 words","colorHarmony":"1 short sentence max 12 words","stylingTips":["short tip 1","short tip 2","short tip 3"],"confidenceScore":88,"verdict":"1 punchy sentence max 10 words"}\n\nIMPORTANT: Keep ALL text very brief and punchy. No fluff.` });
  const r = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001", max_tokens: 1000,
    messages: [{ role: "user", content: analyzeContent }],
  });
  const tb = r.content.find((b) => b.type === "text");
  if (!tb || tb.type !== "text") throw new Error("No response");
  const a = JSON.parse(extractJSON(tb.text));
  if (!Array.isArray(a.stylingTips)) a.stylingTips = [a.stylingTips || "Great look!"];
  return a;
}

// ═══════════════════════════════════════════════════════════════════════
// PIPELINE — generates 3 different outfits
// ═══════════════════════════════════════════════════════════════════════
async function runPipeline(jobId: string, photoBase64: string, mediaType: string, profile: Record<string, unknown>, occasion: string, gender: string = "men", height: string = "", weight: string = "", hasPhoto: boolean = true, bodyShapeImage: string | null = null) {
  const job = jobs.get(jobId)!;
  const mt = mediaType || "image/jpeg";
  let personUri = hasPhoto ? `data:${mt};base64,${photoBase64}` : "";

  // For body-type users with no photo, read body shape image from public/ as model
  if (!hasPhoto && bodyShapeImage) {
    try {
      const filePath = path.join(process.cwd(), "public", decodeURIComponent(bodyShapeImage));
      console.log(`[Job ${jobId}] Reading body shape image: ${filePath}`);
      const buf = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
      personUri = `data:${mime};base64,${buf.toString("base64")}`;
      console.log(`[Job ${jobId}] Body shape image loaded as model (${(buf.length / 1024).toFixed(0)}KB)`);
    } catch (e) {
      console.error(`[Job ${jobId}] Failed to load body shape image:`, e);
    }
  }

  // Compute user's clothing size from height + weight
  const sizeInfo = (height && weight) ? estimateSize(height, weight, gender) : undefined;
  if (sizeInfo) console.log(`[Job ${jobId}] Size: ${sizeInfo.description}`);

  // Track used SKUs to prevent repeats across outfits
  const usedSkus: string[] = [];

  try {
    // Step 1: Generate 3 different outfits in one call
    job.step = "Designing 3 outfit options...";
    console.log(`[Job ${jobId}] Generating 3 outfits for "${occasion}" (${gender})...`);
    const outfits = await generate3Outfits(photoBase64, mt, profile, occasion, gender, sizeInfo, height, weight);
    console.log(`[Job ${jobId}] Got ${outfits.length} outfits: ${outfits.map((o: { name: string }) => o.name).join(", ")}`);

    // Process all 3 outfits in parallel for speed
    job.step = "Searching products & generating try-ons for all 3 looks...";

    const formatProduct = (p: NamshiProduct) => ({
      brand: p.brand, title: p.title, price: p.price,
      originalPrice: p.originalPrice, productUrl: p.productUrl,
      imageUrl: p.imageUrl, sizes: p.sizes, sku: p.sku,
    });

    const processOutfit = async (outfit: { name: string; items: { name: string; brand: string; category: string; price: number; currency: string; searchQuery?: string; fashnPrompt?: string }[]; totalPrice: number }, i: number) => {
      console.log(`[Job ${jobId}] Look ${i + 1}/3: Starting "${outfit.name}"...`);

      const topItem = outfit.items.find((item) => item.category === "tops" || item.category === "outerwear");
      const bottomItem = outfit.items.find((item) => item.category === "bottoms");

      const topUserSize = sizeInfo?.alpha;
      const bottomUserSize = sizeInfo?.alpha;
      const [topMatch, bottomMatch] = await Promise.all([
        topItem ? findBestProduct(photoBase64, mt, topItem, profile, gender, usedSkus, topUserSize) : Promise.resolve(null),
        bottomItem ? findBestProduct(photoBase64, mt, bottomItem, profile, gender, usedSkus, bottomUserSize) : Promise.resolve(null),
      ]);

      if (topMatch?.product) usedSkus.push(topMatch.product.sku);
      if (bottomMatch?.product) usedSkus.push(bottomMatch.product.sku);

      const topFashnPrompt = topItem?.fashnPrompt || `apply this ${topItem?.name || "top"}`;
      const bottomFashnPrompt = bottomItem?.fashnPrompt || `apply this ${bottomItem?.name || "bottom"}`;

      // FASHN: product-to-model — apply top then bottom
      const runFashn = async (): Promise<string | null> => {
        if (!fashn || !personUri) return null;
        let img = personUri;

        if (topMatch?.url) {
          const r = await fashnProductToModel(img, topMatch.url, topFashnPrompt);
          if (r) {
            if (bottomMatch?.url) {
              img = await downloadToDataUri(r);
            } else {
              return r;
            }
          }
        }

        if (bottomMatch?.url) {
          const r = await fashnProductToModel(img, bottomMatch.url, bottomFashnPrompt);
          if (r) return r;
        }
        return null;
      };

      const pickedProducts = [
        ...(topMatch?.product ? [{ category: topItem?.category || "tops", product: topMatch.product }] : []),
        ...(bottomMatch?.product ? [{ category: "bottoms", product: bottomMatch.product }] : []),
      ];

      const [tryOnImage, analysis] = await Promise.all([
        runFashn(),
        analyzeOutfit(photoBase64, mt, outfit, profile, pickedProducts),
      ]);

      const result: OutfitResult = {
        outfit: { name: outfit.name, items: outfit.items, totalPrice: outfit.totalPrice },
        analysis,
        tryOnImage,
        products: {
          top: topMatch?.product ? formatProduct(topMatch.product) : null,
          bottom: bottomMatch?.product ? formatProduct(bottomMatch.product) : null,
        },
        searchResults: {
          top: topMatch?.searchResult || null,
          bottom: bottomMatch?.searchResult || null,
        },
      };

      // Push to job as soon as done so frontend can show it immediately
      job.outfits.push(result);
      console.log(`[Job ${jobId}] Look ${i + 1}/3 "${outfit.name}" done`);
      return result;
    };

    // Launch all 3 in parallel
    await Promise.all(
      outfits.slice(0, 3).map((outfit: { name: string; items: { name: string; brand: string; category: string; price: number; currency: string; searchQuery?: string; fashnPrompt?: string }[]; totalPrice: number }, i: number) => processOutfit(outfit, i))
    );

    job.step = "Complete!";
    job.status = "completed";
    job.liveSearchResults = undefined;
    console.log(`[Job ${jobId}] All 3 outfits completed`);
  } catch (error) {
    console.error(`[Job ${jobId}] Failed:`, error);
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Pipeline failed";
    job.step = "Failed";
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const { photoBase64, mediaType, profile, occasion, gender, height, weight, bodyShapeImage } = await request.json();
    if (!profile || !occasion) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const resolvedGender = gender || profile?.gender || "men";
    const hasPhoto = !!photoBase64;

    // For body-type users without a photo, we still need a base64 for Claude outfit generation
    // Use a placeholder — Claude will use profile data instead of photo analysis
    const resolvedBase64 = photoBase64 || "";
    const resolvedMediaType = mediaType || "image/jpeg";

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const job: Job = {
      id: jobId,
      status: "running",
      step: "Starting...",
      outfits: [],
      currentOutfitIndex: 0,
      createdAt: Date.now(),
    };
    jobs.set(jobId, job);

    runPipeline(jobId, resolvedBase64, resolvedMediaType, profile, occasion, resolvedGender, height || "", weight || "", hasPhoto, bodyShapeImage || null);

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error("[AI Stylist] Error:", error);
    return NextResponse.json({ error: "Failed to start job" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const jobId = new URL(request.url).searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

  const job = jobs.get(jobId);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  if (job.status === "completed") {
    return NextResponse.json({
      status: "completed",
      step: job.step,
      outfits: job.outfits,
    });
  }

  if (job.status === "failed") {
    return NextResponse.json({
      status: "failed",
      step: job.step,
      error: job.error,
      outfits: job.outfits, // return any completed outfits
    });
  }

  return NextResponse.json({
    status: "running",
    step: job.step,
    currentOutfitIndex: job.currentOutfitIndex,
    outfits: job.outfits,
    liveSearchResults: job.liveSearchResults || null,
  });
}
