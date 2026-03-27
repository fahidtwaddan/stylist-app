import * as cheerio from "cheerio";
import type { OutfitItem, Outfit } from "./types";

export interface ProductSearchResult {
  title: string;
  store: string;
  price: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
}

// In-memory cache (per server instance)
const searchCache = new Map<
  string,
  { results: ProductSearchResult[]; timestamp: number }
>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Separate image cache to avoid burning CSE quota on repeated queries
const imageCache = new Map<string, { imageUrl: string; productUrl: string; timestamp: number }>();

function getCacheKey(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, " ");
}

// Store search URL patterns
const STORE_SEARCH_URLS: Record<string, (q: string) => string> = {
  namshi: (q) =>
    `https://www.namshi.com/uae-en/catalogsearch/result/?q=${encodeURIComponent(q)}`,
  ounass: (q) =>
    `https://www.ounass.ae/search/?q=${encodeURIComponent(q)}`,
  noon: (q) =>
    `https://www.noon.com/uae-en/search/?q=${encodeURIComponent(q)}`,
  centrepoint: (q) =>
    `https://www.centrepointstores.com/ae/en/search/?q=${encodeURIComponent(q)}`,
  sivvi: (q) =>
    `https://www.sivvi.com/uae-en/catalogsearch/result/?q=${encodeURIComponent(q)}`,
  hm: (q) =>
    `https://www2.hm.com/en_ae/search-results.html?q=${encodeURIComponent(q)}`,
};

// Map store names from Claude output to store IDs
function normalizeStoreId(storeName: string): string {
  const name = storeName.toLowerCase();
  if (name.includes("namshi")) return "namshi";
  if (name.includes("ounass")) return "ounass";
  if (name.includes("noon")) return "noon";
  if (name.includes("centrepoint")) return "centrepoint";
  if (name.includes("sivvi")) return "sivvi";
  if (name.includes("h&m") || name.includes("hm")) return "hm";
  return "namshi";
}

// ─── Google Custom Search API (Image Search) ─────────────────────────
// Uses Google CSE to find product images. Free tier: 100 queries/day.
// Each query can return images for multiple items if batched smartly.
async function searchGoogleCSE(
  query: string,
  storeName: string
): Promise<ProductSearchResult[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) return [];

  // Check image cache first
  const cacheKey = getCacheKey(`gcse:${query}`);
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.imageUrl
      ? [{ title: query, store: storeName, price: 0, currency: "AED", imageUrl: cached.imageUrl, productUrl: cached.productUrl }]
      : [];
  }

  try {
    // Use image search to get product photos
    const searchQuery = `${query} ${storeName} product`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=3&imgSize=medium&safe=active`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      console.warn(`Google CSE returned ${response.status} for: ${query}`);
      return [];
    }

    const data = await response.json();
    const items = data.items || [];

    const results: ProductSearchResult[] = items.map(
      (item: { title?: string; link?: string; image?: { contextLink?: string } }) => ({
        title: item.title || query,
        store: storeName,
        price: 0,
        currency: "AED",
        imageUrl: item.link || "",
        productUrl: item.image?.contextLink || "",
      })
    );

    // Cache the best result
    if (results.length > 0) {
      imageCache.set(cacheKey, {
        imageUrl: results[0].imageUrl,
        productUrl: results[0].productUrl,
        timestamp: Date.now(),
      });
    } else {
      imageCache.set(cacheKey, { imageUrl: "", productUrl: "", timestamp: Date.now() });
    }

    return results;
  } catch (error) {
    console.warn("Google CSE error:", error);
    return [];
  }
}

// Batch Google CSE search — search for multiple items in one query to save quota
// Returns a map of searchQuery -> { imageUrl, productUrl }
async function batchGoogleCSEImages(
  items: { searchQuery: string; storeName: string }[]
): Promise<Map<string, { imageUrl: string; productUrl: string }>> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  const resultMap = new Map<string, { imageUrl: string; productUrl: string }>();

  if (!apiKey || !cseId) return resultMap;

  // Deduplicate and check cache
  const uncached: { searchQuery: string; storeName: string }[] = [];
  for (const item of items) {
    const cacheKey = getCacheKey(`gcse:${item.searchQuery}`);
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (cached.imageUrl) {
        resultMap.set(item.searchQuery, { imageUrl: cached.imageUrl, productUrl: cached.productUrl });
      }
    } else {
      uncached.push(item);
    }
  }

  if (uncached.length === 0) return resultMap;

  // Search each uncached item individually (Google CSE doesn't support true batching)
  // But limit to 10 queries max per enrichment cycle to stay within free tier
  const toSearch = uncached.slice(0, 10);

  const promises = toSearch.map(async ({ searchQuery, storeName }) => {
    const results = await searchGoogleCSE(searchQuery, storeName);
    if (results.length > 0) {
      resultMap.set(searchQuery, {
        imageUrl: results[0].imageUrl,
        productUrl: results[0].productUrl,
      });
    }
  });

  await Promise.allSettled(promises);
  return resultMap;
}

// ─── Store Scrapers (existing) ───────────────────────────────────────

// Search Ounass (server-rendered HTML)
async function searchOunass(
  query: string
): Promise<ProductSearchResult[]> {
  try {
    const url = `https://www.ounass.ae/search/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: ProductSearchResult[] = [];

    $(".ProductCard, [data-testid='product-card'], .product-card").each(
      (_, el) => {
        const $el = $(el);
        const title =
          $el.find(".ProductCard-name, .product-name, [data-testid='product-name']").text().trim() ||
          $el.find("a").attr("title") ||
          "";
        const imgEl = $el.find("img").first();
        const imageUrl =
          imgEl.attr("src") ||
          imgEl.attr("data-src") ||
          imgEl.attr("data-lazy") ||
          "";
        const linkEl = $el.find("a").first();
        const productPath = linkEl.attr("href") || "";
        const priceText =
          $el.find(".ProductCard-price, .price, [data-testid='product-price']").text().trim();
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        const price = priceMatch
          ? parseFloat(priceMatch[0].replace(",", ""))
          : 0;

        if (title || imageUrl) {
          results.push({
            title: title || query,
            store: "Ounass",
            price,
            currency: "AED",
            imageUrl: imageUrl.startsWith("//")
              ? `https:${imageUrl}`
              : imageUrl,
            productUrl: productPath.startsWith("http")
              ? productPath
              : `https://www.ounass.ae${productPath}`,
          });
        }
      }
    );

    return results.slice(0, 5);
  } catch {
    return [];
  }
}

// Search Noon (JSON API)
async function searchNoon(
  query: string
): Promise<ProductSearchResult[]> {
  try {
    const url = `https://www.noon.com/_svc/catalog/api/v3/u/search?q=${encodeURIComponent(query)}&limit=5&locale=en-ae`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const hits = data?.hits || [];

    return hits.slice(0, 5).map(
      (hit: {
        name?: string;
        image_key?: string;
        url?: string;
        sale_price?: number;
        price?: number;
      }) => ({
        title: hit.name || query,
        store: "Noon Fashion",
        price: hit.sale_price || hit.price || 0,
        currency: "AED",
        imageUrl: hit.image_key
          ? `https://f.nooncdn.com/p/${hit.image_key}/45/_/1/tr:n-t_200/${hit.image_key}.jpg`
          : "",
        productUrl: hit.url
          ? `https://www.noon.com${hit.url}`
          : `https://www.noon.com/uae-en/search/?q=${encodeURIComponent(query)}`,
      })
    );
  } catch {
    return [];
  }
}

// Generic store search via HTML scraping
async function searchStoreGeneric(
  query: string,
  storeId: string,
  storeName: string
): Promise<ProductSearchResult[]> {
  try {
    const buildUrl = STORE_SEARCH_URLS[storeId];
    if (!buildUrl) return [];

    const url = buildUrl(query);
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(4000),
      redirect: "follow",
    });

    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: ProductSearchResult[] = [];

    const productSelectors = [
      "[data-product]",
      ".product-card",
      ".product-item",
      ".plp-product",
      'article[class*="product"]',
      '[class*="ProductCard"]',
      '[class*="product-tile"]',
    ];

    for (const selector of productSelectors) {
      $(selector).each((_, el) => {
        if (results.length >= 5) return;

        const $el = $(el);
        const title =
          $el
            .find('[class*="name"], [class*="title"], h3, h2, [data-testid*="name"]')
            .first()
            .text()
            .trim() || "";
        const imgEl = $el.find("img").first();
        const imageUrl =
          imgEl.attr("src") || imgEl.attr("data-src") || "";
        const linkEl = $el.find("a").first();
        const href = linkEl.attr("href") || "";
        const priceText = $el
          .find('[class*="price"], [data-testid*="price"]')
          .first()
          .text()
          .trim();
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        const price = priceMatch
          ? parseFloat(priceMatch[0].replace(",", ""))
          : 0;

        if (title && imageUrl) {
          results.push({
            title,
            store: storeName,
            price,
            currency: "AED",
            imageUrl: imageUrl.startsWith("//")
              ? `https:${imageUrl}`
              : imageUrl,
            productUrl: href.startsWith("http")
              ? href
              : `${STORE_SEARCH_URLS[storeId]?.(query) || ""}`,
          });
        }
      });

      if (results.length > 0) break;
    }

    // JSON-LD fallback
    if (results.length === 0) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html() || "{}");
          const items = json["@graph"] || (Array.isArray(json) ? json : [json]);
          for (const item of items) {
            if (item["@type"] === "Product" && results.length < 5) {
              results.push({
                title: item.name || query,
                store: storeName,
                price: item.offers?.price || item.offers?.lowPrice || 0,
                currency: "AED",
                imageUrl: Array.isArray(item.image)
                  ? item.image[0]
                  : item.image || "",
                productUrl: item.url || url,
              });
            }
          }
        } catch {
          // ignore
        }
      });
    }

    return results;
  } catch {
    return [];
  }
}

// ─── Main Search (scraper → Google CSE fallback) ─────────────────────

async function searchProducts(
  query: string,
  storeId: string,
  storeName: string
): Promise<ProductSearchResult[]> {
  const cacheKey = getCacheKey(`${storeId}:${query}`);
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results;
  }

  let results: ProductSearchResult[] = [];

  // Try store-specific scrapers first
  if (storeId === "ounass") {
    results = await searchOunass(query);
  } else if (storeId === "noon") {
    results = await searchNoon(query);
  }

  // Fallback to generic scraping
  if (results.length === 0) {
    results = await searchStoreGeneric(query, storeId, storeName);
  }

  // Filter out results with no image
  const withImages = results.filter((r) => r.imageUrl);

  if (withImages.length > 0) {
    searchCache.set(cacheKey, { results: withImages, timestamp: Date.now() });
    return withImages;
  }

  // No images from scrapers — will use Google CSE in the enrichment phase
  // Still cache the scraper results for product URLs
  if (results.length > 0) {
    searchCache.set(cacheKey, { results, timestamp: Date.now() });
    return results;
  }

  // Nothing at all — build a search link
  const buildUrl = STORE_SEARCH_URLS[storeId];
  results = [
    {
      title: query,
      store: storeName,
      price: 0,
      currency: "AED",
      imageUrl: "",
      productUrl: buildUrl
        ? buildUrl(query)
        : `https://www.google.com/search?q=${encodeURIComponent(query + " " + storeName + " UAE")}`,
    },
  ];

  searchCache.set(cacheKey, { results, timestamp: Date.now() });
  return results;
}

// Enrich a single outfit item with product data from scrapers
async function enrichItem(item: OutfitItem): Promise<OutfitItem> {
  const storeId = normalizeStoreId(item.store);
  const searchQuery = item.searchQuery || `${item.brand} ${item.name}`;

  const results = await searchProducts(searchQuery, storeId, item.store);
  const best = results[0];

  if (best) {
    return {
      ...item,
      imageUrl: best.imageUrl || item.imageUrl,
      productUrl: best.productUrl || item.productUrl,
      price: best.price > 0 ? best.price : item.price,
    };
  }

  return item;
}

// ─── Main Enrichment Pipeline ────────────────────────────────────────
// 1. Try store scrapers for all items (parallel, 5s timeout)
// 2. For items still missing images, use Google CSE (parallel, batched)

export async function enrichOutfitsWithProducts(
  outfits: Outfit[]
): Promise<Outfit[]> {
  // Flatten all items
  const allItems: { outfitIdx: number; itemIdx: number; item: OutfitItem }[] = [];
  outfits.forEach((outfit, oi) =>
    outfit.items.forEach((item, ii) => allItems.push({ outfitIdx: oi, itemIdx: ii, item }))
  );

  // Phase 1: Try store scrapers (5s timeout)
  const enrichPromise = Promise.allSettled(
    allItems.map(({ item }) => enrichItem(item))
  );
  const timeoutPromise = new Promise<"timeout">((resolve) =>
    setTimeout(() => resolve("timeout"), 5000)
  );

  const result = await Promise.race([enrichPromise, timeoutPromise]);
  const scraperResults =
    result === "timeout"
      ? allItems.map(() => ({ status: "rejected" as const, reason: "timeout" }))
      : result;

  // Build intermediate outfits
  const enrichedOutfits: Outfit[] = outfits.map((outfit) => ({
    ...outfit,
    items: [...outfit.items],
  }));

  scraperResults.forEach((res, i) => {
    const { outfitIdx, itemIdx } = allItems[i];
    if (res.status === "fulfilled") {
      enrichedOutfits[outfitIdx].items[itemIdx] = res.value;
    }
  });

  // Phase 2: Find items still missing images → use Google CSE
  const missingImages: { outfitIdx: number; itemIdx: number; searchQuery: string; storeName: string }[] = [];
  enrichedOutfits.forEach((outfit, oi) =>
    outfit.items.forEach((item, ii) => {
      if (!item.imageUrl) {
        missingImages.push({
          outfitIdx: oi,
          itemIdx: ii,
          searchQuery: item.searchQuery || `${item.brand} ${item.name}`,
          storeName: item.store,
        });
      }
    })
  );

  if (missingImages.length > 0) {
    const googleResults = await batchGoogleCSEImages(
      missingImages.map((m) => ({ searchQuery: m.searchQuery, storeName: m.storeName }))
    );

    // Apply Google CSE images to items that were missing
    for (const missing of missingImages) {
      const key = missing.searchQuery;
      const googleResult = googleResults.get(key);
      if (googleResult?.imageUrl) {
        const item = enrichedOutfits[missing.outfitIdx].items[missing.itemIdx];
        enrichedOutfits[missing.outfitIdx].items[missing.itemIdx] = {
          ...item,
          imageUrl: googleResult.imageUrl,
          productUrl: googleResult.productUrl || item.productUrl,
        };
      }
    }
  }

  return enrichedOutfits;
}
