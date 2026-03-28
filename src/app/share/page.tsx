"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ShareCard from "@/components/ShareCard";
import { useStyleStore } from "@/store/useStyleStore";

export default function SharePage() {
  const router = useRouter();
  const { referral, setReferral, profile } = useStyleStore();
  const [copied, setCopied] = useState(false);
  const hasRun = useRef(false);

  const generateReferral = useCallback(async () => {
    if (hasRun.current) return;
    if (referral) return;
    hasRun.current = true;

    try {
      const response = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: `user_${Date.now()}` }),
      });

      if (!response.ok) throw new Error("Failed to generate referral");

      const data = await response.json();
      setReferral(data.referral);
    } catch (error) {
      console.error("Referral error:", error);
    }
  }, [referral, setReferral]);

  useEffect(() => {
    generateReferral();
  }, [generateReferral]);

  const handleCopyLink = async () => {
    if (!referral) return;
    try {
      await navigator.clipboard.writeText(referral.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for mobile
      const input = document.createElement("input");
      input.value = referral.shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen px-5 py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        &larr; Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <h1 className="text-2xl font-bold text-white">Share & Earn</h1>
        <p className="mt-1 text-sm text-white/50">
          {profile
            ? `Your ${profile.archetype} style is ready to share`
            : "Share your style and earn commission"}
        </p>
      </motion.div>

      {referral ? (
        <ShareCard referral={referral} onCopyLink={handleCopyLink} />
      ) : (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl h-24 shimmer" />
          ))}
        </div>
      )}

      {/* Copied Toast */}
      {copied && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-black shadow-lg"
        >
          Link copied!
        </motion.div>
      )}

      {/* Start Over */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 pb-8"
      >
        <button
          onClick={() => {
            useStyleStore.getState().reset();
            router.push("/");
          }}
          className="w-full rounded-2xl border border-white/10 py-3 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          Start a New Style Session
        </button>
      </motion.div>
    </div>
  );
}
