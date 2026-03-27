"use client";

import { motion } from "framer-motion";

interface ScanningAnimationProps {
  photoUrl: string;
  progress: number;
  stage: string;
}

export default function ScanningAnimation({
  photoUrl,
  progress,
  stage,
}: ScanningAnimationProps) {
  return (
    <div className="relative aspect-[3/4] w-full max-w-sm mx-auto overflow-hidden rounded-3xl">
      <img
        src={photoUrl}
        alt="Being analyzed"
        className="h-full w-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Corner brackets */}
      <div className="absolute inset-4">
        <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-gold-400" />
        <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-gold-400" />
        <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-gold-400" />
        <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-gold-400" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full" style={{
          backgroundImage: `
            linear-gradient(rgba(229,161,60,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(229,161,60,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }} />
      </div>

      {/* Data points */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        className="absolute left-8 top-1/4 flex items-center gap-2"
      >
        <div className="h-2 w-2 rounded-full bg-gold-400" />
        <span className="text-xs text-gold-300 font-mono">BODY_TYPE</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
        className="absolute right-8 top-1/3 flex items-center gap-2"
      >
        <span className="text-xs text-gold-300 font-mono">COLOR_SEASON</span>
        <div className="h-2 w-2 rounded-full bg-gold-400" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 1.5 }}
        className="absolute left-8 top-1/2 flex items-center gap-2"
      >
        <div className="h-2 w-2 rounded-full bg-gold-400" />
        <span className="text-xs text-gold-300 font-mono">SKIN_TONE</span>
      </motion.div>

      {/* Bottom progress */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <motion.span
              key={stage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-mono text-gold-300"
            >
              {stage}
            </motion.span>
            <span className="text-sm font-mono text-gold-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
