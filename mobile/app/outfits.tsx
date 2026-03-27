import { useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import OutfitCard from "../src/components/OutfitCard";
import GoldButton from "../src/components/GoldButton";
import GlassCard from "../src/components/GlassCard";
import { useStyleStore } from "../src/store/useStyleStore";
import { generateOutfits } from "../src/lib/api";
import { OCCASIONS, COLORS } from "../src/lib/constants";

export default function OutfitsScreen() {
  const router = useRouter();
  const {
    profile,
    selectedOccasion,
    outfits,
    isLoadingOutfits,
    setOutfits,
    setSelectedOutfit,
    setLoadingOutfits,
  } = useStyleStore();

  const loadOutfits = useCallback(async () => {
    if (!profile || !selectedOccasion) return;
    if (outfits.length > 0) return;

    setLoadingOutfits(true);
    try {
      const occasion = OCCASIONS.find((o) => o.id === selectedOccasion);
      const data = await generateOutfits(
        profile,
        occasion?.name || selectedOccasion
      );
      setOutfits(data.outfits);
    } catch (error) {
      console.error("Outfit loading error:", error);
    } finally {
      setLoadingOutfits(false);
    }
  }, [profile, selectedOccasion, outfits.length, setOutfits, setLoadingOutfits]);

  useEffect(() => {
    if (!profile || !selectedOccasion) {
      router.replace("/");
      return;
    }
    loadOutfits();
  }, [profile, selectedOccasion, router, loadOutfits]);

  if (!profile || !selectedOccasion) return null;

  const occasionName =
    OCCASIONS.find((o) => o.id === selectedOccasion)?.name || selectedOccasion;

  const handleOutfitPress = (outfit: (typeof outfits)[0]) => {
    setSelectedOutfit(outfit);
    router.push(`/try-on/${outfit.id}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>&larr; Occasions</Text>
        </Pressable>

        <Animated.View entering={FadeInDown}>
          <Text style={styles.title}>Your Outfits</Text>
          <Text style={styles.subtitle}>
            6 curated looks for {occasionName}
          </Text>
        </Animated.View>

        {isLoadingOutfits ? (
          <View style={styles.loadingList}>
            {[0, 1, 2].map((i) => (
              <GlassCard key={i} style={styles.skeleton} />
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {outfits.map((outfit, i) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                onPress={() => handleOutfitPress(outfit)}
                index={i}
              />
            ))}
          </View>
        )}

        {outfits.length > 0 && (
          <Animated.View entering={FadeIn.delay(800)} style={styles.shareCta}>
            <GoldButton
              title="Share & Earn Commission"
              variant="outline"
              onPress={() => router.push("/share")}
            />
          </Animated.View>
        )}
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
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: COLORS.white[50],
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  list: {
    gap: 14,
  },
  loadingList: {
    gap: 14,
  },
  skeleton: {
    height: 180,
  },
  shareCta: {
    marginTop: 32,
  },
});
