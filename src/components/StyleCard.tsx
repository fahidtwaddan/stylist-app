"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Quote,
  User,
  Sun,
  Palette,
  ShieldX,
  Sparkles,
  Lightbulb,
  Pencil,
} from "lucide-react";
import type { StyleProfile } from "@/lib/types";

interface StyleCardProps {
  profile: StyleProfile;
  onUpdatePalette?: (colors: string[], avoidColors: string[]) => void;
}

export default function StyleCard({ profile, onUpdatePalette }: StyleCardProps) {
  const [editingColors, setEditingColors] = useState(false);
  const [palette, setPalette] = useState<string[]>(profile.colorPalette);
  const [avoidColors, setAvoidColors] = useState<string[]>(profile.avoidColors);

  const handleColorChange = (index: number, color: string) => {
    const updated = [...palette];
    updated[index] = color;
    setPalette(updated);
  };

  const handleAvoidColorChange = (index: number, color: string) => {
    const updated = [...avoidColors];
    updated[index] = color;
    setAvoidColors(updated);
  };

  const handleSaveColors = () => {
    setEditingColors(false);
    onUpdatePalette?.(palette, avoidColors);
  };

  const handleAddColor = () => {
    if (palette.length < 10) {
      setPalette([...palette, "#888888"]);
    }
  };

  const handleRemoveColor = (index: number) => {
    if (palette.length > 1) {
      setPalette(palette.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-4">
      {/* Archetype */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Crown className="mx-auto h-5 w-5 text-gold-400/70" />
        <p className="text-xs uppercase tracking-widest text-gold-400/70 mt-1">
          Your Style Archetype
        </p>
        <h2 className="mt-1 text-2xl font-bold text-gradient">
          {profile.archetype}
        </h2>
        <p className="mt-1 text-xs text-white/60">{profile.personality}</p>
      </motion.div>

      {/* Narrative */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-4"
      >
        <Quote className="h-4 w-4 text-gold-400/50 mb-1.5" />
        <p className="text-xs italic leading-relaxed text-white/70">
          &ldquo;{profile.narrative}&rdquo;
        </p>
      </motion.div>

      {/* Stats — 3 cols */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-2"
      >
        {[
          { icon: User, label: "Body", value: profile.bodyType },
          { icon: Sun, label: "Skin", value: profile.skinTone },
          { icon: Sparkles, label: "Season", value: profile.colorSeason },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass rounded-xl p-3 text-center">
            <Icon className="h-3.5 w-3.5 text-gold-400/60 mx-auto mb-1" />
            <p className="text-[9px] uppercase tracking-wider text-white/40">
              {label}
            </p>
            <p className="text-[11px] font-semibold text-white mt-0.5 leading-tight">
              {value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Colors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-gold-400/60" />
          <p className="text-[10px] uppercase tracking-widest text-white/40">
            Your Colors
          </p>
          {onUpdatePalette && (
            <button
              onClick={() => editingColors ? handleSaveColors() : setEditingColors(true)}
              className="ml-auto flex items-center gap-1 text-[10px] text-gold-400/70 hover:text-gold-400 transition-colors"
            >
              <Pencil className="h-3 w-3" />
              {editingColors ? "Save" : "Edit"}
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {editingColors ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="flex gap-1.5 flex-wrap">
                {palette.map((color, i) => (
                  <div key={i} className="relative group">
                    <label className="block cursor-pointer">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(i, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div
                        className="h-10 w-10 rounded-lg shadow-lg border-2 border-white/20 hover:border-gold-400/50 transition-colors"
                        style={{ backgroundColor: color }}
                      />
                    </label>
                    {palette.length > 1 && (
                      <button
                        onClick={() => handleRemoveColor(i)}
                        className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
                {palette.length < 10 && (
                  <button
                    onClick={handleAddColor}
                    className="h-10 w-10 rounded-lg border-2 border-dashed border-white/20 hover:border-gold-400/50 flex items-center justify-center text-white/30 hover:text-gold-400 transition-colors"
                  >
                    +
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex gap-1.5">
                {palette.map((color, i) => (
                  <motion.div
                    key={color + i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.04 }}
                    className="flex-1 aspect-square rounded-lg shadow-lg"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1.5 pt-1">
          <ShieldX className="h-3.5 w-3.5 text-red-400/60" />
          <p className="text-[10px] uppercase tracking-widest text-white/40">
            Avoid
          </p>
        </div>

        <AnimatePresence mode="wait">
          {editingColors ? (
            <motion.div key="edit-avoid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex gap-1.5 flex-wrap">
                {avoidColors.map((color, i) => (
                  <label key={i} className="block cursor-pointer relative">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleAvoidColorChange(i, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div
                      className="h-8 w-8 rounded-lg border-2 border-white/20 hover:border-red-400/50 transition-colors relative"
                      style={{ backgroundColor: color }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-[2px] w-5 bg-white/80 rotate-45 rounded" />
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="view-avoid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex gap-1.5">
                {avoidColors.map((color, i) => (
                  <motion.div
                    key={color + i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.04 }}
                    className="h-7 w-7 rounded-lg relative"
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-[2px] w-5 bg-white/80 rotate-45 rounded" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-4"
      >
        <div className="flex items-center gap-1.5 mb-2.5">
          <Lightbulb className="h-3.5 w-3.5 text-gold-400/60" />
          <p className="text-[10px] uppercase tracking-widest text-white/40">
            Recommendations
          </p>
        </div>
        <div className="space-y-1.5">
          {profile.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-gold-400/50 text-[10px] mt-0.5">
                &#9670;
              </span>
              <p className="text-[11px] text-white/60 flex-1 leading-snug">
                {rec}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
