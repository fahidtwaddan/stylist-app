"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import OccasionCard from "@/components/OccasionCard";
import { useStyleStore } from "@/store/useStyleStore";
import { OCCASIONS } from "@/lib/stores";

export default function OccasionsPage() {
  const router = useRouter();
  const { selectedOccasion, setSelectedOccasion, profile, gender } = useStyleStore();
  const [customPrompt, setCustomPrompt] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  /** Resolved public URL per occasion, or undefined if neither .webp nor .png exists */
  const [previewSrcByOccasion, setPreviewSrcByOccasion] = useState<
    Record<string, string | undefined>
  >({});

  const g = gender || profile?.gender || "men";

  // Resolve preview: prefer .webp, fall back to .png (static files use mixed formats)
  useEffect(() => {
    let cancelled = false;
    const results: Record<string, string | undefined> = {};
    let remaining = OCCASIONS.length;

    const done = () => {
      remaining--;
      if (remaining === 0 && !cancelled) setPreviewSrcByOccasion({ ...results });
    };

    OCCASIONS.forEach((occ) => {
      const tryLoad = (ext: "webp" | "png") => {
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          results[occ.id] = `/model/${g}/${occ.id}.${ext}`;
          done();
        };
        img.onerror = () => {
          if (cancelled) return;
          if (ext === "webp") tryLoad("png");
          else {
            results[occ.id] = undefined;
            done();
          }
        };
        img.src = `/model/${g}/${occ.id}.${ext}`;
      };
      tryLoad("webp");
    });

    return () => {
      cancelled = true;
    };
  }, [g]);

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
    if (isCustomMode && customPrompt.trim()) {
      setSelectedOccasion(`custom:${customPrompt.trim()}`);
      router.push("/try-on/auto");
    } else if (selectedOccasion) {
      router.push("/try-on/auto");
    }
  };

  const handleCustomSelect = () => {
    setIsCustomMode(true);
    setSelectedOccasion(null as unknown as string);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleOccasionSelect = (id: string) => {
    setIsCustomMode(false);
    setCustomPrompt("");
    setSelectedOccasion(id);
  };

  const canContinue = isCustomMode ? customPrompt.trim().length > 10 : !!selectedOccasion;

  return (
    <div className="min-h-screen px-5 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/")}
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
          Where are you headed?
        </p>
      </motion.div>

      {/* Custom Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-4"
      >
        <button
          onClick={handleCustomSelect}
          className={`w-full rounded-2xl p-4 text-left transition-all border ${
            isCustomMode
              ? "border-gold-400/60 bg-gold-400/10"
              : "border-white/10 glass hover:border-gold-400/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔍</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Prompt Your Occasion & Style</p>
              <p className="text-xs text-white/40 mt-0.5">Describe exactly what you need</p>
            </div>
          </div>
        </button>

        {isCustomMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3"
          >
            <textarea
              ref={inputRef}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. I have a wedding tomorrow, suggest me good clothes for a 40 year old — bold and classy"
              rows={3}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/25 focus:border-gold-400/50 focus:outline-none resize-none"
            />
            {customPrompt.trim().length > 0 && customPrompt.trim().length <= 10 && (
              <p className="text-xs text-white/30 mt-1.5">Add more detail for better results</p>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Divider */}
      {isCustomMode && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">or pick an occasion</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
      )}

      {/* Occasions Grid */}
      <div className="grid grid-cols-1 gap-3">
        {OCCASIONS.map((occasion, i) => (
          <OccasionCard
            key={occasion.id}
            icon={occasion.icon}
            name={occasion.name}
            description={occasion.description}
            isSelected={!isCustomMode && selectedOccasion === occasion.id}
            onClick={() => handleOccasionSelect(occasion.id)}
            index={i}
            previewImage={previewSrcByOccasion[occasion.id]}
          />
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: canContinue ? 1 : 0.5 }}
        className="mt-8 pb-8"
      >
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full rounded-2xl bg-gradient-to-r from-gold-400 to-gold-500 py-4 text-lg font-bold text-black shadow-lg shadow-gold-400/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
        >
          {isCustomMode ? "Style Me" : "Get My Outfits"}
        </button>
      </motion.div>
    </div>
  );
}
