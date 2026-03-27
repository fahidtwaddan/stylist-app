import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../lib/constants";

interface FitScoreBarProps {
  score: number;
}

export default function FitScoreBar({ score }: FitScoreBarProps) {
  const getColor = (s: number) => {
    if (s >= 95) return "#34d399";
    if (s >= 90) return COLORS.gold[400];
    if (s >= 85) return "#fbbf24";
    return "#fb923c";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fit Score</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${score}%`, backgroundColor: getColor(score) },
          ]}
        />
      </View>
      <Text style={styles.score}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    color: COLORS.white[40],
    fontSize: 11,
    width: 56,
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.white[10],
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
  score: {
    color: COLORS.gold[400],
    fontSize: 12,
    fontWeight: "600",
    width: 28,
    textAlign: "right",
  },
});
