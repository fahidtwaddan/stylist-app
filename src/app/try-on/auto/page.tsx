"use client";

import { useEffect, useCallback, useState, useRef } from "react";
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
  sizes?: string[];
}

interface SearchResultInfo {
  query: string;
  category: string;
  candidates: { brand: string; title: string; imageUrl: string; price: number }[];
  pickedIndex: number;
  picked: MatchedProduct | null;
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
    autoTryOnResult: cachedResult,
    autoTryOnSearchResults: cachedSearchResults,
    setAutoTryOnResult,
    setAutoTryOnSearchResults,
  } = useStyleStore();

  const [result, setResult] = useState<TryOnResult | null>(cachedResult);
  const [isLoading, setIsLoading] = useState(false);
  const [liveStep, setLiveStep] = useState("Starting...");
  const [showGenerated, setShowGenerated] = useState(!!cachedResult?.tryOnImage);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{
    top: SearchResultInfo | null;
    bottom: SearchResultInfo | null;
  } | null>(cachedSearchResults);
  const hasRun = useRef(!!cachedResult);

  const occasion = OCCASIONS.find((o) => o.id === selectedOccasion);

  const runFullPipeline = useCallback(async () => {
    if (hasRun.current) return;
    if (!photo || !profile || !selectedOccasion) return;
    if (result) return;
    hasRun.current = true;

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
    setLiveStep("Starting...");

    try {
      // Step 1: Start the job
      const startRes = await fetch("/api/ai-stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoBase64: b64,
          mediaType: mType || "image/jpeg",
          profile,
          occasion: occasion?.name || selectedOccasion,
        }),
      });

      if (!startRes.ok) throw new Error("Failed to start styling");
      const { jobId } = await startRes.json();

      // Step 2: Poll for completion
      while (true) {
        await new Promise((r) => setTimeout(r, 2000)); // Poll every 2s

        const pollRes = await fetch(`/api/ai-stylist?jobId=${jobId}`);
        if (!pollRes.ok) throw new Error("Polling failed");
        const data = await pollRes.json();

        setLiveStep(data.step || "Processing...");
        if (data.searchResults) {
          setSearchResults(data.searchResults);
          setAutoTryOnSearchResults(data.searchResults);
        }

        if (data.status === "completed") {
          setResult(data);
          setAutoTryOnResult(data);
          if (data.tryOnImage) setShowGenerated(true);
          break;
        }

        if (data.status === "failed") {
          throw new Error(data.error || "Styling failed");
        }
      }
    } catch (err) {
      console.error("Pipeline error:", err);
      setError("Something went wrong. Tap to retry.");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, photoBase64, photoMediaType, profile, selectedOccasion, occasion, result]);

  useEffect(() => {
    if (!photo || !profile || !selectedOccasion) {
      router.push("/");
      return;
    }
    runFullPipeline();
  }, [photo, profile, selectedOccasion, router, runFullPipeline]);

  const handleRetry = () => {
    hasRun.current = false;
    setResult(null);
    setSearchResults(null);
    setAutoTryOnResult(null);
    setAutoTryOnSearchResults(null);
    setError(null);
    setTimeout(() => runFullPipeline(), 100);
  };

  const handleShop = (url: string) => {
    if (url) window.open(url, "_blank");
  };

  if (!photo || !profile) return null;

  // Live step comes from the server via polling

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

          {/* Live search & selection feed */}
          {searchResults && (searchResults.top || searchResults.bottom) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {[
                { label: "Top", sr: searchResults.top },
                { label: "Bottom", sr: searchResults.bottom },
              ].filter((x) => x.sr).map(({ label, sr }, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}
                  className="glass rounded-2xl p-4 space-y-3">
                  {/* Search query */}
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-xs text-white/50">
                      Searched <span className="text-white/70 font-medium">&ldquo;{sr!.query}&rdquo;</span>
                    </p>
                    <span className="text-xs text-gold-400/60 ml-auto">{sr!.candidates.length} found</span>
                  </div>

                  {/* Candidate thumbnails */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                    {sr!.candidates.map((c, ci) => (
                      <div key={ci} className={`relative flex-shrink-0 w-11 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        ci === sr!.pickedIndex ? "border-gold-400 shadow-md shadow-gold-400/20" : "border-transparent opacity-40"
                      }`}>
                        <img src={c.imageUrl} alt={c.title} className="h-full w-full object-cover" />
                        {ci === sr!.pickedIndex && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <svg className="h-4 w-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* AI picked product */}
                  {sr!.picked && (
                    <div className="flex items-center gap-3 rounded-xl bg-gold-400/5 border border-gold-400/20 p-2">
                      <div className="relative">
                        <img src={sr!.picked.imageUrl} alt={sr!.picked.title} className="h-14 w-10 rounded-lg object-cover flex-shrink-0" />
                        <span className="absolute -top-1.5 -left-1.5 bg-gold-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{label}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gold-400 font-semibold uppercase">{sr!.picked.brand}</p>
                        <p className="text-sm text-white/80 truncate">{sr!.picked.title}</p>
                        <span className="text-sm font-bold text-gold-400">{sr!.picked.price} AED</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                        <svg className="h-4 w-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-[10px] text-gold-400/70 uppercase font-semibold">AI Pick</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-gold-400 animate-pulse" />
              <p className="text-sm text-gold-300 font-mono">{liveStep}</p>
            </div>
            <div className="mt-3 h-1 w-full rounded bg-white/5 overflow-hidden">
              <div className="h-full bg-gold-400/40 rounded shimmer" />
            </div>
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
            {result.tryOnImage ? (
              <>
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
                <AnimatePresence mode="wait">
                  {showGenerated ? (
                    <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="relative aspect-[3/4] rounded-3xl overflow-hidden">
                      <img src={result.tryOnImage} alt="Try-On" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3 rounded-full bg-gold-400 px-3 py-1">
                        <span className="text-xs font-bold text-black uppercase tracking-wider">AI Generated</span>
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
              </>
            ) : (
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden">
                <img src={photo} alt="You" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-xl font-bold text-white">{result.outfit.name}</h2>
                </div>
                <div className="absolute top-3 right-3 glass rounded-full px-3 py-1.5 flex items-center gap-1.5">
                  <svg className="h-3 w-3 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-white/50">Try-on unavailable</span>
                </div>
              </div>
            )}
          </div>

          {/* AI-Picked Products with Sizes */}
          {(result.products.top || result.products.bottom) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-sm uppercase tracking-widest text-gold-400/70">AI-Picked from Namshi</p>
              </div>
              {[
                { label: "Top", product: result.products.top },
                { label: "Bottom", product: result.products.bottom },
              ].filter((x) => x.product).map(({ label, product }, i) => (
                <div key={i} className="glass rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={product!.imageUrl} alt={product!.title} className="h-20 w-14 rounded-lg object-cover flex-shrink-0" />
                      <span className="absolute -top-1 -left-1 bg-gold-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{label}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gold-400 font-semibold uppercase">{product!.brand}</p>
                      <p className="text-sm text-white/80 truncate">{product!.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-bold text-gold-400">{product!.price} AED</span>
                        {product!.originalPrice > product!.price && (
                          <span className="text-xs text-white/30 line-through">{product!.originalPrice} AED</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleShop(product!.productUrl)} className="rounded-lg bg-gold-400 px-3 py-1.5 text-xs font-bold text-black flex-shrink-0">
                      Shop
                    </button>
                  </div>
                  {/* Available sizes — only shown when real data exists */}
                  {product!.sizes && product!.sizes.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-white/30 flex-shrink-0">Available:</span>
                      {product!.sizes.map((size, si) => (
                        <span key={si} className="text-xs text-white/60 bg-white/5 rounded px-1.5 py-0.5">
                          {size}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {/* AI Analysis */}
          {result.analysis && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {/* Verdict */}
              <div className="rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 border border-gold-400/30 p-5">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-gold-400/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-gold-400">{result.analysis.confidenceScore}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="h-4 w-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs uppercase tracking-widest text-gold-400/70">AI Verdict</p>
                    </div>
                    <p className="text-base text-white font-semibold leading-snug">{result.analysis.verdict}</p>
                  </div>
                </div>
              </div>

              {/* Overall + Fit + Colors */}
              <div className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-gold-400/60 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p className="text-sm text-white/70 leading-relaxed">{result.analysis.overallLook}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="h-3.5 w-3.5 text-gold-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-xs uppercase tracking-wider text-white/40">Fit</p>
                    </div>
                    <p className="text-sm text-white/70 leading-snug">{result.analysis.fitAnalysis}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="h-3.5 w-3.5 text-gold-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      <p className="text-xs uppercase tracking-wider text-white/40">Colors</p>
                    </div>
                    <p className="text-sm text-white/70 leading-snug">{result.analysis.colorHarmony}</p>
                  </div>
                </div>
              </div>

              {/* Tips */}
              {result.analysis.stylingTips.length > 0 && (
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <svg className="h-4 w-4 text-gold-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-xs uppercase tracking-widest text-gold-400/70">Tips</p>
                  </div>
                  <div className="space-y-2">
                    {result.analysis.stylingTips.map((tip: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-gold-400/50 text-xs mt-0.5">&#9670;</span>
                        <p className="text-sm text-white/60 flex-1 leading-snug">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
