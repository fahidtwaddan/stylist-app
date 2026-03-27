import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Image, Pressable, StyleSheet, Linking, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import FitScoreBar from "../../src/components/FitScoreBar";
import GlassCard from "../../src/components/GlassCard";
import GoldButton from "../../src/components/GoldButton";
import { useStyleStore } from "../../src/store/useStyleStore";
import { runTryOn } from "../../src/lib/api";
import { COLORS } from "../../src/lib/constants";

export default function TryOnScreen() {
  const router = useRouter();
  const {
    selectedOutfit: outfit,
    photoUri,
    photoBase64,
    photoMimeType,
    profile,
    tryOnAnalysis,
    isTryOnLoading,
    setTryOnAnalysis,
    setTryOnLoading,
  } = useStyleStore();

  const performTryOn = useCallback(async () => {
    if (!outfit || !photoBase64 || !photoMimeType) return;
    if (tryOnAnalysis) return;

    setTryOnLoading(true);
    try {
      const data = await runTryOn(photoBase64, photoMimeType, outfit, profile);
      setTryOnAnalysis(data.analysis);
    } catch (error) {
      console.error("Try-on error:", error);
    } finally {
      setTryOnLoading(false);
    }
  }, [outfit, photoBase64, photoMimeType, profile, tryOnAnalysis, setTryOnAnalysis, setTryOnLoading]);

  useEffect(() => {
    performTryOn();
  }, [performTryOn]);

  if (!outfit || !photoUri) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No outfit selected.</Text>
          <GoldButton
            title="Back to Outfits"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleShop = (url: string) => {
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>&larr; All Outfits</Text>
        </Pressable>

        {/* Photo with overlay */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          <View style={styles.photoOverlay} />
          <View style={styles.photoInfo}>
            <Text style={styles.outfitName}>{outfit.name}</Text>
            <FitScoreBar score={outfit.fitScore} />
          </View>
        </View>

        {/* AI Try-On Loading */}
        {isTryOnLoading && (
          <Animated.View entering={FadeIn}>
            <GlassCard style={styles.loadingCard}>
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={COLORS.gold[400]} />
                <Text style={styles.loadingText}>
                  AI is analyzing how this looks on you...
                </Text>
              </View>
              <View style={styles.shimmerContainer}>
                <View style={styles.shimmer} />
                <View style={[styles.shimmer, { width: "80%" }]} />
                <View style={[styles.shimmer, { width: "60%" }]} />
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* AI Try-On Verdict */}
        {tryOnAnalysis && (
          <>
            <Animated.View entering={FadeInDown.delay(100)}>
              <View style={styles.verdictCard}>
                <View style={styles.verdictHeader}>
                  <Text style={styles.verdictLabel}>AI Verdict</Text>
                  <Text style={styles.verdictScore}>
                    {tryOnAnalysis.confidenceScore}/100
                  </Text>
                </View>
                <Text style={styles.verdictText}>{tryOnAnalysis.verdict}</Text>
              </View>
            </Animated.View>

            {/* How It Looks On You */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <GlassCard style={styles.analysisCard}>
                <Text style={styles.analysisLabel}>How It Looks On You</Text>
                <Text style={styles.analysisText}>
                  {tryOnAnalysis.overallLook}
                </Text>

                <View style={styles.analysisGrid}>
                  <GlassCard style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Fit</Text>
                    <Text style={styles.gridText}>
                      {tryOnAnalysis.fitAnalysis}
                    </Text>
                  </GlassCard>
                  <GlassCard style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Colors</Text>
                    <Text style={styles.gridText}>
                      {tryOnAnalysis.colorHarmony}
                    </Text>
                  </GlassCard>
                </View>
              </GlassCard>
            </Animated.View>

            {/* Styling Tips */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <GlassCard style={styles.tipsCard}>
                <Text style={styles.tipsLabel}>Styling Tips For You</Text>
                {tryOnAnalysis.stylingTips.map((tip, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeInDown.delay(400 + i * 80)}
                    style={styles.tipRow}
                  >
                    <Text style={styles.tipNumber}>
                      {String(i + 1).padStart(2, "0")}
                    </Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </Animated.View>
                ))}
              </GlassCard>
            </Animated.View>
          </>
        )}

        {/* Editorial Note */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <GlassCard style={styles.editorialCard}>
            <Text style={styles.editorialLabel}>Stylist Note</Text>
            <Text style={styles.editorialText}>
              &ldquo;{outfit.editorialNote}&rdquo;
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Outfit Items */}
        <Text style={styles.sectionLabel}>Outfit Breakdown</Text>
        {outfit.items.map((item, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(200 + i * 100)}>
            <ItemRow item={item} onShop={handleShop} />
          </Animated.View>
        ))}

        {/* Total */}
        <GlassCard style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {outfit.totalPrice} {outfit.currency}
          </Text>
        </GlassCard>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.actions}>
          <GoldButton
            title="Share This Look"
            onPress={() => router.push("/share")}
          />
          <GoldButton
            title="View Other Outfits"
            variant="outline"
            onPress={() => router.back()}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ItemRow({
  item,
  onShop,
}: {
  item: { name: string; brand: string; store: string; price: number; currency: string; imageUrl: string; productUrl: string; category: string };
  onShop: (url: string) => void;
}) {
  const [imgError, setImgError] = useState(false);

  const categoryEmoji =
    item.category === "tops"
      ? "👔"
      : item.category === "bottoms"
      ? "👖"
      : item.category === "shoes"
      ? "👟"
      : item.category === "accessories"
      ? "⌚"
      : "🧥";

  return (
    <GlassCard style={styles.itemCard}>
      {item.imageUrl && !imgError ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.itemImg}
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={styles.itemImgPlaceholder}>
          <Text style={{ fontSize: 22 }}>{categoryEmoji}</Text>
        </View>
      )}
      <View style={styles.itemContent}>
        <Text style={styles.itemCategory}>{item.category}</Text>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          {item.brand} via {item.store}
        </Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemPrice}>
          {item.price} {item.currency}
        </Text>
        <Pressable onPress={() => onShop(item.productUrl)}>
          <Text style={styles.shopLink}>Shop</Text>
        </Pressable>
      </View>
    </GlassCard>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  emptyText: {
    color: COLORS.white[50],
    fontSize: 14,
  },
  back: {
    color: COLORS.white[40],
    fontSize: 13,
    marginBottom: 20,
  },
  photoContainer: {
    aspectRatio: 3 / 4,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  photoInfo: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    gap: 8,
  },
  outfitName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  loadingCard: {
    padding: 20,
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: COLORS.gold[300],
    fontSize: 13,
    fontFamily: "monospace",
  },
  shimmerContainer: {
    marginTop: 12,
    gap: 6,
  },
  shimmer: {
    height: 10,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    width: "100%",
  },
  verdictCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(229,161,60,0.3)",
    backgroundColor: "rgba(229,161,60,0.08)",
  },
  verdictHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  verdictLabel: {
    color: "rgba(229,161,60,0.7)",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  verdictScore: {
    color: COLORS.gold[400],
    fontSize: 22,
    fontWeight: "700",
  },
  verdictText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
  },
  analysisCard: {
    padding: 20,
    marginBottom: 16,
  },
  analysisLabel: {
    color: "rgba(229,161,60,0.7)",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  analysisText: {
    color: COLORS.white[80],
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  analysisGrid: {
    flexDirection: "row",
    gap: 10,
  },
  gridItem: {
    flex: 1,
    padding: 12,
  },
  gridLabel: {
    color: COLORS.white[40],
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  gridText: {
    color: COLORS.white[70],
    fontSize: 12,
    lineHeight: 18,
  },
  tipsCard: {
    padding: 20,
    marginBottom: 16,
  },
  tipsLabel: {
    color: "rgba(229,161,60,0.7)",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  tipNumber: {
    color: COLORS.gold[400],
    fontSize: 12,
    fontFamily: "monospace",
    marginTop: 1,
  },
  tipText: {
    color: COLORS.white[70],
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  editorialCard: {
    padding: 20,
    marginBottom: 20,
  },
  editorialLabel: {
    color: "rgba(229,161,60,0.7)",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  editorialText: {
    color: COLORS.white[60],
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 22,
  },
  sectionLabel: {
    color: COLORS.white[40],
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  itemImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  itemImgPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.white[10],
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemCategory: {
    color: "rgba(229,161,60,0.5)",
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  itemName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 3,
  },
  itemMeta: {
    color: COLORS.white[50],
    fontSize: 12,
    marginTop: 2,
  },
  itemRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 12,
  },
  itemPrice: {
    color: COLORS.gold[400],
    fontSize: 15,
    fontWeight: "700",
  },
  shopLink: {
    color: COLORS.gold[300],
    fontSize: 12,
    marginTop: 4,
    textDecorationLine: "underline",
  },
  totalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginTop: 8,
  },
  totalLabel: {
    color: COLORS.white[60],
    fontSize: 14,
  },
  totalValue: {
    color: COLORS.gold[400],
    fontSize: 22,
    fontWeight: "700",
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
});
