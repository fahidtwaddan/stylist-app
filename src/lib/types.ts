export interface StyleProfile {
  gender: "men" | "women";
  bodyType: string;
  skinTone: string;
  colorSeason: string;
  archetype: string;
  personality: string;
  narrative: string;
  colorPalette: string[];
  avoidColors: string[];
  recommendations: string[];
}

export interface Occasion {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface OutfitItem {
  name: string;
  brand: string;
  store: string;
  price: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  searchQuery?: string;
}

export interface Outfit {
  id: string;
  name: string;
  occasion: string;
  description: string;
  editorialNote: string;
  fitScore: number;
  items: OutfitItem[];
  totalPrice: number;
  currency: string;
}

export interface ReferralData {
  code: string;
  userId: string;
  clicks: number;
  conversions: number;
  earnings: number;
  currency: string;
  shareUrl: string;
}

export interface TryOnAnalysis {
  overallLook: string;
  fitAnalysis: string;
  colorHarmony: string;
  stylingTips: string[];
  confidenceScore: number;
  verdict: string;
}

export interface AnalysisResult {
  profile: StyleProfile;
  confidence: number;
}

export type AppScreen =
  | "landing"
  | "analyzing"
  | "profile"
  | "occasions"
  | "outfits"
  | "try-on"
  | "share";
