"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useStyleStore } from "@/store/useStyleStore";

const MEN_BODY_TYPES = [
  { id: "rectangle", label: "Rectangle", desc: "Balanced, straight build", image: "/body-shapes/men/Rectangle.png" },
  { id: "triangle", label: "Triangle", desc: "Wider hips, narrower shoulders", image: "/body-shapes/men/Triangle.png" },
  { id: "trapezoid", label: "Trapezoid", desc: "Broad shoulders, narrow waist", image: "/body-shapes/men/Trapezoid.png" },
  { id: "oval", label: "Oval", desc: "Fuller midsection", image: "/body-shapes/men/Oval.png" },
  { id: "inverted-triangle", label: "Inverted Triangle", desc: "Wide shoulders, slim hips", image: "/body-shapes/men/Inverted%20Triangle.png" },
];

const WOMEN_BODY_TYPES = [
  { id: "rectangle", label: "Rectangle", desc: "Balanced proportions", image: "/body-shapes/women/Rectangle.png" },
  { id: "pear", label: "Pear / Triangle", desc: "Wider hips than shoulders", image: "/body-shapes/women/Pear%20Triangle.png" },
  { id: "hourglass", label: "Hourglass", desc: "Balanced bust & hips, narrow waist", image: "/body-shapes/women/Hourglass.png" },
  { id: "inverted-triangle", label: "Inverted Triangle", desc: "Broader shoulders", image: "/body-shapes/women/Inverted%20Triangle.png" },
  { id: "diamond", label: "Diamond", desc: "Fuller midsection", image: "/body-shapes/women/Diamond.png" },
  { id: "round-apple", label: "Round / Apple", desc: "Fuller torso, slim legs", image: "/body-shapes/women/Round%20Apple.png" },
];

export default function BodyTypePage() {
  const router = useRouter();
  const { gender, setProfile, setBodyShapeImage, height, weight, setHeight, setWeight } = useStyleStore();

  useEffect(() => {
    if (!gender) router.push("/");
  }, [gender, router]);

  if (!gender) return null;

  const bodyTypes = gender === "men" ? MEN_BODY_TYPES : WOMEN_BODY_TYPES;
  const imgSrc = gender === "men" ? "/men.png" : "/women.png";

  const handleSelect = (bodyType: string) => {
    const selected = bodyTypes.find((bt) => bt.id === bodyType);
    if (selected) setBodyShapeImage(selected.image);
    setProfile({
      gender,
      bodyType,
      skinTone: "Not analyzed",
      colorSeason: "Not analyzed",
      archetype: "Not analyzed",
      personality: "Selected body type manually",
      narrative: "Body type was chosen manually without photo analysis.",
      colorPalette: [],
      avoidColors: [],
      recommendations: [],
    });
    router.push("/profile");
  };

  return (
    <div className="min-h-screen px-5 py-8">
      <button
        onClick={() => router.push("/?mode=body-type")}
        className="mb-4 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        &larr; Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-2xl font-bold text-white">
          Select Your Body Type
        </h1>
        <p className="mt-1 text-sm text-white/50">
          {gender === "men" ? "Men's" : "Women's"} body types
        </p>
      </motion.div>

      {/* Height & Weight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 mb-5"
      >
        <div>
          <label className="text-xs text-white/40 mb-1 block">Height (cm) <span className="text-red-400">*</span></label>
          <input
            type="number"
            placeholder="170"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-gold-400/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Weight (kg) <span className="text-red-400">*</span></label>
          <input
            type="number"
            placeholder="70"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-gold-400/50 focus:outline-none"
          />
        </div>
      </motion.div>

      {/* Reference Image */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 rounded-2xl overflow-hidden border border-white/10"
      >
        <img
          src={imgSrc}
          alt={`${gender} body types reference`}
          className="w-full object-contain"
        />
      </motion.div>

      {/* Required notice */}
      {(!height || !weight) && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-red-400/70 text-center mb-4"
        >
          Please enter your height and weight to continue
        </motion.p>
      )}

      {/* Body Type Grid */}
      <div className={`grid grid-cols-2 gap-3 pb-8 ${!height || !weight ? "opacity-40 pointer-events-none" : ""}`}>
        {bodyTypes.map((bt, i) => (
          <motion.button
            key={bt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(bt.id)}
            className="glass rounded-2xl p-4 text-left hover:border-gold-400/50 border border-transparent transition-all"
          >
            <p className="text-sm font-semibold text-white">{bt.label}</p>
            <p className="text-xs text-white/40 mt-1">{bt.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
