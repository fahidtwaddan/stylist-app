"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Outfit } from "@/lib/types";
import FitScoreBar from "./FitScoreBar";

interface TryOnViewProps {
  outfit: Outfit;
  photoUrl: string;
  onShop: (url: string) => void;
}

export default function TryOnView({ outfit, photoUrl, onShop }: TryOnViewProps) {
  return (
    <div className="space-y-6">
      {/* Photo with overlay */}
      <div className="relative aspect-[3/4] rounded-3xl overflow-hidden">
        <img
          src={photoUrl}
          alt="Your look"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-2xl font-bold text-white">{outfit.name}</h2>
          <FitScoreBar score={outfit.fitScore} />
        </div>
      </div>

      {/* Editorial Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5"
      >
        <p className="text-xs uppercase tracking-widest text-gold-400/70 mb-2">
          Stylist Note
        </p>
        <p className="text-sm italic text-white/70 leading-relaxed">
          &ldquo;{outfit.editorialNote}&rdquo;
        </p>
      </motion.div>

      {/* Outfit Items */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-white/40">
          Outfit Breakdown
        </p>
        {outfit.items.map((item, i) => (
          <ItemCard key={i} item={item} index={i} onShop={onShop} />
        ))}
      </div>

      {/* Total */}
      <div className="glass rounded-2xl p-4 flex items-center justify-between">
        <span className="text-sm text-white/60">Total</span>
        <span className="text-xl font-bold text-gradient">
          {outfit.totalPrice} {outfit.currency}
        </span>
      </div>
    </div>
  );
}

function ItemCard({
  item,
  index,
  onShop,
}: {
  item: Outfit["items"][0];
  index: number;
  onShop: (url: string) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass rounded-2xl p-4 flex items-center gap-3"
    >
      {/* Product image */}
      {item.imageUrl && !imgError ? (
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">
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
      )}

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-gold-400/60">
          {item.category}
        </span>
        <p className="font-medium text-white mt-0.5 truncate">{item.name}</p>
        <p className="text-xs text-white/50">
          {item.brand} via {item.store}
        </p>
      </div>

      {/* Price & Shop */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-gold-400">
          {item.price} {item.currency}
        </p>
        <button
          onClick={() => onShop(item.productUrl)}
          className="mt-1 text-xs text-gold-300 hover:text-gold-200 underline underline-offset-2"
        >
          Shop
        </button>
      </div>
    </motion.div>
  );
}
