"use client";


import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GarmentOption {
  id: string;
  label: string;
  url: string;
  localImage?: string;
  category: string;
  color?: string;
  style?: string;
  brand?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  productUrl?: string;
  isReal?: boolean;
}

interface GarmentPickerProps {
  /** Outfit items to find garments for */
  items: {
    name: string;
    brand: string;
    category: string;
    searchQuery?: string;
  }[];
  /** Called when user confirms selections and wants to generate try-on */
  onGenerate: (selections: Record<string, string>) => void;
  /** Is the try-on currently generating? */
  isGenerating: boolean;
}

// Only show pickers for categories FASHN can apply
const TRYABLE_CATEGORIES = ["tops", "outerwear", "bottoms"];

export default function GarmentPicker({
  items,
  onGenerate,
  isGenerating,
}: GarmentPickerProps) {
  const tryableItems = items.filter((item) =>
    TRYABLE_CATEGORIES.includes(item.category)
  );

  // State: selected garment URL per category
  const [selections, setSelections] = useState<Record<string, string>>({});
  // State: available options per category
  const [options, setOptions] = useState<Record<string, GarmentOption[]>>({});
  // State: which category tab is active
  const [activeTab, setActiveTab] = useState(tryableItems[0]?.category || "tops");
  // State: loading
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  // Fetch garment options for all tryable items
  const fetchOptions = useCallback(async () => {
    if (hasRun.current) return;
    hasRun.current = true;
    setLoading(true);
    const results: Record<string, GarmentOption[]> = {};

    await Promise.all(
      tryableItems.map(async (item) => {
        const query = item.searchQuery || `${item.brand} ${item.name}`;
        const res = await fetch(
          `/api/garments?q=${encodeURIComponent(query)}&category=${item.category}&limit=12`
        );
        if (res.ok) {
          const data = await res.json();
          results[item.category] = data.garments;
          // Auto-select the first (best match)
          if (data.garments[0] && !selections[item.category]) {
            setSelections((prev) => ({
              ...prev,
              [item.category]: data.garments[0].url,
            }));
          }
        }
      })
    );

    setOptions(results);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleSelect = (category: string, url: string) => {
    setSelections((prev) => ({ ...prev, [category]: url }));
  };

  const hasSelections = Object.keys(selections).length > 0;

  const categoryLabels: Record<string, string> = {
    tops: "Top",
    outerwear: "Outerwear",
    bottoms: "Bottom",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Choose Your Garments
          </h3>
          <p className="text-xs text-white/40 mt-0.5">
            Pick what you want to try on
          </p>
        </div>
        {hasSelections && (
          <span className="text-[10px] text-gold-400/70 uppercase tracking-wider">
            {Object.keys(selections).length} selected
          </span>
        )}
      </div>

      {/* Category Tabs */}
      {tryableItems.length > 1 && (
        <div className="flex gap-2">
          {tryableItems.map((item) => (
            <button
              key={item.category}
              onClick={() => setActiveTab(item.category)}
              className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                activeTab === item.category
                  ? "bg-gold-400 text-black"
                  : "bg-white/10 text-white/60"
              }`}
            >
              {categoryLabels[item.category] || item.category}
            </button>
          ))}
        </div>
      )}

      {/* Garment Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-2xl bg-white/5 shimmer"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(options[activeTab] || []).map((garment) => {
                const isSelected = selections[activeTab] === garment.url;
                return (
                  <motion.button
                    key={garment.id}
                    onClick={() => handleSelect(activeTab, garment.url)}
                    whileTap={{ scale: 0.95 }}
                    className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-gold-400 shadow-lg shadow-gold-400/20"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={garment.localImage || garment.url}
                      alt={garment.label}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                    {/* Real product badge */}
                    {garment.isReal && (
                      <div className="absolute top-1.5 left-1.5 rounded-full bg-white/90 px-1.5 py-0.5">
                        <span className="text-[8px] font-bold text-black">
                          NAMSHI
                        </span>
                      </div>
                    )}

                    {/* Product info */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      {garment.brand && (
                        <p className="text-[9px] text-gold-400 font-semibold uppercase tracking-wider">
                          {garment.brand}
                        </p>
                      )}
                      <p className="text-[10px] font-semibold text-white leading-tight line-clamp-2">
                        {garment.label}
                      </p>
                      {garment.price ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] font-bold text-gold-400">
                            {garment.price} {garment.currency}
                          </span>
                          {garment.originalPrice &&
                            garment.originalPrice > garment.price && (
                              <span className="text-[8px] text-white/40 line-through">
                                {garment.originalPrice}
                              </span>
                            )}
                        </div>
                      ) : garment.color ? (
                        <p className="text-[9px] text-white/50 mt-0.5 capitalize">
                          {garment.color}
                        </p>
                      ) : null}
                    </div>

                    {/* Selected checkmark */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-gold-400 flex items-center justify-center"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-black"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Current Outfit Item Info */}
      {tryableItems.map((item) =>
        item.category === activeTab ? (
          <div
            key={item.category}
            className="glass rounded-xl px-3 py-2 flex items-center gap-2"
          >
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              Suggested:
            </span>
            <span className="text-xs text-white/70">
              {item.brand} {item.name}
            </span>
          </div>
        ) : null
      )}

      {/* Generate Button */}
      <button
        onClick={() => onGenerate(selections)}
        disabled={!hasSelections || isGenerating}
        className={`w-full rounded-2xl py-4 text-base font-bold transition-all ${
          hasSelections && !isGenerating
            ? "bg-gradient-to-r from-gold-400 to-gold-500 text-black shadow-lg shadow-gold-400/20 active:scale-[0.98]"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        {isGenerating ? "Generating..." : "Try These On"}
      </button>
    </div>
  );
}
