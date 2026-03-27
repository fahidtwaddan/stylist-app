import { NextRequest, NextResponse } from "next/server";
import { generateOutfits } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const { profile, occasion } = await request.json();

    if (!profile || !occasion) {
      return NextResponse.json(
        { error: "Profile and occasion are required" },
        { status: 400 }
      );
    }

    const outfits = await generateOutfits(JSON.stringify(profile), occasion);

    if (!Array.isArray(outfits)) {
      throw new Error("Claude returned invalid outfits format");
    }

    // Add store search URLs as productUrl so "Shop" buttons still work
    for (const outfit of outfits) {
      for (const item of outfit.items) {
        if (!item.productUrl) {
          const store = item.store?.toLowerCase() || "";
          const q = encodeURIComponent(item.searchQuery || `${item.brand} ${item.name}`);
          if (store.includes("namshi")) item.productUrl = `https://www.namshi.com/uae-en/catalogsearch/result/?q=${q}`;
          else if (store.includes("ounass")) item.productUrl = `https://www.ounass.ae/search/?q=${q}`;
          else if (store.includes("noon")) item.productUrl = `https://www.noon.com/uae-en/search/?q=${q}`;
          else if (store.includes("centrepoint")) item.productUrl = `https://www.centrepointstores.com/ae/en/search/?q=${q}`;
          else if (store.includes("sivvi")) item.productUrl = `https://www.sivvi.com/uae-en/catalogsearch/result/?q=${q}`;
          else if (store.includes("h&m") || store.includes("hm")) item.productUrl = `https://www2.hm.com/en_ae/search-results.html?q=${q}`;
          else item.productUrl = `https://www.google.com/search?q=${q}+UAE`;
        }
      }
    }

    return NextResponse.json({ outfits });
  } catch (error) {
    console.error("Outfit generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate outfits: ${message}` },
      { status: 500 }
    );
  }
}
