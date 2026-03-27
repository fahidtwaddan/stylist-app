import { NextRequest, NextResponse } from "next/server";
import { generateReferralCode } from "@/lib/affiliates";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    const code = generateReferralCode();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const referral = {
      code,
      userId: userId || `user_${Date.now()}`,
      clicks: 0,
      conversions: 0,
      earnings: 0,
      currency: "AED",
      shareUrl: `${baseUrl}?ref=${code}`,
    };

    return NextResponse.json({ referral });
  } catch (error) {
    console.error("Referral error:", error);
    return NextResponse.json(
      { error: "Failed to generate referral" },
      { status: 500 }
    );
  }
}
