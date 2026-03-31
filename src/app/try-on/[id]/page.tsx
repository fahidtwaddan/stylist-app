"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import TryOnView from "@/components/TryOnView";
import { useStyleStore } from "@/store/useStyleStore";

interface MatchedProduct {
  brand: string;
  title: string;
  price: number;
  originalPrice: number;
  productUrl: string;
  imageUrl: string;
}

export default function TryOnPage() {
  const router = useRouter();
  const {
    selectedOutfit,
    photo,
    photoBase64,
    photoMediaType,
    profile,
    bodyShapeImage,
    tryOnAnalysis,
    tryOnImage,
    isTryOnLoading,
    setTryOnAnalysis,
    setTryOnImage,
    setTryOnLoading,
  } = useStyleStore();

  const displayPhoto = photo || bodyShapeImage;

  const [showGenerated, setShowGenerated] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [matchedProducts, setMatchedProducts] = useState<{
    top: MatchedProduct | null;
    bottom: MatchedProduct | null;
  }>({ top: null, bottom: null });
  const hasRun = useRef(false);

  // Animate through loading steps
  useEffect(() => {
    if (!isTryOnLoading) {
      setLoadingStep(0);
      return;
    }
    const timers = [0, 1, 2, 3, 4].map((step, i) =>
      setTimeout(() => setLoadingStep(step), i * 10000)
    );
    return () => timers.forEach(clearTimeout);
  }, [isTryOnLoading]);

  const runTryOn = useCallback(async () => {
    if (hasRun.current) return;
    if (!selectedOutfit || !displayPhoto) return;
    if (tryOnAnalysis) return;
    hasRun.current = true;

    let b64 = photoBase64;
    let mType = photoMediaType;
    if (!b64 && photo && photo.startsWith("data:")) {
      const [header, data] = photo.split(",");
      b64 = data;
      const mimeMatch = header.match(/data:(image\/\w+)/);
      mType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    }
    // Allow body-type users (no photo) to proceed with bodyShapeImage
    if (!b64 && !bodyShapeImage) return;

    setTryOnLoading(true);
    try {
      const response = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoBase64: b64 || null,
          mediaType: mType || "image/jpeg",
          outfit: selectedOutfit,
          profile,
          bodyShapeImage: !b64 && bodyShapeImage ? bodyShapeImage : null,
        }),
      });

      if (!response.ok) throw new Error("Try-on failed");
      const data = await response.json();
      setTryOnAnalysis(data.analysis);
      if (data.tryOnImage) {
        setTryOnImage(data.tryOnImage);
        setShowGenerated(true);
      }
      if (data.products) {
        setMatchedProducts(data.products);
      }
    } catch (error) {
      console.error("Try-on error:", error);
    } finally {
      setTryOnLoading(false);
    }
  }, [
    selectedOutfit, photo, photoBase64, photoMediaType, profile,
    bodyShapeImage, displayPhoto,
    tryOnAnalysis, setTryOnAnalysis, setTryOnImage, setTryOnLoading,
  ]);

  useEffect(() => {
    runTryOn();
  }, [runTryOn]);

  if (!selectedOutfit || !displayPhoto) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="text-center space-y-4">
          <p className="text-white/50">No outfit selected.</p>
          <button
            onClick={() => router.push("/outfits")}
            className="rounded-xl bg-gold-400 px-6 py-3 text-sm font-semibold text-black"
          >
            Back to Outfits
          </button>
        </div>
      </div>
    );
  }

  const handleShop = (url: string) => {
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen px-5 py-8">
      <button
        onClick={() => router.push("/outfits")}
        className="mb-6 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        &larr; All Outfits
      </button>

      {/* ── Loading: AI searching + generating ── */}
      {isTryOnLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden">
            <img
              src={displayPhoto}
              alt="You"
              className="h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="glass rounded-2xl px-8 py-6 text-center max-w-[260px]">
                <div className="h-5 w-5 mx-auto rounded-full bg-gold-400 animate-pulse mb-4" />
                <p className="text-base font-bold text-white mb-1">
                  {selectedOutfit.name}
                </p>
                <p className="text-xs text-white/50">
                  AI is finding the perfect pieces for you
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            {[
              "Searching Namshi for matching products...",
              "AI Vision analyzing best fit for you...",
              "Dressing you in the top...",
              "Applying the bottoms...",
              "Final styling & analysis...",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full transition-colors duration-500 ${
                    loadingStep >= i ? "bg-gold-400" : "bg-white/10"
                  }`}
                />
                <p
                  className={`text-xs transition-colors duration-500 ${
                    loadingStep >= i ? "text-white/70" : "text-white/20"
                  }`}
                >
                  {step}
                </p>
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

      {/* ── Results ── */}
      {!isTryOnLoading && (tryOnImage || tryOnAnalysis) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Photo toggle */}
          <div className="relative">
            {tryOnImage && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setShowGenerated(false)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                    !showGenerated ? "bg-gold-400 text-black" : "bg-white/10 text-white/60"
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setShowGenerated(true)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                    showGenerated ? "bg-gold-400 text-black" : "bg-white/10 text-white/60"
                  }`}
                >
                  Virtual Try-On
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {showGenerated && tryOnImage ? (
                <motion.div
                  key="generated"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="relative aspect-[3/4] rounded-3xl overflow-hidden"
                >
                  <img src={tryOnImage} alt="Virtual Try-On" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 rounded-full bg-gold-400 px-3 py-1">
                    <span className="text-[10px] font-bold text-black uppercase tracking-wider">
                      AI Generated
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-bold text-white">{selectedOutfit.name}</h2>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="original"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <TryOnView outfit={selectedOutfit} photoUrl={displayPhoto!} onShop={handleShop} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI-Matched Products from Namshi */}
          {(matchedProducts.top || matchedProducts.bottom) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 space-y-3"
            >
              <p className="text-xs uppercase tracking-widest text-gold-400/70">
                AI-Picked Products
              </p>
              <div className="space-y-2">
                {[matchedProducts.top, matchedProducts.bottom]
                  .filter(Boolean)
                  .map((product, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 glass rounded-xl p-2"
                    >
                      <img
                        src={product!.imageUrl}
                        alt={product!.title}
                        className="h-16 w-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gold-400 font-semibold uppercase">
                          {product!.brand}
                        </p>
                        <p className="text-xs text-white/80 truncate">
                          {product!.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-bold text-gold-400">
                            {product!.price} AED
                          </span>
                          {product!.originalPrice > product!.price && (
                            <span className="text-[10px] text-white/30 line-through">
                              {product!.originalPrice} AED
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleShop(product!.productUrl)}
                        className="rounded-lg bg-gold-400 px-3 py-1.5 text-[10px] font-bold text-black flex-shrink-0"
                      >
                        Shop
                      </button>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* AI Analysis */}
          {tryOnAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Verdict */}
              <div className="rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 border border-gold-400/30 p-5">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-gold-400/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-gold-400">{tryOnAnalysis.confidenceScore}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="h-4 w-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs uppercase tracking-widest text-gold-400/70">AI Verdict</p>
                    </div>
                    <p className="text-base text-white font-semibold leading-snug">{tryOnAnalysis.verdict}</p>
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
                  <p className="text-sm text-white/70 leading-relaxed">{tryOnAnalysis.overallLook}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="h-3.5 w-3.5 text-gold-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-xs uppercase tracking-wider text-white/40">Fit</p>
                    </div>
                    <p className="text-sm text-white/70 leading-snug">{tryOnAnalysis.fitAnalysis}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="h-3.5 w-3.5 text-gold-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      <p className="text-xs uppercase tracking-wider text-white/40">Colors</p>
                    </div>
                    <p className="text-sm text-white/70 leading-snug">{tryOnAnalysis.colorHarmony}</p>
                  </div>
                </div>
              </div>

              {/* Tips */}
              {tryOnAnalysis.stylingTips.length > 0 && (
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <svg className="h-4 w-4 text-gold-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-xs uppercase tracking-widest text-gold-400/70">Tips</p>
                  </div>
                  <div className="space-y-2">
                    {tryOnAnalysis.stylingTips.map((tip: string, i: number) => (
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3 pb-8"
          >
            <button
              onClick={() => router.push("/share")}
              className="w-full rounded-2xl bg-gradient-to-r from-gold-400 to-gold-500 py-4 text-lg font-bold text-black shadow-lg shadow-gold-400/20 active:scale-[0.98] transition-transform"
            >
              Share This Look
            </button>
            <button
              onClick={() => router.push("/outfits")}
              className="w-full rounded-2xl border border-white/10 py-3 text-sm text-white/60 hover:text-white/80 transition-colors"
            >
              View Other Outfits
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
