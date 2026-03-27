"use client";

import { motion } from "framer-motion";

interface FitScoreBarProps {
  score: number;
}

export default function FitScoreBar({ score }: FitScoreBarProps) {
  const getColor = (s: number) => {
    if (s >= 95) return "from-emerald-400 to-emerald-300";
    if (s >= 90) return "from-gold-400 to-gold-300";
    if (s >= 85) return "from-amber-400 to-amber-300";
    return "from-orange-400 to-orange-300";
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/40 w-14 flex-shrink-0">
        Fit Score
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className={`h-full rounded-full bg-gradient-to-r ${getColor(score)}`}
        />
      </div>
      <span className="text-xs font-semibold text-gold-400 w-8 text-right">
        {score}
      </span>
    </div>
  );
}
