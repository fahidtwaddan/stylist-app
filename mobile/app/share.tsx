import { useEffect, useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Share } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";
import GlassCard from "../src/components/GlassCard";
import GoldButton from "../src/components/GoldButton";
import { useStyleStore } from "../src/store/useStyleStore";
import { createReferral } from "../src/lib/api";
import { COLORS } from "../src/lib/constants";

const SHARE_OPTIONS = [
  { icon: "📸", label: "Instagram Stories" },
  { icon: "🎵", label: "TikTok" },
  { icon: "💬", label: "WhatsApp" },
  { icon: "🐦", label: "X / Twitter" },
];

export default function ShareScreen() {
  const router = useRouter();
  const { referral, setReferral, profile, reset } = useStyleStore();
  const [copied, setCopied] = useState(false);

  const loadReferral = useCallback(async () => {
    if (referral) return;
    try {
      const data = await createReferral(`user_${Date.now()}`);
      setReferral(data.referral);
    } catch (error) {
      console.error("Referral error:", error);
    }
  }, [referral, setReferral]);

  useEffect(() => {
    loadReferral();
  }, [loadReferral]);

  const handleCopyLink = async () => {
    if (!referral) return;
    await Clipboard.setStringAsync(referral.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!referral) return;
    await Share.share({
      message: `Check out my style profile on AI Stylist! ${referral.shareUrl}`,
    });
  };

  const conversionRate =
    referral && referral.clicks > 0
      ? Math.round((referral.conversions / referral.clicks) * 100)
      : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>&larr; Back</Text>
        </Pressable>

        <Animated.View entering={FadeInDown} style={styles.headerSection}>
          <Text style={styles.title}>Share & Earn</Text>
          <Text style={styles.subtitle}>
            {profile
              ? `Your ${profile.archetype} style is ready to share`
              : "Share your style and earn commission"}
          </Text>
        </Animated.View>

        {referral ? (
          <>
            {/* Earnings */}
            <Animated.View entering={FadeInDown.delay(100)}>
              <GlassCard style={styles.earningsCard}>
                <Text style={styles.earningsLabel}>Your Earnings</Text>
                <Text style={styles.earningsValue}>
                  {referral.earnings} {referral.currency}
                </Text>
              </GlassCard>
            </Animated.View>

            {/* Stats */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.statsRow}>
              <GlassCard style={styles.statCard}>
                <Text style={styles.statValue}>{referral.clicks}</Text>
                <Text style={styles.statLabel}>Clicks</Text>
              </GlassCard>
              <GlassCard style={styles.statCard}>
                <Text style={styles.statValue}>{referral.conversions}</Text>
                <Text style={styles.statLabel}>Sales</Text>
              </GlassCard>
              <GlassCard style={styles.statCard}>
                <Text style={[styles.statValue, { color: COLORS.gold[400] }]}>
                  {conversionRate}%
                </Text>
                <Text style={styles.statLabel}>Rate</Text>
              </GlassCard>
            </Animated.View>

            {/* Referral Code */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <GlassCard style={styles.referralCard}>
                <Text style={styles.referralLabel}>Your Referral Code</Text>
                <View style={styles.codeRow}>
                  <Text style={styles.code}>{referral.code}</Text>
                  <Pressable onPress={handleCopyLink} style={styles.copyBtn}>
                    <Text style={styles.copyBtnText}>
                      {copied ? "Copied!" : "Copy Link"}
                    </Text>
                  </Pressable>
                </View>
              </GlassCard>
            </Animated.View>

            {/* Share options */}
            <Animated.View entering={FadeInDown.delay(400)}>
              <Text style={styles.sectionLabel}>Share Your Style</Text>
              <View style={styles.shareGrid}>
                {SHARE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={handleNativeShare}
                    style={styles.shareOption}
                  >
                    <GlassCard style={styles.shareOptionInner}>
                      <Text style={styles.shareIcon}>{opt.icon}</Text>
                      <Text style={styles.shareLabel}>{opt.label}</Text>
                    </GlassCard>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Growth loop CTA */}
            <Animated.View entering={FadeIn.delay(500)}>
              <View style={styles.ctaBanner}>
                <Text style={styles.ctaTitle}>
                  Get Styled. Share. Earn.
                </Text>
                <Text style={styles.ctaSubtitle}>
                  Earn commission when your friends shop through your link
                </Text>
              </View>
            </Animated.View>
          </>
        ) : (
          <View style={styles.loadingList}>
            {[0, 1, 2].map((i) => (
              <GlassCard key={i} style={styles.skeleton} />
            ))}
          </View>
        )}

        {/* Start over */}
        <View style={styles.startOver}>
          <GoldButton
            title="Start a New Style Session"
            variant="outline"
            onPress={() => {
              reset();
              router.replace("/");
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  back: {
    color: COLORS.white[40],
    fontSize: 13,
    marginBottom: 20,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: COLORS.white[50],
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  earningsCard: {
    padding: 24,
    alignItems: "center",
    marginBottom: 14,
  },
  earningsLabel: {
    color: COLORS.white[40],
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  earningsValue: {
    color: COLORS.gold[400],
    fontSize: 36,
    fontWeight: "700",
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  statLabel: {
    color: COLORS.white[40],
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 4,
  },
  referralCard: {
    padding: 20,
    gap: 12,
    marginBottom: 20,
  },
  referralLabel: {
    color: COLORS.white[40],
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white[10],
    borderRadius: 14,
    padding: 12,
  },
  code: {
    color: COLORS.gold[400],
    fontSize: 18,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  copyBtn: {
    backgroundColor: COLORS.gold[400],
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  copyBtnText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionLabel: {
    color: COLORS.white[40],
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  shareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  shareOption: {
    width: "48%",
  },
  shareOptionInner: {
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  shareIcon: {
    fontSize: 24,
  },
  shareLabel: {
    color: COLORS.white[60],
    fontSize: 11,
  },
  ctaBanner: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(229,161,60,0.3)",
    backgroundColor: "rgba(229,161,60,0.1)",
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  ctaTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  ctaSubtitle: {
    color: COLORS.white[50],
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  loadingList: {
    gap: 14,
  },
  skeleton: {
    height: 80,
  },
  startOver: {
    marginTop: 12,
  },
});
