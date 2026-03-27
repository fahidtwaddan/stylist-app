import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { GCC_STORES } from "../lib/constants";
import { COLORS } from "../lib/constants";

export default function BrandStrip() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Curated from top GCC stores</Text>
      <View style={styles.storesRow}>
        {GCC_STORES.map((store, i) => (
          <Animated.View key={store.id} entering={FadeInUp.delay(i * 100)}>
            <Text style={styles.storeName}>{store.name}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    gap: 12,
  },
  label: {
    color: COLORS.white[40],
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  storesRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  storeName: {
    color: COLORS.white[40],
    fontSize: 13,
    fontWeight: "500",
  },
});
