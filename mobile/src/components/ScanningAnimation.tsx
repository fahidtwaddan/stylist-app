import { useEffect } from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import { COLORS } from "../lib/constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ScanningAnimationProps {
  photoUri: string;
  progress: number;
  stage: string;
}

export default function ScanningAnimation({
  photoUri,
  progress,
  stage,
}: ScanningAnimationProps) {
  const scanY = useSharedValue(0);
  const dotOpacity1 = useSharedValue(0);
  const dotOpacity2 = useSharedValue(0);
  const dotOpacity3 = useSharedValue(0);

  useEffect(() => {
    scanY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    dotOpacity1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750 }),
        withTiming(0, { duration: 750 })
      ),
      -1
    );
    dotOpacity2.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 750 }),
        withTiming(0, { duration: 750 })
      ),
      -1
    );
    dotOpacity3.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1000 }),
        withTiming(1, { duration: 750 }),
        withTiming(0, { duration: 750 })
      ),
      -1
    );
  }, [scanY, dotOpacity1, dotOpacity2, dotOpacity3]);

  const scanLineStyle = useAnimatedStyle(() => ({
    top: `${scanY.value * 100}%`,
  }));

  const dot1Style = useAnimatedStyle(() => ({ opacity: dotOpacity1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dotOpacity2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dotOpacity3.value }));

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.photo} />
      <View style={styles.overlay} />

      {/* Scan line */}
      <Animated.View style={[styles.scanLine, scanLineStyle]} />

      {/* Corner brackets */}
      <View style={styles.brackets}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      {/* Data points */}
      <Animated.View style={[styles.dataPoint, { top: "25%", left: 24 }, dot1Style]}>
        <View style={styles.dot} />
        <Text style={styles.dataText}>BODY_TYPE</Text>
      </Animated.View>

      <Animated.View style={[styles.dataPoint, { top: "33%", right: 24, flexDirection: "row-reverse" }, dot2Style]}>
        <View style={styles.dot} />
        <Text style={styles.dataText}>COLOR_SEASON</Text>
      </Animated.View>

      <Animated.View style={[styles.dataPoint, { top: "50%", left: 24 }, dot3Style]}>
        <View style={styles.dot} />
        <Text style={styles.dataText}>SKIN_TONE</Text>
      </Animated.View>

      {/* Progress bar */}
      <View style={styles.bottomBar}>
        <View style={styles.progressRow}>
          <Animated.Text entering={FadeIn} style={styles.stageText}>
            {stage}
          </Animated.Text>
          <Text style={styles.percentText}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 3 / 4,
    width: SCREEN_WIDTH - 40,
    maxWidth: 380,
    borderRadius: 24,
    overflow: "hidden",
    alignSelf: "center",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.gold[400],
    shadowColor: COLORS.gold[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  brackets: {
    ...StyleSheet.absoluteFillObject,
    margin: 16,
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: COLORS.gold[400],
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  dataPoint: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold[400],
  },
  dataText: {
    color: COLORS.gold[300],
    fontSize: 10,
    fontFamily: "monospace",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stageText: {
    color: COLORS.gold[300],
    fontSize: 12,
    fontFamily: "monospace",
  },
  percentText: {
    color: COLORS.gold[400],
    fontSize: 12,
    fontFamily: "monospace",
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.white[10],
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: COLORS.gold[400],
  },
});
