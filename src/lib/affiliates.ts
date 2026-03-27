import { GCC_STORES } from "./stores";

export function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "STY-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function buildAffiliateLink(
  storeId: string,
  productPath: string,
  referralCode: string
): string {
  const store = GCC_STORES.find((s) => s.id === storeId);
  if (!store) return productPath;
  const separator = productPath.includes("?") ? "&" : "?";
  return `${store.baseUrl}${productPath}${separator}${store.affiliateParam}${referralCode}`;
}

export function calculateCommission(
  saleAmount: number,
  storeId: string
): number {
  const commissionRates: Record<string, number> = {
    namshi: 0.08,
    ounass: 0.1,
    noon: 0.06,
    centrepoint: 0.07,
    sivvi: 0.08,
    hm: 0.05,
  };
  const rate = commissionRates[storeId] || 0.05;
  return Math.round(saleAmount * rate * 100) / 100;
}
