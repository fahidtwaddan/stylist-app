import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import GlassCard from "./GlassCard";
import { COLORS } from "../lib/constants";
import type { StyleProfile } from "../lib/types";

interface StyleCardProps {
  profile: StyleProfile;
}

export default function StyleCard({ profile }: StyleCardProps) {
  return (
    <View style={styles.container}>
      {/* Archetype Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <Text style={styles.label}>Your Style Archetype</Text>
        <Text style={styles.archetype}>{profile.archetype}</Text>
        <Text style={styles.personality}>{profile.personality}</Text>
      </Animated.View>

      {/* Narrative */}
      <Animated.View entering={FadeInDown.delay(200)}>
        <GlassCard style={styles.narrativeCard}>
          <Text style={styles.narrative}>
            &ldquo;{profile.narrative}&rdquo;
          </Text>
        </GlassCard>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.statsGrid}>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statLabel}>Body Type</Text>
          <Text style={styles.statValue}>{profile.bodyType}</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statLabel}>Skin Tone</Text>
          <Text style={styles.statValue}>{profile.skinTone}</Text>
        </GlassCard>
        <GlassCard style={[styles.statCard, { flex: 2 }]}>
          <Text style={styles.statLabel}>Color Season</Text>
          <Text style={styles.statValue}>{profile.colorSeason}</Text>
        </GlassCard>
      </Animated.View>

      {/* Color Palette */}
      <Animated.View entering={FadeInDown.delay(400)}>
        <Text style={styles.sectionLabel}>Your Color Palette</Text>
        <View style={styles.paletteRow}>
          {profile.colorPalette.map((color) => (
            <View
              key={color}
              style={[styles.swatch, { backgroundColor: color }]}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
          Colors to Avoid
        </Text>
        <View style={styles.paletteRow}>
          {profile.avoidColors.map((color) => (
            <View key={color} style={styles.avoidSwatch}>
              <View
                style={[styles.avoidSwatchBg, { backgroundColor: color }]}
              />
              <View style={styles.avoidLine} />
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Recommendations */}
      <Animated.View entering={FadeInDown.delay(500)}>
        <Text style={styles.sectionLabel}>Style Recommendations</Text>
        {profile.recommendations.map((rec, i) => (
          <GlassCard key={i} style={styles.recCard}>
            <Text style={styles.recNumber}>
              {String(i + 1).padStart(2, "0")}
            </Text>
            <Text style={styles.recText}>{rec}</Text>
          </GlassCard>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  header: {
    alignItems: "center",
  },
  label: {
    color: "rgba(229,161,60,0.7)",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  archetype: {
    color: COLORS.gold[400],
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  personality: {
    color: COLORS.white[60],
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  narrativeCard: {
    padding: 20,
  },
  narrative: {
    color: COLORS.white[60],
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
  },
  statLabel: {
    color: COLORS.white[40],
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  statValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  sectionLabel: {
    color: COLORS.white[40],
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  paletteRow: {
    flexDirection: "row",
    gap: 8,
  },
  swatch: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
  },
  avoidSwatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  avoidSwatchBg: {
    ...StyleSheet.absoluteFillObject,
  },
  avoidLine: {
    position: "absolute",
    top: "50%",
    left: 2,
    right: 2,
    height: 2,
    backgroundColor: COLORS.white[80],
    borderRadius: 1,
    transform: [{ rotate: "45deg" }],
  },
  recCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  recNumber: {
    color: COLORS.gold[400],
    fontSize: 13,
    marginTop: 1,
  },
  recText: {
    color: COLORS.white[60],
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
});
