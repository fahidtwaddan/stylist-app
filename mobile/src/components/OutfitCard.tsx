import { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import FitScoreBar from "./FitScoreBar";
import { COLORS } from "../lib/constants";
import type { Outfit } from "../lib/types";

interface OutfitCardProps {
  outfit: Outfit;
  onPress: () => void;
  index: number;
}

export default function OutfitCard({ outfit, onPress, index }: OutfitCardProps) {
  const storeSet = new Set<string>();
  outfit.items.forEach((item) => storeSet.add(item.store));
  const uniqueStores = Array.from(storeSet);

  return (
    <Animated.View entering={FadeInDown.delay(index * 100)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={[COLORS.gold[400], COLORS.gold[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentBar}
        />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.row}>
            <View style={styles.titleContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {outfit.name}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {outfit.description}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{outfit.totalPrice}</Text>
              <Text style={styles.currency}>{outfit.currency}</Text>
            </View>
          </View>

          {/* Items preview with images */}
          <View style={styles.itemsRow}>
            {outfit.items.map((item, i) => (
              <ItemThumb key={i} item={item} />
            ))}
          </View>

          {/* Fit Score */}
          <FitScoreBar score={outfit.fitScore} />

          {/* Store badges */}
          <View style={styles.storesRow}>
            {uniqueStores.map((store) => (
              <View key={store} style={styles.storeBadge}>
                <Text style={styles.storeText}>{store}</Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ItemThumb({ item }: { item: Outfit["items"][0] }) {
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

  if (item.imageUrl && !imgError) {
    return (
      <View style={styles.itemThumb}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.itemImage}
          onError={() => setImgError(true)}
        />
        <View style={styles.itemImageLabel}>
          <Text style={styles.itemImageBrand} numberOfLines={1}>
            {item.brand}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.itemChip}>
      <View style={styles.itemPlaceholder}>
        <Text style={styles.itemEmoji}>{categoryEmoji}</Text>
      </View>
      <Text style={styles.itemCategory}>{item.category}</Text>
      <Text style={styles.itemBrand} numberOfLines={1}>
        {item.brand}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 20,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  accentBar: {
    height: 3,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  description: {
    color: COLORS.white[50],
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    color: COLORS.gold[400],
    fontSize: 20,
    fontWeight: "700",
  },
  currency: {
    color: COLORS.white[40],
    fontSize: 11,
  },
  itemsRow: {
    flexDirection: "row",
    gap: 6,
  },
  itemThumb: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: COLORS.white[10],
  },
  itemImage: {
    width: "100%",
    aspectRatio: 1,
  },
  itemImageLabel: {
    paddingHorizontal: 4,
    paddingVertical: 3,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  itemImageBrand: {
    color: COLORS.white[80],
    fontSize: 9,
    textAlign: "center",
  },
  itemChip: {
    flex: 1,
    backgroundColor: COLORS.white[10],
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
  },
  itemPlaceholder: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 6,
    backgroundColor: COLORS.white[10],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  itemEmoji: {
    fontSize: 20,
  },
  itemCategory: {
    color: COLORS.white[60],
    fontSize: 9,
    textTransform: "uppercase",
  },
  itemBrand: {
    color: COLORS.white[80],
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  storesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  storeBadge: {
    backgroundColor: COLORS.white[10],
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  storeText: {
    color: COLORS.white[60],
    fontSize: 10,
  },
});
