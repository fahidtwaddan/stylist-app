import { NextRequest, NextResponse } from "next/server";
import { searchGarments, getGarmentsByCategory } from "@/lib/garment-images";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || undefined;
  const limit = parseInt(searchParams.get("limit") || "12", 10);

  // If no query, return all garments in category (for browsing)
  const results = query
    ? searchGarments(query, category, limit)
    : category
      ? getGarmentsByCategory(category)
      : searchGarments("shirt", undefined, limit);

  return NextResponse.json({ garments: results });
}
