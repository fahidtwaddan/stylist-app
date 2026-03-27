"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import StyleCard from "@/components/StyleCard";
import { useStyleStore } from "@/store/useStyleStore";

export default function ProfilePage() {
  const router = useRouter();
  const profile = useStyleStore((s) => s.profile);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="text-center space-y-4">
          <p className="text-white/50">No style profile found.</p>
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

  return (
    <div className="min-h-screen px-5 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="mb-6 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        &larr; Start over
      </button>

      <StyleCard profile={profile} />

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 pb-8"
      >
        <button
          onClick={() => router.push("/occasions")}
          className="w-full rounded-2xl bg-gradient-to-r from-gold-400 to-gold-500 py-4 text-lg font-bold text-black shadow-lg shadow-gold-400/20 active:scale-[0.98] transition-transform"
        >
          Find My Outfits
        </button>
      </motion.div>
    </div>
  );
}
