"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import OutfitCard from "@/components/OutfitCard";
import { useStyleStore } from "@/store/useStyleStore";
import { OCCASIONS } from "@/lib/stores";

export default function OutfitsPage() {
  const router = useRouter();
  const {
    profile,
    selectedOccasion,
    outfits,
    isLoadingOutfits,
    setOutfits,
    setSelectedOutfit,
    setLoadingOutfits,
  } = useStyleStore();

  const loadOutfits = useCallback(async () => {
    if (!profile || !selectedOccasion) return;
    if (outfits.length > 0) return;

    setLoadingOutfits(true);

    try {
      const occasion = OCCASIONS.find((o) => o.id === selectedOccasion);
      const response = await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          occasion: occasion?.name || selectedOccasion,
        }),
      });

      if (!response.ok) throw new Error("Failed to load outfits");

      const data = await response.json();
      setOutfits(data.outfits);
    } catch (error) {
      console.error("Outfit loading error:", error);
    } finally {
      setLoadingOutfits(false);
    }
  }, [profile, selectedOccasion, outfits.length, setOutfits, setLoadingOutfits]);

  useEffect(() => {
    if (!profile || !selectedOccasion) {
      router.push("/");
      return;
    }
    loadOutfits();
  }, [profile, selectedOccasion, router, loadOutfits]);

  if (!profile || !selectedOccasion) return null;

  const occasionName =
    OCCASIONS.find((o) => o.id === selectedOccasion)?.name || selectedOccasion;

  const handleOutfitClick = (outfit: (typeof outfits)[0]) => {
    setSelectedOutfit(outfit);
    router.push(`/try-on/${outfit.id}`);
  };

  return (
    <div className="min-h-screen px-5 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/occasions")}
        className="mb-6 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        &larr; Occasions
      </button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-white">Your Outfits</h1>
        <p className="mt-1 text-sm text-white/50">
          6 curated looks for {occasionName}
        </p>
      </motion.div>

      {isLoadingOutfits ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl h-48 shimmer" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {outfits.map((outfit, i) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              onClick={() => handleOutfitClick(outfit)}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Share CTA */}
      {outfits.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 pb-8"
        >
          <button
            onClick={() => router.push("/share")}
            className="w-full rounded-2xl border border-gold-400/30 py-4 text-sm font-semibold text-gold-400 hover:bg-gold-400/10 transition-colors"
          >
            Share & Earn Commission
          </button>
        </motion.div>
      )}
    </div>
  );
}
