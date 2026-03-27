"use client";

import { motion } from "framer-motion";
import type { ReferralData } from "@/lib/types";

interface ShareCardProps {
  referral: ReferralData;
  onCopyLink: () => void;
}

export default function ShareCard({ referral, onCopyLink }: ShareCardProps) {
  return (
    <div className="space-y-6">
      {/* Earnings Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 text-center"
      >
        <p className="text-xs uppercase tracking-widest text-white/40">
          Your Earnings
        </p>
        <p className="mt-2 text-4xl font-bold text-gradient">
          {referral.earnings} {referral.currency}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{referral.clicks}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1">
            Clicks
          </p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {referral.conversions}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1">
            Sales
          </p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-gold-400">
            {referral.conversions > 0
              ? Math.round((referral.conversions / referral.clicks) * 100)
              : 0}
            %
          </p>
          <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1">
            Rate
          </p>
        </div>
      </motion.div>

      {/* Referral Code */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-5 space-y-3"
      >
        <p className="text-xs uppercase tracking-widest text-white/40">
          Your Referral Code
        </p>
        <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
          <span className="font-mono text-lg text-gold-400">
            {referral.code}
          </span>
          <button
            onClick={onCopyLink}
            className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-black hover:bg-gold-300 transition-colors"
          >
            Copy Link
          </button>
        </div>
      </motion.div>

      {/* Share Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <p className="text-xs uppercase tracking-widest text-white/40">
          Share Your Style
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-colors">
            <span className="text-2xl">📸</span>
            <p className="text-xs text-white/60 mt-1">Instagram Stories</p>
          </button>
          <button className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-colors">
            <span className="text-2xl">🎵</span>
            <p className="text-xs text-white/60 mt-1">TikTok</p>
          </button>
          <button className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-colors">
            <span className="text-2xl">💬</span>
            <p className="text-xs text-white/60 mt-1">WhatsApp</p>
          </button>
          <button className="glass rounded-2xl p-4 text-center hover:bg-white/10 transition-colors">
            <span className="text-2xl">🐦</span>
            <p className="text-xs text-white/60 mt-1">X / Twitter</p>
          </button>
        </div>
      </motion.div>

      {/* Growth Loop CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 border border-gold-400/30 p-5 text-center"
      >
        <p className="text-lg font-semibold text-white">
          Get Styled. Share. Earn.
        </p>
        <p className="mt-1 text-sm text-white/50">
          Earn commission when your friends shop through your link
        </p>
      </motion.div>
    </div>
  );
}
