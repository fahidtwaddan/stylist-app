"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import OccasionCard from "@/components/OccasionCard";
import { useStyleStore } from "@/store/useStyleStore";
import { OCCASIONS } from "@/lib/stores";

export default function OccasionsPage() {
  const router = useRouter();
  const { selectedOccasion, setSelectedOccasion, profile } = useStyleStore();

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="text-center space-y-4">
          <p className="text-white/50">Please complete your style analysis first.</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-gold-400 px-6 py-3 text-sm font-semibold text-black"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const handleContinue = () => {
    if (selectedOccasion) {
      router.push("/try-on/auto");
    }
  };

  return (
    <div className="min-h-screen px-5 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/profile")}
        className="mb-6 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        &larr; Style Profile
      </button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-white">Pick Your Occasion</h1>
        <p className="mt-1 text-sm text-white/50">
          Where are you headed, {profile.archetype}?
        </p>
      </motion.div>

      {/* Occasions Grid */}
      <div className="grid grid-cols-1 gap-3">
        {OCCASIONS.map((occasion, i) => (
          <OccasionCard
            key={occasion.id}
            icon={occasion.icon}
            name={occasion.name}
            description={occasion.description}
            isSelected={selectedOccasion === occasion.id}
            onClick={() => setSelectedOccasion(occasion.id)}
            index={i}
          />
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: selectedOccasion ? 1 : 0.5 }}
        className="mt-8 pb-8"
      >
        <button
          onClick={handleContinue}
          disabled={!selectedOccasion}
          className="w-full rounded-2xl bg-gradient-to-r from-gold-400 to-gold-500 py-4 text-lg font-bold text-black shadow-lg shadow-gold-400/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
        >
          Get My Outfits
        </button>
      </motion.div>
    </div>
  );
}
