"use client";

import { motion } from "framer-motion";

interface OccasionCardProps {
  icon: string;
  name: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

export default function OccasionCard({
  icon,
  name,
  description,
  isSelected,
  onClick,
  index,
}: OccasionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 transition-all duration-200 ${
        isSelected
          ? "bg-gold-400/20 border-2 border-gold-400"
          : "glass hover:bg-white/10"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold ${
              isSelected ? "text-gold-300" : "text-white"
            }`}
          >
            {name}
          </h3>
          <p className="mt-0.5 text-xs text-white/50 line-clamp-2">
            {description}
          </p>
        </div>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="h-6 w-6 rounded-full bg-gold-400 flex items-center justify-center flex-shrink-0"
          >
            <svg
              className="h-3 w-3 text-black"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
