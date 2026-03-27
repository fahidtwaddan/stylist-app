"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Outfit } from "@/lib/types";
import FitScoreBar from "./FitScoreBar";

interface OutfitCardProps {
  outfit: Outfit;
  onClick: () => void;
  index: number;
}

export default function OutfitCard({ outfit, onClick, index }: OutfitCardProps) {
  const uniqueStores = Array.from(new Set(outfit.items.map((item) => item.store)));

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left glass rounded-2xl overflow-hidden"
    >
      {/* Color accent bar */}
      <div className="h-1 bg-gradient-to-r from-gold-400 to-gold-600" />

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{outfit.name}</h3>
            <p className="mt-0.5 text-xs text-white/50 line-clamp-2">
              {outfit.description}
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <p className="text-lg font-bold text-gold-400">
              {outfit.totalPrice}
            </p>
            <p className="text-xs text-white/40">{outfit.currency}</p>
          </div>
        </div>

        {/* Items preview with images */}
        <div className="flex gap-1.5">
          {outfit.items.map((item, i) => (
            <ItemThumb key={i} item={item} />
          ))}
        </div>

        {/* Fit Score */}
        <FitScoreBar score={outfit.fitScore} />

        {/* Store badges */}
        <div className="flex flex-wrap gap-1.5">
          {uniqueStores.map((store) => (
            <span
              key={store}
              className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-white/60"
            >
              {store}
            </span>
          ))}
        </div>
      </div>
    </motion.button>
  );
}

function ItemThumb({ item }: { item: Outfit["items"][0] }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex-1 rounded-lg bg-white/5 overflow-hidden">
      {item.imageUrl && !imgError ? (
        <div className="relative">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full aspect-square object-cover"
            onError={() => setImgError(true)}
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1">
            <p className="text-[9px] text-white/80 truncate text-center">
              {item.brand}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-2 text-center">
          <div className="w-full aspect-square rounded bg-white/5 flex items-center justify-center mb-1">
            <span className="text-white/20 text-lg">
              {item.category === "tops"
                ? "👔"
                : item.category === "bottoms"
                ? "👖"
                : item.category === "shoes"
                ? "👟"
                : item.category === "accessories"
                ? "⌚"
                : "🧥"}
            </span>
          </div>
          <p className="text-[10px] text-white/60 truncate">{item.category}</p>
          <p className="text-xs font-medium text-white/80 truncate mt-0.5">
            {item.brand}
          </p>
        </div>
      )}
    </div>
  );
}
