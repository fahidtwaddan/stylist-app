"use client";

import { motion } from "framer-motion";
import { GCC_STORES } from "@/lib/stores";

export default function BrandStrip() {
  return (
    <div className="py-6 space-y-3">
      <p className="text-center text-xs uppercase tracking-widest text-white/30">
        Curated from top GCC stores
      </p>
      <div className="flex items-center justify-center gap-6 overflow-hidden">
        {GCC_STORES.map((store, i) => (
          <motion.div
            key={store.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="flex-shrink-0"
          >
            <span className="text-sm font-medium text-white/30 hover:text-white/60 transition-colors">
              {store.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
