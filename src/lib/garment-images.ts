// Garment image catalog — combines real Namshi products with Unsplash fallbacks
// Real products are served from local /products/ directory for UI, CDN URLs for FASHN

import namshiCatalog from "@/data/namshi-catalog.json";

export interface GarmentOption {
  id: string;
  label: string;
  url: string; // Image URL for FASHN (must be publicly accessible)
  localImage?: string; // Local path for UI rendering (/products/...)
  category: "tops" | "bottoms" | "outerwear" | "footwear" | "one-pieces";
  keywords: string[];
  color?: string;
  style?: string;
  // Namshi product data
  brand?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  productUrl?: string;
  isReal?: boolean; // true = real product, false = stock photo
}

// ─── Real Namshi products ────────────────────────────────────────────
const NAMSHI_GARMENTS: GarmentOption[] = (
  namshiCatalog as {
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
  }[]
).map((p) => ({
  id: p.id,
  label: p.label,
  url: p.imageUrl, // Namshi CDN — works with FASHN
  localImage: p.localImage,
  category: p.category as GarmentOption["category"],
  keywords: p.keywords,
  color: p.color,
  style: p.style,
  brand: p.brand,
  price: p.price,
  originalPrice: p.originalPrice,
  currency: p.currency,
  productUrl: p.productUrl,
  isReal: true,
}));

// ─── Unsplash fallbacks (always available) ───────────────────────────
const UNSPLASH_FALLBACKS: GarmentOption[] = [
  // Tops
  { id: "u-t-white", label: "White T-Shirt", url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80", category: "tops", keywords: ["t-shirt", "tee", "white"], color: "white", style: "casual" },
  { id: "u-polo-navy", label: "Navy Polo", url: "https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=600&q=80", category: "tops", keywords: ["polo", "navy"], color: "navy", style: "smart casual" },
  { id: "u-shirt-white", label: "White Dress Shirt", url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80", category: "tops", keywords: ["dress shirt", "white"], color: "white", style: "formal" },
  { id: "u-linen-blue", label: "Blue Linen Shirt", url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80", category: "tops", keywords: ["linen", "blue"], color: "blue", style: "resort" },
  { id: "u-sweater", label: "Cream Sweater", url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80", category: "tops", keywords: ["sweater", "knit", "cream"], color: "cream", style: "smart casual" },
  // Outerwear
  { id: "u-blazer", label: "Navy Blazer", url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80", category: "outerwear", keywords: ["blazer", "navy"], color: "navy", style: "formal" },
  { id: "u-leather", label: "Leather Jacket", url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80", category: "outerwear", keywords: ["leather jacket", "black"], color: "black", style: "edgy" },
  { id: "u-bomber", label: "Black Bomber", url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80", category: "outerwear", keywords: ["bomber", "black"], color: "black", style: "streetwear" },
  { id: "u-hoodie", label: "Black Hoodie", url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80", category: "outerwear", keywords: ["hoodie", "black"], color: "black", style: "streetwear" },
  // Bottoms
  { id: "u-chino", label: "Khaki Chinos", url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80", category: "bottoms", keywords: ["chinos", "khaki"], color: "khaki", style: "smart casual" },
  { id: "u-jeans", label: "Blue Jeans", url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80", category: "bottoms", keywords: ["jeans", "blue"], color: "blue", style: "casual" },
  { id: "u-trouser", label: "Black Trousers", url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80", category: "bottoms", keywords: ["trousers", "black"], color: "black", style: "formal" },
  // Footwear
  { id: "u-sneaker", label: "White Sneakers", url: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&q=80", category: "footwear", keywords: ["sneakers", "white"], color: "white", style: "casual" },
  { id: "u-loafer", label: "Brown Loafers", url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&q=80", category: "footwear", keywords: ["loafers", "brown"], color: "brown", style: "smart casual" },
];

// Combined catalog — real products first, then fallbacks
const ALL_GARMENTS: GarmentOption[] = [...NAMSHI_GARMENTS, ...UNSPLASH_FALLBACKS];

/**
 * Search garments by query and category. Returns ranked results.
 * Prioritizes real Namshi products over stock photos.
 */
export function searchGarments(
  query: string,
  category?: string,
  limit: number = 12
): GarmentOption[] {
  const q = query.toLowerCase();
  const cat = category?.toLowerCase();

  const scored = ALL_GARMENTS.map((garment) => {
    let score = 0;

    // Real products get a baseline boost
    if (garment.isReal) score += 3;

    // Keyword matching
    for (const kw of garment.keywords) {
      if (q.includes(kw)) score += kw.split(" ").length * 10;
      for (const word of kw.split(" ")) {
        if (word.length > 2 && q.includes(word)) score += 3;
      }
    }

    // Brand matching
    if (garment.brand && q.includes(garment.brand.toLowerCase())) score += 15;

    // Color matching
    if (garment.color && q.includes(garment.color)) score += 8;

    // Style matching
    if (garment.style && q.includes(garment.style)) score += 5;

    // Label matching
    for (const word of garment.label.toLowerCase().split(" ")) {
      if (word.length > 2 && q.includes(word)) score += 2;
    }

    // Category match
    if (cat && garment.category === cat) score += 5;

    return { garment, score };
  })
    .filter((s) => (cat ? s.garment.category === cat : true))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => s.garment);
}

/**
 * Get all garments in a category, for browsing. Real products first.
 */
export function getGarmentsByCategory(category: string): GarmentOption[] {
  const cat = category.toLowerCase();
  const catMap: Record<string, string> = {
    tops: "tops",
    outerwear: "outerwear",
    bottoms: "bottoms",
    footwear: "footwear",
    shoes: "footwear",
  };
  const mapped = catMap[cat] || cat;
  return ALL_GARMENTS.filter((g) => g.category === mapped);
}

/**
 * Find a single best-match garment image URL (backward compat).
 */
export function findGarmentImage(
  query: string,
  category: string
): string | null {
  const results = searchGarments(query, category, 1);
  return results[0]?.url || null;
}
