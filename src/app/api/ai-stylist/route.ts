import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Fashn from "fashn";
import { findGarmentImage } from "@/lib/garment-images";

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

// ─── Namshi Live Search ──────────────────────────────────────────────
const NAMSHI_HEADERS: Record<string, string> = {
  accept: "application/json",
  "x-mp": "namshi_v2",
  "x-platform": "android",
  "x-cms": "v2",
  "x-content": "mobile",
  "content-type": "application/json",
  "x-device-id": "f027dee88bac2c16",
  "x-build": "17630",
  "x-device-type": "mobile",
  "x-appversion": "15.2",
  "x-visitor-id": "69b6aeee-8535-4eca-abab-3f39ccdd8e1f",
  "x-locale": "en-ae",
  "user-agent": "okhttp/4.12.0",
};

interface NamshiProduct {
  title: string;
  brand: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  productUrl: string;
}

async function searchNamshi(query: string): Promise<NamshiProduct[]> {
  try {
    const url = `https://apiv2.namshi.com/_svc/catalog/catalog/men/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: NAMSHI_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return [];
    const data = await response.json();
    const products: NamshiProduct[] = [];
    for (const section of data.data || []) {
      for (const col of section.columns || []) {
        for (const mod of col.modules || []) {
          if (mod.type === "productBox" && mod.product) {
            const p = mod.product;
            const ik = (p.imageKeys || [])[0];
            if (!ik) continue;
            products.push({
              title: p.title || "",
              brand: p.brand || "",
              price: p.salePrice || p.normalPrice || 0,
              originalPrice: p.normalPrice || 0,
              imageUrl: `https://f.nooncdn.com/p/${ik}`,
              productUrl: `https://www.namshi.com${p.uri || ""}`,
            });
          }
        }
      }
    }
    return products;
  } catch {
    return [];
  }
}

// ─── Step 1: Claude generates ONE outfit for the occasion ────────────
async function generateOutfit(
  photoBase64: string,
  mediaType: string,
  profile: Record<string, unknown>,
  occasion: string
) {
  const prompt = `You are an expert personal stylist for the GCC market. Look at this person's photo and create ONE perfect outfit for: ${occasion}.

Style Profile: ${JSON.stringify(profile)}

Create an outfit using items findable on Namshi (UAE's biggest fashion store). Use REAL brand names Namshi carries (Mango, H&M, GANT, Superdry, Lacoste, BOSS, Tommy Hilfiger, Calvin Klein, Adidas, Nike, etc).

Return JSON:
{
  "name": "Creative outfit name",
  "description": "Why this outfit is perfect for ${occasion}",
  "items": [
    {"name": "Specific product name", "brand": "Real brand", "category": "tops", "price": 250, "currency": "AED", "searchQuery": "exact search query for Namshi"},
    {"name": "...", "brand": "...", "category": "bottoms", "price": 200, "currency": "AED", "searchQuery": "..."}
  ],
  "totalPrice": 450
}

RULES:
- Include exactly 1 top/outerwear + 1 bottom (these will be tried on)
- Can include 1-2 more items (shoes, accessories) for the full look description
- searchQuery must be specific enough to find a real product on Namshi
- Prices in AED, realistic for the brand
- Consider this person's body type, skin tone, and color season
- Make it perfect for "${occasion}"

Return ONLY JSON.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: photoBase64 } },
        { type: "text", text: prompt },
      ],
    }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No response");
  return JSON.parse(extractJSON(textBlock.text));
}

// ─── Step 2: AI picks best product from Namshi results ───────────────
async function aiPickBest(
  photoBase64: string,
  mediaType: string,
  itemDesc: string,
  candidates: NamshiProduct[],
  profile: Record<string, unknown>
): Promise<number> {
  if (candidates.length <= 1) return 0;

  const list = candidates.slice(0, 8).map((c, i) => `${i}: "${c.brand} ${c.title}" — ${c.price} AED`).join("\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: photoBase64 } },
        { type: "text", text: `Pick the best "${itemDesc}" for this person (${(profile as { archetype?: string }).archetype || "fashion forward"}, ${(profile as { colorSeason?: string }).colorSeason || ""}):\n${list}\nReply JSON: {"pick": 0}` },
      ],
    }],
  });

  const tb = response.content.find((b) => b.type === "text");
  if (!tb || tb.type !== "text") return 0;
  try {
    const r = JSON.parse(extractJSON(tb.text));
    return Math.min(typeof r.pick === "number" ? r.pick : 0, candidates.length - 1);
  } catch { return 0; }
}

// ─── Step 3: Find best garment (Namshi live → AI pick → catalog) ─────
async function findBestProduct(
  photoBase64: string,
  mediaType: string,
  item: { name: string; brand: string; category: string; searchQuery?: string },
  profile: Record<string, unknown>
): Promise<{ url: string; product?: NamshiProduct }> {
  const query = item.searchQuery || `${item.brand} ${item.name}`;
  console.log(`[Search] "${query}"...`);

  const results = await searchNamshi(query);
  if (results.length > 0) {
    const idx = await aiPickBest(photoBase64, mediaType, `${item.brand} ${item.name}`, results.slice(0, 8), profile);
    const chosen = results[idx];
    console.log(`[AI Pick] ${chosen.brand} ${chosen.title.substring(0, 40)} — ${chosen.price} AED`);
    return { url: chosen.imageUrl, product: chosen };
  }

  // Fallback to catalog
  const catalogUrl = findGarmentImage(query, item.category);
  return { url: catalogUrl || "" };
}

// ─── Step 4: FASHN try-on ────────────────────────────────────────────
async function fashnTryOn(model: string, garment: string, cat: "tops" | "bottoms"): Promise<string | null> {
  if (!fashn) return null;
  try {
    const r = await fashn.predictions.subscribe({
      model_name: "tryon-v1.6",
      inputs: { model_image: model, garment_image: garment, category: cat, mode: "quality", garment_photo_type: "auto", num_samples: 1, output_format: "png" },
      onQueueUpdate: (s) => console.log(`[FASHN][${cat}] ${s.status}`),
    });
    return r.status === "completed" && r.output?.[0] ? r.output[0] : null;
  } catch (e) { console.error("[FASHN]", e); return null; }
}

async function downloadToDataUri(url: string): Promise<string> {
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const ct = r.headers.get("content-type") || "image/png";
  const buf = await r.arrayBuffer();
  return `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
}

// ─── Step 5: Claude analysis ─────────────────────────────────────────
async function analyze(
  photoBase64: string, mediaType: string,
  outfit: { name: string; items: { name: string; brand: string; category: string; price: number; currency: string }[] },
  profile: Record<string, unknown>,
  products: { category: string; product?: NamshiProduct }[]
) {
  const items = outfit.items.map((item) => {
    const p = products.find((x) => x.category === item.category);
    return p?.product ? `- ${item.category}: ${p.product.brand} ${p.product.title} (${p.product.price} AED)` : `- ${item.category}: ${item.brand} ${item.name} (${item.price} ${item.currency})`;
  }).join("\n");

  const r = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001", max_tokens: 1000,
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: photoBase64 } },
      { type: "text", text: `You are a world-class stylist. This person is trying on:\n\n**${outfit.name}**\n${items}\n\nProfile: ${(profile as { archetype?: string }).archetype || ""}, ${(profile as { colorSeason?: string }).colorSeason || ""}, ${(profile as { bodyType?: string }).bodyType || ""}\n\nReturn JSON: {"overallLook":"...","fitAnalysis":"...","colorHarmony":"...","stylingTips":["tip1","tip2","tip3"],"confidenceScore":88,"verdict":"..."}` },
    ]}],
  });
  const tb = r.content.find((b) => b.type === "text");
  if (!tb || tb.type !== "text") throw new Error("No response");
  const a = JSON.parse(extractJSON(tb.text));
  if (!Array.isArray(a.stylingTips)) a.stylingTips = [a.stylingTips || "Great look!"];
  return a;
}

// ─── Main: Full Pipeline ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { photoBase64, mediaType, profile, occasion } = await request.json();
    if (!photoBase64 || !profile || !occasion) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const mt = mediaType || "image/jpeg";
    const personUri = `data:${mt};base64,${photoBase64}`;

    // Step 1: Generate outfit
    console.log(`[Pipeline] Generating outfit for "${occasion}"...`);
    const outfit = await generateOutfit(photoBase64, mt, profile, occasion);
    console.log(`[Pipeline] Outfit: ${outfit.name}`);

    // Step 2: Find real products (parallel)
    const topItem = outfit.items.find((i: { category: string }) => i.category === "tops" || i.category === "outerwear");
    const bottomItem = outfit.items.find((i: { category: string }) => i.category === "bottoms");

    const [topMatch, bottomMatch] = await Promise.all([
      topItem ? findBestProduct(photoBase64, mt, topItem, profile) : Promise.resolve(null),
      bottomItem ? findBestProduct(photoBase64, mt, bottomItem, profile) : Promise.resolve(null),
    ]);

    const pickedProducts = [
      ...(topMatch?.product ? [{ category: topItem?.category || "tops", product: topMatch.product }] : []),
      ...(bottomMatch?.product ? [{ category: "bottoms", product: bottomMatch.product }] : []),
    ];

    // Step 3: FASHN chained try-on + analysis in parallel
    const runFashn = async (): Promise<string | null> => {
      if (!fashn) return null;
      let img = personUri;
      if (topMatch?.url) {
        const r = await fashnTryOn(img, topMatch.url, "tops");
        if (r) { img = bottomMatch?.url ? await downloadToDataUri(r) : r; if (!bottomMatch?.url) return r; }
      }
      if (bottomMatch?.url) {
        const r = await fashnTryOn(img, bottomMatch.url, "bottoms");
        if (r) return r;
      }
      return null;
    };

    const [tryOnImage, analysis] = await Promise.all([
      runFashn(),
      analyze(photoBase64, mt, outfit, profile, pickedProducts),
    ]);

    return NextResponse.json({
      outfit: { name: outfit.name, items: outfit.items, totalPrice: outfit.totalPrice },
      analysis,
      tryOnImage,
      products: {
        top: topMatch?.product ? { brand: topMatch.product.brand, title: topMatch.product.title, price: topMatch.product.price, originalPrice: topMatch.product.originalPrice, productUrl: topMatch.product.productUrl, imageUrl: topMatch.product.imageUrl } : null,
        bottom: bottomMatch?.product ? { brand: bottomMatch.product.brand, title: bottomMatch.product.title, price: bottomMatch.product.price, originalPrice: bottomMatch.product.originalPrice, productUrl: bottomMatch.product.productUrl, imageUrl: bottomMatch.product.imageUrl } : null,
      },
    });
  } catch (error) {
    console.error("[Pipeline] Error:", error);
    return NextResponse.json({ error: "AI styling failed" }, { status: 500 });
  }
}
