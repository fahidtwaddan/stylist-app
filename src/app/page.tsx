"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PhotoUpload from "@/components/PhotoUpload";
import BrandStrip from "@/components/BrandStrip";
import { useStyleStore } from "@/store/useStyleStore";

export default function LandingPage() {
  const router = useRouter();
  const setPhoto = useStyleStore((s) => s.setPhoto);

  const handlePhotoSelected = (file: File, preview: string) => {
    setPhoto(preview, file);
    router.push("/analyzing");
  };

  return (
    <div className="flex min-h-screen flex-col px-5 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-gradient">AI Stylist</h1>
        <p className="mt-2 text-sm text-white/50">
          Discover your style DNA in seconds
        </p>
      </motion.div>

      {/* Photo Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <PhotoUpload onPhotoSelected={handlePhotoSelected} />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 grid grid-cols-3 gap-3"
      >
        {[
          { value: "50K+", label: "Styles Created" },
          { value: "6", label: "GCC Stores" },
          { value: "98%", label: "Match Rate" },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-gold-400">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-white/40">
              {stat.label}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Brand Strip */}
      <div className="mt-auto pt-6">
        <BrandStrip />
      </div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 space-y-3"
      >
        <p className="text-center text-xs uppercase tracking-widest text-white/30">
          How it works
        </p>
        <div className="flex items-center gap-3">
          {[
            { step: "01", text: "Upload photo" },
            { step: "02", text: "AI analyzes" },
            { step: "03", text: "Get outfits" },
          ].map((item, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-xs font-mono text-gold-400/60">
                {item.step}
              </span>
              <p className="text-xs text-white/40 mt-0.5">{item.text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
