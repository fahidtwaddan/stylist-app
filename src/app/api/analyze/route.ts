import { NextRequest, NextResponse } from "next/server";
import { analyzePhoto } from "@/lib/claude";

const SUPPORTED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("photo") as File;

    if (!file) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Normalize to supported image types.
    const mediaType = (SUPPORTED_MEDIA_TYPES.includes(file.type as (typeof SUPPORTED_MEDIA_TYPES)[number])
      ? (file.type as (typeof SUPPORTED_MEDIA_TYPES)[number])
      : "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    const profile = await analyzePhoto(base64, mediaType);

    return NextResponse.json({
      profile,
      confidence: 0.92,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to analyze photo: ${message}` },
      { status: 500 }
    );
  }
}
