import { Text, Pressable, View, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/constants";

interface OccasionCardProps {
  icon: string;
  name: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}

export default function OccasionCard({
  icon,
  name,
  description,
  isSelected,
  onPress,
  index,
}: OccasionCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 80)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          isSelected && styles.selected,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.textContainer}>
          <Text
            style={[styles.name, isSelected && styles.nameSelected]}
          >
            {name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={14} color="#000" />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    gap: 12,
  },
  selected: {
    backgroundColor: "rgba(229,161,60,0.15)",
    borderWidth: 2,
    borderColor: COLORS.gold[400],
  },
  pressed: {
    opacity: 0.9,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  nameSelected: {
    color: COLORS.gold[300],
  },
  description: {
    color: COLORS.white[50],
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gold[400],
    alignItems: "center",
    justifyContent: "center",
  },
});
