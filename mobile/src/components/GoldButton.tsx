import { Pressable, Text, StyleSheet, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../lib/constants";

interface GoldButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "filled" | "outline";
  style?: ViewStyle;
}

export default function GoldButton({
  title,
  onPress,
  disabled = false,
  variant = "filled",
  style,
}: GoldButtonProps) {
  if (variant === "outline") {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.outline,
          pressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
      >
        <Text style={styles.outlineText}>{title}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={[COLORS.gold[400], COLORS.gold[500]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={styles.filledText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  filledText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },
  outline: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(229,161,60,0.3)",
    paddingVertical: 14,
    alignItems: "center",
  },
  outlineText: {
    color: COLORS.gold[400],
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
