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
    id: "brunch",
    name: "Friday Brunch",
    icon: "🥂",
    description: "Relaxed luxury for the iconic GCC weekend brunch",
    examples: {
      men: { top: "linen shirt men", bottom: "chino pants men" },
      women: { top: "blouse women", bottom: "midi skirt women" },
    },
  },
  {
    id: "office",
    name: "Office Chic",
    icon: "💼",
    description: "Polished professional looks for the modern workplace",
    examples: {
      men: { top: "formal shirt men slim fit", bottom: "dress pants men" },
      women: { top: "blazer women", bottom: "tailored trousers women" },
    },
  },
  {
    id: "evening",
    name: "Evening Out",
    icon: "✨",
    description: "Glamorous fits for Dubai nights and fine dining",
    examples: {
      men: { top: "black shirt men slim", bottom: "slim fit trousers men" },
      women: { top: "satin top women", bottom: "wide leg pants women" },
    },
  },
  {
    id: "date",
    name: "Date Night",
    icon: "🌹",
    description: "Confident, put-together looks that make an impression",
    examples: {
      men: { top: "polo shirt men", bottom: "slim chinos men" },
      women: { top: "wrap top women", bottom: "pencil skirt women" },
    },
  },
  {
    id: "beach",
    name: "Beach & Resort",
    icon: "🏖️",
    description: "Effortless resort wear for coastal living",
    examples: {
      men: { top: "resort shirt men", bottom: "swim shorts men" },
      women: { top: "crop top women", bottom: "linen pants women" },
    },
  },
  {
    id: "wedding",
    name: "Wedding Guest",
    icon: "💍",
    description: "Elegant looks for ceremonies and celebrations",
    examples: {
      men: { top: "suit blazer men", bottom: "suit trousers men" },
      women: { top: "embroidered top women", bottom: "maxi skirt women" },
    },
  },
  {
    id: "gym",
    name: "Gym & Athleisure",
    icon: "💪",
    description: "Performance meets style for workouts and errands",
    examples: {
      men: { top: "sport t-shirt men", bottom: "jogger pants men" },
      women: { top: "sports bra top women", bottom: "leggings women" },
    },
  },
  {
    id: "travel",
    name: "Travel & Airport",
    icon: "✈️",
    description: "Comfortable yet stylish for long-haul flights",
    examples: {
      men: { top: "hoodie men", bottom: "cargo pants men" },
      women: { top: "oversized sweater women", bottom: "jogger pants women" },
    },
  },
  {
    id: "modest",
    name: "Modest Elegance",
    icon: "🌙",
    description: "Sophisticated modest fashion for every occasion",
    examples: {
      men: { top: "long sleeve shirt men", bottom: "loose trousers men" },
      women: { top: "tunic women", bottom: "palazzo pants women" },
    },
  },
  {
    id: "streetwear",
    name: "Street Style",
    icon: "🔥",
    description: "Bold urban looks inspired by GCC street culture",
    examples: {
      men: { top: "graphic t-shirt men", bottom: "cargo pants men" },
      women: { top: "oversized t-shirt women", bottom: "cargo pants women" },
    },
  },
  {
    id: "mall",
    name: "Mall & Weekend",
    icon: "🛍️",
    description: "Casual cool for shopping and hanging with friends",
    examples: {
      men: { top: "casual t-shirt men", bottom: "jeans men" },
      women: { top: "casual top women", bottom: "jeans women" },
    },
  },
  {
    id: "ramadan",
    name: "Ramadan & Eid",
    icon: "🕌",
    description: "Festive elegance for iftar, suhoor, and Eid gatherings",
    examples: {
      men: { top: "thobe men", bottom: "formal trousers men" },
      women: { top: "abaya women", bottom: "wide leg trousers women" },
    },
  },
];
