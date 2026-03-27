import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import OccasionCard from "../src/components/OccasionCard";
import GoldButton from "../src/components/GoldButton";
import { useStyleStore } from "../src/store/useStyleStore";
import { OCCASIONS, COLORS } from "../src/lib/constants";

export default function OccasionsScreen() {
  const router = useRouter();
  const { selectedOccasion, setSelectedOccasion, profile } = useStyleStore();

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            Please complete your style analysis first.
          </Text>
          <GoldButton title="Start Over" onPress={() => router.replace("/")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>&larr; Style Profile</Text>
        </Pressable>

        <Animated.View entering={FadeInDown}>
          <Text style={styles.title}>Pick Your Occasion</Text>
          <Text style={styles.subtitle}>
            Where are you headed, {profile.archetype}?
          </Text>
        </Animated.View>

        <View style={styles.list}>
          {OCCASIONS.map((occasion, i) => (
            <OccasionCard
              key={occasion.id}
              icon={occasion.icon}
              name={occasion.name}
              description={occasion.description}
              isSelected={selectedOccasion === occasion.id}
              onPress={() => setSelectedOccasion(occasion.id)}
              index={i}
            />
          ))}
        </View>

        <View style={styles.ctaContainer}>
          <GoldButton
            title="Get My Outfits"
            onPress={() => router.push("/outfits")}
            disabled={!selectedOccasion}
          />
        </View>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  emptyText: {
    color: COLORS.white[50],
    fontSize: 14,
    textAlign: "center",
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
    gap: 10,
  },
  ctaContainer: {
    marginTop: 32,
  },
});
