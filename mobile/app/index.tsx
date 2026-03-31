import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import PhotoUpload from "../src/components/PhotoUpload";
import BrandStrip from "../src/components/BrandStrip";
import GlassCard from "../src/components/GlassCard";
import { useStyleStore } from "../src/store/useStyleStore";
import { COLORS } from "../src/lib/constants";

const STEPS = [
  { step: "01", text: "Upload photo" },
  { step: "02", text: "AI analyzes" },
  { step: "03", text: "Get outfits" },
];

export default function LandingScreen() {
  const router = useRouter();
  const setPhoto = useStyleStore((s) => s.setPhoto);

  const handlePhotoSelected = (uri: string, mimeType: string) => {
    setPhoto(uri, mimeType);
    router.push("/analyzing");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
          <Text style={styles.title}>AI Stylist</Text>
          <Text style={styles.subtitle}>
            Discover your style DNA in seconds
          </Text>
        </Animated.View>

        {/* Photo Upload */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <PhotoUpload
            photoUri={null}
            onPhotoSelected={handlePhotoSelected}
          />
        </Animated.View>

        {/* Brand Strip */}
        <BrandStrip />

        {/* How it works */}
        <Animated.View entering={FadeIn.delay(600)} style={styles.stepsSection}>
          <Text style={styles.stepsLabel}>How it works</Text>
          <View style={styles.stepsRow}>
            {STEPS.map((item, i) => (
              <View key={i} style={styles.step}>
                <Text style={styles.stepNumber}>{item.step}</Text>
                <Text style={styles.stepText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.gold[400],
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white[50],
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.gold[400],
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: COLORS.white[40],
    marginTop: 4,
  },
  stepsSection: {
    marginTop: "auto",
    gap: 10,
  },
  stepsLabel: {
    color: COLORS.white[40],
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  stepsRow: {
    flexDirection: "row",
    gap: 10,
  },
  step: {
    flex: 1,
    alignItems: "center",
  },
  stepNumber: {
    color: "rgba(229,161,60,0.5)",
    fontSize: 11,
    fontFamily: "monospace",
  },
  stepText: {
    color: COLORS.white[40],
    fontSize: 11,
    marginTop: 2,
  },
});
