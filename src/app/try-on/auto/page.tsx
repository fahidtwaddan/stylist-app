"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStyleStore } from "@/store/useStyleStore";
import { OCCASIONS } from "@/lib/stores";

interface MatchedProduct {
  brand: string;
  title: string;
  price: number;
  originalPrice: number;
  productUrl: string;
  imageUrl: string;
}

interface TryOnResult {
  analysis: {
    overallLook: string;
    fitAnalysis: string;
    colorHarmony: string;
    stylingTips: string[];
    confidenceScore: number;
    verdict: string;
  };
  tryOnImage: string | null;
  outfit: {
    name: string;
    items: { name: string; brand: string; category: string; price: number; currency: string }[];
    totalPrice: number;
  };
  products: {
    top: MatchedProduct | null;
    bottom: MatchedProduct | null;
  };
}

export default function AutoTryOnPage() {
  const router = useRouter();
  const {
    selectedOccasion,
    photo,
    photoBase64,
    photoMediaType,
    profile,
  } = useStyleStore();

  const [result, setResult] = useState<TryOnResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showGenerated, setShowGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const occasion = OCCASIONS.find((o) => o.id === selectedOccasion);

  // Loading step animation
  useEffect(() => {
    if (!isLoading) { setLoadingStep(0); return; }
    const timers = [0, 1, 2, 3, 4, 5].map((step, i) =>
      setTimeout(() => setLoadingStep(step), i * 8000)
    );
    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

  const runFullPipeline = useCallback(async () => {
    if (!photo || !profile || !selectedOccasion) return;
    if (result) return;

    let b64 = photoBase64;
    let mType = photoMediaType;
    if (!b64 && photo.startsWith("data:")) {
      const [header, data] = photo.split(",");
      b64 = data;
      const mimeMatch = header.match(/data:(image\/\w+)/);
      mType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    }
    if (!b64) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoBase64: b64,
          mediaType: mType || "image/jpeg",
          profile,
          occasion: occasion?.name || selectedOccasion,
        }),
      });

      if (!response.ok) throw new Error("Styling failed");
      const data = await response.json();
      setResult(data);
      if (data.tryOnImage) setShowGenerated(true);
    } catch (err) {
      console.error("Pipeline error:", err);
      setError("Something went wrong. Tap to retry.");
    } finally {
      setIsLoading(false);
    }
  }, [photo, photoBase64, photoMediaType, profile, selectedOccasion, occasion, result]);

  useEffect(() => {
    if (!photo || !profile || !selectedOccasion) {
      router.push("/");
      return;
    }
    runFullPipeline();
  }, [photo, profile, selectedOccasion, router, runFullPipeline]);

  const handleRetry = () => {
    setResult(null);
    setError(null);
    setTimeout(() => runFullPipeline(), 100);
  };

  const handleShop = (url: string) => {
    if (url) window.open(url, "_blank");
  };

  if (!photo || !profile) return null;

  const STEPS = [
    `Designing the perfect ${occasion?.name || "look"} outfit...`,
    "Searching Namshi for real products...",
    "AI Vision selecting the best fit for you...",
    "Dressing you in the top...",
    "Applying the bottoms...",
    "Final styling & analysis...",
  ];

  return (
    <div className="min-h-screen px-5 py-8">
      <button
        onClick={() => router.push("/occasions")}
        className="mb-6 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        &larr; Change Occasion
      </button>

      {/* ── Loading ── */}
      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="text-center mb-2">
            <span className="text-3xl">{occasion?.icon}</span>
            <h1 className="text-xl font-bold text-white mt-2">{occasion?.name}</h1>
            <p className="text-xs text-white/40 mt-1">AI is styling you...</p>
          </div>

          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden">
            <img src={photo} alt="You" className="h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="glass rounded-2xl px-8 py-6 text-center max-w-[260px]">
                <div className="h-5 w-5 mx-auto rounded-full bg-gold-400 animate-pulse mb-4" />
                <p className="text-sm font-semibold text-white">Finding your look</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full transition-colors duration-500 ${loadingStep >= i ? "bg-gold-400" : "bg-white/10"}`} />
                <p className={`text-xs transition-colors duration-500 ${loadingStep >= i ? "text-white/70" : "text-white/20"}`}>{step}</p>
                {loadingStep === i && (
                  <div className="h-1 flex-1 rounded bg-white/5 overflow-hidden">
                    <div className="h-full bg-gold-400/40 rounded shimmer" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Error ── */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-white/50 text-sm">{error}</p>
          <button onClick={handleRetry} className="rounded-xl bg-gold-400 px-6 py-3 text-sm font-semibold text-black">
            Retry
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {result && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Outfit name */}
          <div className="text-center mb-2">
            <span className="text-2xl">{occasion?.icon}</span>
            <h1 className="text-xl font-bold text-white mt-1">{result.outfit.name}</h1>
            <p className="text-xs text-white/40 mt-0.5">
              {result.outfit.totalPrice} AED &middot; {occasion?.name}
            </p>
          </div>

          {/* Photo toggle */}
          <div className="relative">
            {result.tryOnImage && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setShowGenerated(false)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${!showGenerated ? "bg-gold-400 text-black" : "bg-white/10 text-white/60"}`}
                >
                  Original
                </button>
                <button
                  onClick={() => setShowGenerated(true)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${showGenerated ? "bg-gold-400 text-black" : "bg-white/10 text-white/60"}`}
                >
                  Virtual Try-On
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {showGenerated && result.tryOnImage ? (
                <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="relative aspect-[3/4] rounded-3xl overflow-hidden">
                  <img src={result.tryOnImage} alt="Try-On" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 rounded-full bg-gold-400 px-3 py-1">
                    <span className="text-[10px] font-bold text-black uppercase tracking-wider">AI Generated</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-bold text-white">{result.outfit.name}</h2>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="orig" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="relative aspect-[3/4] rounded-3xl overflow-hidden">
                  <img src={photo} alt="You" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-xl font-bold text-white">Your Photo</h2>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI-Picked Products */}
          {(result.products.top || result.products.bottom) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 space-y-3">
              <p className="text-xs uppercase tracking-widest text-gold-400/70">AI-Picked from Namshi</p>
              {[result.products.top, result.products.bottom].filter(Boolean).map((product, i) => (
                <div key={i} className="flex items-center gap-3 glass rounded-xl p-2">
                  <img src={product!.imageUrl} alt={product!.title} className="h-16 w-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gold-400 font-semibold uppercase">{product!.brand}</p>
                    <p className="text-xs text-white/80 truncate">{product!.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-bold text-gold-400">{product!.price} AED</span>
                      {product!.originalPrice > product!.price && (
                        <span className="text-[10px] text-white/30 line-through">{product!.originalPrice} AED</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleShop(product!.productUrl)} className="rounded-lg bg-gold-400 px-3 py-1.5 text-[10px] font-bold text-black flex-shrink-0">
                    Shop
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {/* AI Analysis */}
          {result.analysis && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 border border-gold-400/30 p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase tracking-widest text-gold-400/70">AI Verdict</p>
                  <span className="text-2xl font-bold text-gold-400">{result.analysis.confidenceScore}/100</span>
                </div>
                <p className="text-white font-semibold text-lg leading-snug">{result.analysis.verdict}</p>
              </div>

              <div className="glass rounded-2xl p-5 space-y-4">
                <p className="text-xs uppercase tracking-widest text-gold-400/70">How It Looks On You</p>
                <p className="text-sm text-white/80 leading-relaxed">{result.analysis.overallLook}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Fit</p>
                    <p className="text-xs text-white/70">{result.analysis.fitAnalysis}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Colors</p>
                    <p className="text-xs text-white/70">{result.analysis.colorHarmony}</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <p className="text-xs uppercase tracking-widest text-gold-400/70 mb-3">Styling Tips</p>
                {result.analysis.stylingTips.map((tip: string, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                    className="flex items-start gap-3 mb-2">
                    <span className="text-gold-400 text-xs mt-0.5 font-mono">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-sm text-white/70 flex-1">{tip}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-3 pb-8">
            <button onClick={handleRetry}
              className="w-full rounded-2xl border border-gold-400/30 py-3 text-sm font-semibold text-gold-400 hover:bg-gold-400/10 transition-colors">
              Try Another Look
            </button>
            <button onClick={() => router.push("/share")}
              className="w-full rounded-2xl bg-gradient-to-r from-gold-400 to-gold-500 py-4 text-lg font-bold text-black shadow-lg shadow-gold-400/20 active:scale-[0.98] transition-transform">
              Share This Look
            </button>
            <button onClick={() => router.push("/occasions")}
              className="w-full rounded-2xl border border-white/10 py-3 text-sm text-white/60 hover:text-white/80 transition-colors">
              Change Occasion
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
