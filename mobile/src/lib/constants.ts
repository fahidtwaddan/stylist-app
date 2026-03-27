// Point this at your Next.js backend
export const API_BASE_URL = __DEV__
  ? "http://localhost:3002"
  : "https://your-production-url.vercel.app";

export const COLORS = {
  background: "#0a0a0a",
  foreground: "#faf8f5",
  gold: {
    50: "#fdf8ef",
    100: "#faefd5",
    200: "#f4dbaa",
    300: "#edc274",
    400: "#e5a13c",
    500: "#de8b1f",
    600: "#cf7116",
  },
  white: {
    10: "rgba(255,255,255,0.1)",
    20: "rgba(255,255,255,0.2)",
    40: "rgba(255,255,255,0.4)",
    50: "rgba(255,255,255,0.5)",
    60: "rgba(255,255,255,0.6)",
    70: "rgba(255,255,255,0.7)",
    80: "rgba(255,255,255,0.8)",
  },
  glass: "rgba(255,255,255,0.05)",
  glassBorder: "rgba(255,255,255,0.08)",
};

export const GCC_STORES = [
  { id: "namshi", name: "Namshi" },
  { id: "ounass", name: "Ounass" },
  { id: "noon", name: "Noon Fashion" },
  { id: "centrepoint", name: "Centrepoint" },
  { id: "sivvi", name: "SIVVI" },
  { id: "hm", name: "H&M ME" },
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
    id: "beach",
    name: "Beach & Resort",
    icon: "🏖️",
    description: "Effortless resort wear for coastal living",
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
];
