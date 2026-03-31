"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStyleStore } from "@/store/useStyleStore";

const UPLOAD_RULES = [
  "Full-body photo required (head to toe visible)",
  "Stand straight, facing the camera",
  "Well-lit — no dark/blurry photos",
  "Wear fitted clothing (so AI can read your body shape)",
  "Plain background preferred",
  "No group photos — solo only",
  "Must be appropriately dressed",
];

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-6 w-6 rounded-full bg-gold-400 animate-pulse" /></div>}>
      <LandingContent />
    </Suspense>
  );
}

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setPhoto = useStyleStore((s) => s.setPhoto);
  const setGender = useStyleStore((s) => s.setGender);
  const height = useStyleStore((s) => s.height);
  const weight = useStyleStore((s) => s.weight);
  const setHeight = useStyleStore((s) => s.setHeight);
  const setWeight = useStyleStore((s) => s.setWeight);
  const initialMode = searchParams.get("mode") === "body-type" ? "body-type" as const : null;
  const [mode, setMode] = useState<"body-type" | null>(initialMode);
  const [showGuardrails, setShowGuardrails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhoto(result, file);
      router.push("/analyzing");
    };
    reader.readAsDataURL(file);
  };

  const handleBodyType = (gender: "men" | "women") => {
    setGender(gender);
    router.push("/body-type");
  };

  return (
    <div className="flex min-h-screen flex-col px-5 py-8">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

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

      {/* Two Options */}
      {!mode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Option 1: Upload Photo */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowGuardrails(true)}
            className="w-full rounded-3xl border-2 border-white/20 hover:border-gold-400/50 transition-all p-8 text-center"
          >
            <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-gold-400/20 to-gold-600/20 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-white">Upload Your Photo</p>
            <p className="mt-1 text-sm text-white/50">AI detects your body type automatically</p>
          </motion.button>

          {/* Option 2: Select Body Type */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode("body-type")}
            className="w-full rounded-3xl border-2 border-white/20 hover:border-gold-400/50 transition-all p-8 text-center"
          >
            <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-gold-400/20 to-gold-600/20 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-white">Select Body Type</p>
            <p className="mt-1 text-sm text-white/50">Choose your gender and body type manually</p>
          </motion.button>
        </motion.div>
      )}

      {/* Body Type: Gender Selection */}
      <AnimatePresence mode="wait">
        {mode === "body-type" && (
          <motion.div
            key="body-type"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <button
              onClick={() => setMode(null)}
              className="mb-4 text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              &larr; Back
            </button>
            <p className="text-center text-lg font-semibold text-white mb-6">
              Select Your Gender
            </p>
            <div className="grid grid-cols-2 gap-4">
              {/* Men */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleBodyType("men")}
                className="rounded-3xl border-2 border-white/20 hover:border-gold-400/50 transition-all p-6 flex flex-col items-center gap-4"
              >
                <svg className="w-24 h-32 text-gold-400" viewBox="0 0 80 120" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="40" cy="16" r="10" />
                  <line x1="40" y1="26" x2="40" y2="70" />
                  <line x1="40" y1="36" x2="20" y2="55" />
                  <line x1="40" y1="36" x2="60" y2="55" />
                  <line x1="40" y1="70" x2="24" y2="110" />
                  <line x1="40" y1="70" x2="56" y2="110" />
                  <rect x="28" y="28" width="24" height="30" rx="3" strokeDasharray="4 2" opacity="0.3" />
                </svg>
                <p className="text-lg font-bold text-white">Men</p>
              </motion.button>

              {/* Women */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleBodyType("women")}
                className="rounded-3xl border-2 border-white/20 hover:border-gold-400/50 transition-all p-6 flex flex-col items-center gap-4"
              >
                <svg className="w-24 h-32 text-gold-400" viewBox="0 0 80 120" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="40" cy="16" r="10" />
                  <path d="M40 26 L40 70" />
                  <line x1="40" y1="36" x2="22" y2="52" />
                  <line x1="40" y1="36" x2="58" y2="52" />
                  <line x1="40" y1="70" x2="22" y2="110" />
                  <line x1="40" y1="70" x2="58" y2="110" />
                  <path d="M26 32 Q40 65 54 32" strokeDasharray="4 2" opacity="0.3" />
                  <ellipse cx="40" cy="50" rx="16" ry="8" strokeDasharray="4 2" opacity="0.3" />
                </svg>
                <p className="text-lg font-bold text-white">Women</p>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Upload Guardrails Dialog */}
      <AnimatePresence>
        {showGuardrails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowGuardrails(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-[#1a1a2e] border-t border-white/10 px-6 pt-6 pb-8"
            >
              {/* Handle bar */}
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

              <h2 className="text-lg font-bold text-white mb-1">
                Photo Guidelines
              </h2>
              <p className="text-sm text-white/40 mb-5">
                For the best AI analysis, please ensure:
              </p>

              <div className="space-y-3 mb-6">
                {UPLOAD_RULES.map((rule, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-gold-400/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-gold-400">{i + 1}</span>
                    </div>
                    <p className="text-sm text-white/70">{rule}</p>
                  </div>
                ))}
              </div>

              {/* Height & Weight */}
              <div className="grid grid-cols-2 gap-3 mb-6">
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
              </div>

              <button
                onClick={() => {
                  setShowGuardrails(false);
                  fileInputRef.current?.click();
                }}
                disabled={!height || !weight}
                className={`w-full rounded-2xl py-4 text-base font-bold transition-transform ${
                  height && weight
                    ? "bg-gradient-to-r from-gold-400 to-gold-500 text-black shadow-lg shadow-gold-400/20 active:scale-[0.98]"
                    : "bg-white/10 text-white/30 cursor-not-allowed"
                }`}
              >
                Continue & Upload Photo
              </button>

              <button
                onClick={() => setShowGuardrails(false)}
                className="w-full mt-3 rounded-2xl border border-white/10 py-3 text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-auto pt-6 space-y-3"
      >
        <p className="text-center text-xs uppercase tracking-widest text-white/30">
          How it works
        </p>
        <div className="flex items-center gap-3">
          {[
            { step: "01", text: "Upload photo / Choose your body type" },
            { step: "02", text: "Select your occasion" },
            { step: "03", text: "AI will matching clothes" },
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
