import { useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { readAsStringAsync } from "expo-file-system";
import ScanningAnimation from "../src/components/ScanningAnimation";
import { useStyleStore } from "../src/store/useStyleStore";
import { analyzePhoto } from "../src/lib/api";
import { COLORS } from "../src/lib/constants";

const ANALYSIS_STAGES = [
  "Detecting body proportions...",
  "Analyzing skin tone...",
  "Mapping color season...",
  "Decoding style personality...",
  "Crafting your archetype...",
  "Generating recommendations...",
  "Finalizing your style DNA...",
];

export default function AnalyzingScreen() {
  const router = useRouter();
  const hasStarted = useRef(false);
  const {
    photoUri,
    photoMimeType,
    analysisProgress,
    analysisStage,
    setAnalysisProgress,
    setProfile,
    setAnalyzing,
    setPhotoBase64,
  } = useStyleStore();

  const runAnalysis = useCallback(async () => {
    if (!photoUri || !photoMimeType) {
      router.replace("/");
      return;
    }

    setAnalyzing(true);

    let progress = 0;
    const interval = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 8 + 2;
        if (progress > 90) progress = 90;
        const stageIndex = Math.min(
          Math.floor((progress / 100) * ANALYSIS_STAGES.length),
          ANALYSIS_STAGES.length - 1
        );
        setAnalysisProgress(progress, ANALYSIS_STAGES[stageIndex]);
      }
    }, 400);

    try {
      // Save base64 for later try-on API
      const base64 = await readAsStringAsync(photoUri, {
        encoding: "base64",
      });
      setPhotoBase64(base64);

      const data = await analyzePhoto(photoUri, photoMimeType);
      clearInterval(interval);
      setAnalysisProgress(100, "Complete!");
      setProfile(data.profile);

      setTimeout(() => {
        setAnalyzing(false);
        router.replace("/profile");
      }, 800);
    } catch (error) {
      clearInterval(interval);
      console.error("Analysis error:", error);
      setAnalyzing(false);
      setAnalysisProgress(0, "Error — tap to retry");
    }
  }, [photoUri, photoMimeType, router, setAnalyzing, setAnalysisProgress, setProfile, setPhotoBase64]);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      runAnalysis();
    }
  }, [runAnalysis]);

  if (!photoUri) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScanningAnimation
          photoUri={photoUri}
          progress={analysisProgress}
          stage={analysisStage}
        />

        <Animated.Text entering={FadeIn.delay(1000)} style={styles.hint}>
          Our AI is reading your unique style DNA...
        </Animated.Text>

        {analysisStage === "Error — tap to retry" && (
          <Pressable onPress={runAnalysis} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry Analysis</Text>
          </Pressable>
        )}
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  hint: {
    color: COLORS.white[40],
    fontSize: 13,
    marginTop: 32,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.gold[400],
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  retryText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
});
