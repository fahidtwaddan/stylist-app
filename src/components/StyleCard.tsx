"use client";

import { motion } from "framer-motion";
import type { StyleProfile } from "@/lib/types";

interface StyleCardProps {
  profile: StyleProfile;
}

export default function StyleCard({ profile }: StyleCardProps) {
  return (
    <div className="space-y-6">
      {/* Archetype Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-sm uppercase tracking-widest text-gold-400/70">
          Your Style Archetype
        </p>
        <h2 className="mt-2 text-3xl font-bold text-gradient">
          {profile.archetype}
        </h2>
        <p className="mt-2 text-sm text-white/60">{profile.personality}</p>
      </motion.div>

      {/* Narrative */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5"
      >
        <p className="text-sm italic leading-relaxed text-white/70">
          &ldquo;{profile.narrative}&rdquo;
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-white/40">
            Body Type
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {profile.bodyType}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-white/40">
            Skin Tone
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {profile.skinTone}
          </p>
        </div>
        <div className="glass rounded-2xl p-4 col-span-2">
          <p className="text-xs uppercase tracking-wider text-white/40">
            Color Season
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {profile.colorSeason}
          </p>
        </div>
      </motion.div>

      {/* Color Palette */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <p className="text-xs uppercase tracking-widest text-white/40">
          Your Color Palette
        </p>
        <div className="flex gap-2">
          {profile.colorPalette.map((color, i) => (
            <motion.div
              key={color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="flex-1 aspect-square rounded-xl shadow-lg"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        <p className="text-xs uppercase tracking-widest text-white/40 mt-4">
          Colors to Avoid
        </p>
        <div className="flex gap-2">
          {profile.avoidColors.map((color, i) => (
            <motion.div
              key={color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="h-8 w-8 rounded-lg relative"
              style={{ backgroundColor: color }}
              title={color}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-[2px] w-6 bg-white/80 rotate-45 rounded" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <p className="text-xs uppercase tracking-widest text-white/40">
          Style Recommendations
        </p>
        <div className="space-y-2">
          {profile.recommendations.map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass rounded-xl p-3 flex items-start gap-3"
            >
              <span className="text-gold-400 text-sm mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm text-white/70">{rec}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
