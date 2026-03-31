export interface GCCStore {
  id: string;
  name: string;
  logo: string;
  baseUrl: string;
  affiliateParam: string;
  categories: string[];
  priceRange: { min: number; max: number };
  currency: string;
}

export const GCC_STORES: GCCStore[] = [
  {
    id: "namshi",
    name: "Namshi",
    logo: "/brands/namshi.svg",
    baseUrl: "https://www.namshi.com",
    affiliateParam: "utm_source=aistylist&utm_medium=affiliate&ref=",
    categories: ["streetwear", "casual", "sportswear", "contemporary"],
    priceRange: { min: 50, max: 800 },
    currency: "AED",
  },
  {
    id: "ounass",
    name: "Ounass",
    logo: "/brands/ounass.svg",
    baseUrl: "https://www.ounass.com",
    affiliateParam: "utm_source=aistylist&utm_medium=affiliate&ref=",
    categories: ["luxury", "designer", "evening", "premium"],
    priceRange: { min: 300, max: 5000 },
    currency: "AED",
  },
  {
    id: "noon",
    name: "Noon Fashion",
    logo: "/brands/noon.svg",
    baseUrl: "https://www.noon.com/fashion",
    affiliateParam: "utm_source=aistylist&utm_medium=affiliate&ref=",
    categories: ["budget", "casual", "basics", "everyday"],
    priceRange: { min: 20, max: 400 },
    currency: "AED",
  },
  {
    id: "centrepoint",
    name: "Centrepoint",
    logo: "/brands/centrepoint.svg",
    baseUrl: "https://www.centrepointstores.com",
    affiliateParam: "utm_source=aistylist&utm_medium=affiliate&ref=",
    categories: ["family", "casual", "affordable", "basics"],
    priceRange: { min: 30, max: 500 },
    currency: "AED",
  },
  {
    id: "sivvi",
    name: "SIVVI",
    logo: "/brands/sivvi.svg",
    baseUrl: "https://www.sivvi.com",
    affiliateParam: "utm_source=aistylist&utm_medium=affiliate&ref=",
    categories: ["trendy", "contemporary", "midrange", "young"],
    priceRange: { min: 50, max: 600 },
    currency: "AED",
  },
  {
    id: "hm",
    name: "H&M ME",
    logo: "/brands/hm.svg",
    baseUrl: "https://www.hm.com/ae",
    affiliateParam: "utm_source=aistylist&utm_medium=affiliate&ref=",
    categories: ["fast-fashion", "basics", "trendy", "affordable"],
    priceRange: { min: 25, max: 350 },
    currency: "AED",
  },
];

export interface OccasionExample {
  top: string;
  bottom: string;
}

export interface OccasionData {
  id: string;
  name: string;
  icon: string;
  description: string;
  examples: { men: OccasionExample; women: OccasionExample };
}

export const OCCASIONS: OccasionData[] = [
  {
    id: "casual",
    name: "Casual & Everyday",
    icon: "🛍️",
    description: "Weekend outings, mall trips, brunch, travel & street style",
    examples: {
      men: { top: "casual t-shirt men", bottom: "jeans men" },
      women: { top: "casual top women", bottom: "jeans women" },
    },
  },
  {
    id: "formal",
    name: "Formal & Business",
    icon: "💼",
    description: "Office, meetings, interviews & professional events",
    examples: {
      men: { top: "formal shirt men slim fit", bottom: "dress pants men" },
      women: { top: "blazer women", bottom: "tailored trousers women" },
    },
  },
  {
    id: "evening",
    name: "Evening & Date Night",
    icon: "✨",
    description: "Dinner, parties, nightlife & date nights",
    examples: {
      men: { top: "black shirt men slim", bottom: "slim fit trousers men" },
      women: { top: "satin top women", bottom: "wide leg pants women" },
    },
  },
  {
    id: "celebration",
    name: "Celebrations & Events",
    icon: "💍",
    description: "Weddings, Eid, festivals, ceremonies & special occasions",
    examples: {
      men: { top: "suit blazer men", bottom: "suit trousers men" },
      women: { top: "embroidered top women", bottom: "maxi skirt women" },
    },
  },
  {
    id: "active",
    name: "Active & Sporty",
    icon: "💪",
    description: "Gym, athleisure, outdoor activities & resort wear",
    examples: {
      men: { top: "sport t-shirt men", bottom: "jogger pants men" },
      women: { top: "sports bra top women", bottom: "leggings women" },
    },
  },
];
