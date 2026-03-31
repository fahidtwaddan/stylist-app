"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, ShieldX, Pencil } from "lucide-react";
import StyleCard from "@/components/StyleCard";
import { useStyleStore } from "@/store/useStyleStore";

const DEFAULT_PALETTES: Record<string, { colors: string[]; avoid: string[] }> = {
  men: {
    colors: ["#2C3E50", "#1ABC9C", "#E67E22", "#ECF0F1", "#2980B9", "#8E44AD"],
    avoid: ["#FF69B4", "#FFD700", "#FF6347"],
  },
  women: {
    colors: ["#C0392B", "#2ECC71", "#3498DB", "#F39C12", "#9B59B6", "#1ABC9C"],
    avoid: ["#808080", "#556B2F", "#8B4513"],
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const profile = useStyleStore((s) => s.profile);
  const setProfile = useStyleStore((s) => s.setProfile);
  const gender = useStyleStore((s) => s.gender);

  const isManual = profile?.archetype === "Not analyzed";

  // For manual users: init colors from profile or defaults
  const defaults = DEFAULT_PALETTES[gender || "men"];
  const [palette, setPalette] = useState<string[]>(
    profile?.colorPalette?.length ? profile.colorPalette : defaults.colors
  );
  const [avoidColors, setAvoidColors] = useState<string[]>(
    profile?.avoidColors?.length ? profile.avoidColors : defaults.avoid
  );
  const [editingMain, setEditingMain] = useState(false);
  const [editingAvoid, setEditingAvoid] = useState(false);

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

  // Save colors to profile
  const saveColors = () => {
    setProfile({ ...profile, colorPalette: palette, avoidColors });
  };

  const handleContinue = () => {
    saveColors();
    router.push("/occasions");
  };

  const handleUpdatePalette = (colors: string[], avoid: string[]) => {
    setProfile({ ...profile, colorPalette: colors, avoidColors: avoid });
  };

  // ── Manual body-type users: simplified color-only view ──
  if (isManual) {
    return (
      <div className="min-h-screen px-5 py-8">
        <button
          onClick={() => router.push("/body-type")}
          className="mb-6 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          &larr; Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2"
        >
          <h1 className="text-2xl font-bold text-white">Your Style Colors</h1>
          <p className="mt-1 text-sm text-white/50">
            Pick colors that suit you — tap Edit to customize
          </p>
        </motion.div>

        {/* Your Colors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5 mt-6 space-y-4"
        >
          <div className="flex items-center gap-1.5">
            <Palette className="h-4 w-4 text-gold-400/60" />
            <p className="text-xs uppercase tracking-widest text-gold-400/70">
              Recommended Colors
            </p>
            <button
              onClick={() => { if (editingMain) saveColors(); setEditingMain(!editingMain); }}
              className="ml-auto flex items-center gap-1 text-xs text-gold-400/70 hover:text-gold-400 transition-colors"
            >
              <Pencil className="h-3 w-3" />
              {editingMain ? "Save" : "Edit"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {editingMain ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2 flex-wrap">
                {palette.map((color, i) => (
                  <div key={i} className="relative group">
                    <label className="block cursor-pointer">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => { const u = [...palette]; u[i] = e.target.value; setPalette(u); }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="h-12 w-12 rounded-xl shadow-lg border-2 border-white/20 hover:border-gold-400/50 transition-colors" style={{ backgroundColor: color }} />
                    </label>
                    {palette.length > 1 && (
                      <button
                        onClick={() => setPalette(palette.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
                {palette.length < 10 && (
                  <button
                    onClick={() => setPalette([...palette, "#888888"])}
                    className="h-12 w-12 rounded-xl border-2 border-dashed border-white/20 hover:border-gold-400/50 flex items-center justify-center text-white/30 hover:text-gold-400 transition-colors text-lg"
                  >
                    +
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                {palette.map((color, i) => (
                  <motion.div
                    key={color + i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex-1 aspect-square rounded-xl shadow-lg"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Avoid Colors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 mt-4 space-y-4"
        >
          <div className="flex items-center gap-1.5">
            <ShieldX className="h-4 w-4 text-red-400/60" />
            <p className="text-xs uppercase tracking-widest text-white/40">
              Colors to Avoid
            </p>
            <button
              onClick={() => { if (editingAvoid) saveColors(); setEditingAvoid(!editingAvoid); }}
              className="ml-auto flex items-center gap-1 text-xs text-gold-400/70 hover:text-gold-400 transition-colors"
            >
              <Pencil className="h-3 w-3" />
              {editingAvoid ? "Save" : "Edit"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {editingAvoid ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2 flex-wrap">
                {avoidColors.map((color, i) => (
                  <label key={i} className="block cursor-pointer relative">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => { const u = [...avoidColors]; u[i] = e.target.value; setAvoidColors(u); }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="h-10 w-10 rounded-xl border-2 border-white/20 hover:border-red-400/50 transition-colors relative" style={{ backgroundColor: color }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-[2px] w-6 bg-white/80 rotate-45 rounded" />
                      </div>
                    </div>
                  </label>
                ))}
              </motion.div>
            ) : (
              <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                {avoidColors.map((color, i) => (
                  <motion.div
                    key={color + i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="h-9 w-9 rounded-xl relative"
                    style={{ backgroundColor: color }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-[2px] w-6 bg-white/80 rotate-45 rounded" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 pb-8"
        >
          <button
            onClick={handleContinue}
            className="w-full rounded-2xl bg-gradient-to-r from-gold-400 to-gold-500 py-4 text-lg font-bold text-black shadow-lg shadow-gold-400/20 active:scale-[0.98] transition-transform"
          >
            Find My Outfits
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Photo-analyzed users: full StyleCard ──
  return (
    <div className="min-h-screen px-5 py-8">
      <button
        onClick={() => router.push("/")}
        className="mb-6 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        &larr; Start over
      </button>

      <StyleCard profile={profile} onUpdatePalette={handleUpdatePalette} />

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
