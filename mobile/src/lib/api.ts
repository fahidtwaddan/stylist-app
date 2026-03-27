import { API_BASE_URL } from "./constants";
import type { StyleProfile, Outfit, ReferralData, TryOnAnalysis } from "./types";

export async function analyzePhoto(
  uri: string,
  mimeType: string
): Promise<{ profile: StyleProfile; confidence: number }> {
  const formData = new FormData();

  const filename = uri.split("/").pop() || "photo.jpg";
  formData.append("photo", {
    uri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.status}`);
  }

  return response.json();
}

export async function generateOutfits(
  profile: StyleProfile,
  occasion: string
): Promise<{ outfits: Outfit[] }> {
  const response = await fetch(`${API_BASE_URL}/api/outfits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, occasion }),
  });

  if (!response.ok) {
    throw new Error(`Outfit generation failed: ${response.status}`);
  }

  return response.json();
}

export async function runTryOn(
  photoBase64: string,
  mediaType: string,
  outfit: Outfit,
  profile: StyleProfile | null
): Promise<{ analysis: TryOnAnalysis }> {
  const response = await fetch(`${API_BASE_URL}/api/try-on`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoBase64, mediaType, outfit, profile }),
  });

  if (!response.ok) {
    throw new Error(`Try-on failed: ${response.status}`);
  }

  return response.json();
}

export async function createReferral(
  userId: string
): Promise<{ referral: ReferralData }> {
  const response = await fetch(`${API_BASE_URL}/api/referral`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error(`Referral creation failed: ${response.status}`);
  }

  return response.json();
}
