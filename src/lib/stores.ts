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

export const OCCASIONS = [
  {
    id: "brunch",
    name: "Friday Brunch",
    icon: "🥂",
    description: "Relaxed luxury for the iconic GCC weekend brunch",
  },
  {
    id: "office",
    name: "Office Chic",
    icon: "💼",
    description: "Polished professional looks for the modern workplace",
  },
  {
    id: "evening",
    name: "Evening Out",
    icon: "✨",
    description: "Glamorous fits for Dubai nights and fine dining",
  },
  {
    id: "date",
    name: "Date Night",
    icon: "🌹",
    description: "Confident, put-together looks that make an impression",
  },
  {
    id: "beach",
    name: "Beach & Resort",
    icon: "🏖️",
    description: "Effortless resort wear for coastal living",
  },
  {
    id: "wedding",
    name: "Wedding Guest",
    icon: "💍",
    description: "Elegant looks for ceremonies and celebrations",
  },
  {
    id: "gym",
    name: "Gym & Athleisure",
    icon: "💪",
    description: "Performance meets style for workouts and errands",
  },
  {
    id: "travel",
    name: "Travel & Airport",
    icon: "✈️",
    description: "Comfortable yet stylish for long-haul flights",
  },
  {
    id: "modest",
    name: "Modest Elegance",
    icon: "🌙",
    description: "Sophisticated modest fashion for every occasion",
  },
  {
    id: "streetwear",
    name: "Street Style",
    icon: "🔥",
    description: "Bold urban looks inspired by GCC street culture",
  },
  {
    id: "mall",
    name: "Mall & Weekend",
    icon: "🛍️",
    description: "Casual cool for shopping and hanging with friends",
  },
  {
    id: "ramadan",
    name: "Ramadan & Eid",
    icon: "🕌",
    description: "Festive elegance for iftar, suhoor, and Eid gatherings",
  },
];
