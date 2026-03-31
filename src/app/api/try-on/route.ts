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

// ─── Namshi Headers ──────────────────────────────────────────────────
const NAMSHI_HEADERS = {
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
  sku: string;
}

// ─── Live Namshi Search ──────────────────────────────────────────────
async function searchNamshiLive(query: string): Promise<NamshiProduct[]> {
  try {
    const url = `https://apiv2.namshi.com/_svc/catalog/catalog/men/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: NAMSHI_HEADERS,
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const products: NamshiProduct[] = [];

    for (const section of data.data || []) {
      for (const col of section.columns || []) {
        for (const mod of col.modules || []) {
          if (mod.type === "productBox" && mod.product) {
            const p = mod.product;
            const imageKeys = p.imageKeys || [];
            if (!imageKeys.length) continue;

            products.push({
              title: p.title || "",
              brand: p.brand || "",
              price: p.salePrice || p.normalPrice || 0,
              originalPrice: p.normalPrice || 0,
              imageUrl: `https://f.nooncdn.com/p/${imageKeys[0]}`,
              productUrl: `https://www.namshi.com${p.uri || ""}`,
              sku: p.parentSku || "",
            });
          }
        }
      }
    }

    return products;
  } catch (error) {
    console.error("[Namshi] Search failed:", error);
    return [];
  }
}

// ─── Claude Vision: Pick best garment from search results ────────────
// Sends user photo + product list to Claude, returns the best match index
async function aiPickBestGarment(
  photoBase64: string,
  mediaType: string,
  itemDescription: string,
  candidates: NamshiProduct[],
  profile: { archetype?: string; colorSeason?: string; bodyType?: string } | null
): Promise<number> {
  if (candidates.length === 0) return -1;
  if (candidates.length === 1) return 0;

  const candidateList = candidates
    .map(
      (c, i) =>
        `${i}: "${c.brand} ${c.title}" — ${c.price} AED`
    )
    .join("\n");

  const prompt = `You are an expert personal stylist. Look at this person's photo.

They want: ${itemDescription}
Style profile: ${profile?.archetype || "Fashion forward"}, ${profile?.colorSeason || ""} color season, ${profile?.bodyType || ""} body type.

Here are ${candidates.length} available products from Namshi UAE:
${candidateList}

Which product (by index number) would look BEST on this specific person? Consider:
- Color harmony with their skin tone and hair
- Style match with their archetype
- Overall aesthetic fit

Reply with ONLY a JSON object: {"pick": 0, "reason": "brief reason"}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: photoBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return 0;

    const result = JSON.parse(extractJSON(textBlock.text));
    const pick = typeof result.pick === "number" ? result.pick : 0;
    console.log(`[AI Pick] Chose #${pick}: ${candidates[pick]?.brand} ${candidates[pick]?.title} — ${result.reason}`);
    return Math.min(pick, candidates.length - 1);
  } catch (error) {
    console.error("[AI Pick] Failed:", error);
    return 0; // Default to first result
  }
}

// ─── Find best garment: Live search → AI pick → fallback to catalog ──
async function findBestGarment(
  photoBase64: string,
  mediaType: string,
  item: { name: string; brand: string; category: string; searchQuery?: string },
  profile: { archetype?: string; colorSeason?: string; bodyType?: string } | null
): Promise<{ url: string; product?: NamshiProduct } | null> {
  const query = item.searchQuery || `${item.brand} ${item.name}`;

  // Step 1: Live Namshi search
  console.log(`[Search] Namshi: "${query}"...`);
  const namshiResults = await searchNamshiLive(query);

  if (namshiResults.length > 0) {
    // Step 2: Claude Vision picks the best match (top 8 candidates)
    const candidates = namshiResults.slice(0, 8);
    console.log(`[Search] Found ${namshiResults.length} products, AI picking from top ${candidates.length}...`);

    const bestIdx = await aiPickBestGarment(
      photoBase64,
      mediaType,
      `${item.brand} ${item.name} (${item.category})`,
      candidates,
      profile
    );

    if (bestIdx >= 0) {
      const chosen = candidates[bestIdx];
      return { url: chosen.imageUrl, product: chosen };
    }
  }

  // Step 3: Fallback to curated catalog
  console.log(`[Search] Namshi empty, falling back to catalog...`);
  const catalogUrl = findGarmentImage(query, item.category);
  return catalogUrl ? { url: catalogUrl } : null;
}

// ─── FASHN product-to-model call ────────────────────────────────────
async function fashnProductToModel(
  modelImage: string,
  garmentUrl: string,
  promptText: string
): Promise<string | null> {
  if (!fashn) return null;

  try {
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => {
      console.log(`[FASHN] Timed out after 60s`);
      resolve(null);
    }, 60000));

    const fashnPromise = fashn.predictions.subscribe({
      model_name: "product-to-model",
      inputs: {
        model_image: modelImage,
        product_image: garmentUrl,
        prompt: promptText,
        resolution: "1k",
        output_format: "png",
      },
      onQueueUpdate: (status) => {
        console.log(`[FASHN] ${status.status}`);
      },
    }).then(r => r.status === "completed" && r.output?.[0] ? r.output[0] : null);

    return await Promise.race([fashnPromise, timeoutPromise]);
  } catch (e) {
    console.error(`[FASHN] Error:`, e);
    return null;
  }
}

// ─── Download image URL → data URI ───────────────────────────────────
async function imageUrlToDataUri(url: string): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
  const contentType = response.headers.get("content-type") || "image/png";
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

// ─── Claude Vision Analysis ──────────────────────────────────────────
async function runClaudeAnalysis(
  photoBase64: string,
  mediaType: string,
  outfit: {
    name: string;
    items: {
      name: string;
      brand: string;
      store: string;
      category: string;
      price: number;
      currency: string;
    }[];
  },
  profile: { archetype?: string; colorSeason?: string; bodyType?: string } | null,
  pickedProducts: { category: string; product?: NamshiProduct }[]
) {
  // Use real product names if we found them
  const itemsList = outfit.items
    .map((item) => {
      const picked = pickedProducts.find((p) => p.category === item.category);
      if (picked?.product) {
        return `- ${item.category}: ${picked.product.brand} ${picked.product.title} (${picked.product.price} AED from Namshi)`;
      }
      return `- ${item.category}: ${item.brand} ${item.name} (${item.price} ${item.currency} from ${item.store})`;
    })
    .join("\n");

  const prompt = `You are a world-class personal stylist doing a virtual try-on session.

Look at this person's photo carefully. They want to try on this outfit:

**${outfit.name}**
${itemsList}

Their style profile: ${profile?.archetype || "Fashion forward"}, ${profile?.colorSeason || ""} color season, ${profile?.bodyType || ""} body type.

Provide a virtual try-on analysis as JSON:
{
  "overallLook": "1 short sentence max 15 words — how the outfit looks on them",
  "fitAnalysis": "1 short sentence max 12 words — how the fit works",
  "colorHarmony": "1 short sentence max 12 words — how colors complement them",
  "stylingTips": ["short tip 1","short tip 2","short tip 3"],
  "confidenceScore": 88,
  "verdict": "punchy 1-liner max 10 words"
}

Be specific to THIS person. Keep ALL text very brief and punchy — no fluff. Return ONLY JSON.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
              data: photoBase64,
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response");

  const analysis = JSON.parse(extractJSON(textBlock.text));
  if (!Array.isArray(analysis.stylingTips)) {
    analysis.stylingTips = [analysis.stylingTips || "This outfit suits you well."];
  }
  return analysis;
}

// ─── Main Handler ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { photoBase64, mediaType, outfit, profile, bodyShapeImage } = await request.json();

    if (!outfit) {
      return NextResponse.json(
        { error: "Outfit is required" },
        { status: 400 }
      );
    }

    const resolvedMediaType = mediaType || "image/jpeg";
    const hasPhoto = !!photoBase64;
    let personDataUri = hasPhoto ? `data:${resolvedMediaType};base64,${photoBase64}` : "";

    // For body-type users: read body shape image from public/ as model
    if (!hasPhoto && bodyShapeImage) {
      try {
        const filePath = path.join(process.cwd(), "public", decodeURIComponent(bodyShapeImage));
        console.log(`[Try-On] Reading body shape image: ${filePath}`);
        const buf = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
        personDataUri = `data:${mime};base64,${buf.toString("base64")}`;
        console.log(`[Try-On] Body shape image loaded (${(buf.length / 1024).toFixed(0)}KB)`);
      } catch (e) {
        console.error("[Try-On] Failed to load body shape image:", e);
      }
    }

    if (!personDataUri) {
      return NextResponse.json(
        { error: "Photo or body shape image is required" },
        { status: 400 }
      );
    }

    // ── Step 1: AI finds best garments (live Namshi search + Claude Vision pick) ──
    const topItem = outfit.items.find(
      (i: { category: string }) => i.category === "tops" || i.category === "outerwear"
    );
    const bottomItem = outfit.items.find(
      (i: { category: string }) => i.category === "bottoms"
    );

    // Search for top and bottom in parallel
    const [topMatch, bottomMatch] = await Promise.all([
      topItem
        ? findBestGarment(hasPhoto ? photoBase64 : "", resolvedMediaType, topItem, profile)
        : Promise.resolve(null),
      bottomItem
        ? findBestGarment(hasPhoto ? photoBase64 : "", resolvedMediaType, bottomItem, profile)
        : Promise.resolve(null),
    ]);

    console.log("[Try-On] Top:", topMatch?.product?.brand || topMatch?.url?.substring(0, 50) || "none");
    console.log("[Try-On] Bottom:", bottomMatch?.product?.brand || bottomMatch?.url?.substring(0, 50) || "none");

    // Get fashn prompts from outfit items
    const topFashnPrompt = topItem?.fashnPrompt || `apply this ${topItem?.name || "top"}`;
    const bottomFashnPrompt = bottomItem?.fashnPrompt || `apply this ${bottomItem?.name || "bottom"}`;

    // ── Step 2: FASHN product-to-model (chained) + Claude analysis in parallel ──
    const pickedProducts = [
      ...(topMatch?.product ? [{ category: topItem?.category || "tops", product: topMatch.product }] : []),
      ...(bottomMatch?.product ? [{ category: "bottoms", product: bottomMatch.product }] : []),
    ];

    // FASHN chained product-to-model: apply top, then bottom on result
    const runFashnChain = async (): Promise<string | null> => {
      if (!fashn || !personDataUri) return null;

      let currentImage = personDataUri;

      // Step 1: Apply top garment
      if (topMatch?.url) {
        console.log("[FASHN] Applying top via product-to-model...");
        const topResult = await fashnProductToModel(currentImage, topMatch.url, topFashnPrompt);
        if (topResult) {
          if (bottomMatch?.url) {
            currentImage = await imageUrlToDataUri(topResult);
          } else {
            return topResult;
          }
        }
      }

      // Step 2: Apply bottom garment on the result
      if (bottomMatch?.url) {
        console.log("[FASHN] Applying bottom via product-to-model...");
        const bottomResult = await fashnProductToModel(currentImage, bottomMatch.url, bottomFashnPrompt);
        if (bottomResult) return bottomResult;
      }

      return null;
    };

    const [tryOnImageUrl, claudeAnalysis] = await Promise.all([
      runFashnChain(),
      hasPhoto
        ? runClaudeAnalysis(photoBase64, resolvedMediaType, outfit, profile, pickedProducts)
        : runClaudeAnalysis("", resolvedMediaType, outfit, profile, pickedProducts),
    ]);

    // ── Step 3: Return results with product info ──
    return NextResponse.json({
      analysis: claudeAnalysis,
      tryOnImage: tryOnImageUrl,
      products: {
        top: topMatch?.product
          ? {
              brand: topMatch.product.brand,
              title: topMatch.product.title,
              price: topMatch.product.price,
              originalPrice: topMatch.product.originalPrice,
              productUrl: topMatch.product.productUrl,
              imageUrl: topMatch.product.imageUrl,
            }
          : null,
        bottom: bottomMatch?.product
          ? {
              brand: bottomMatch.product.brand,
              title: bottomMatch.product.title,
              price: bottomMatch.product.price,
              originalPrice: bottomMatch.product.originalPrice,
              productUrl: bottomMatch.product.productUrl,
              imageUrl: bottomMatch.product.imageUrl,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Try-on error:", error);
    return NextResponse.json(
      { error: "Failed to generate try-on analysis" },
      { status: 500 }
    );
  }
}
