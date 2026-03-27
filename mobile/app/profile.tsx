import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import StyleCard from "../src/components/StyleCard";
import GoldButton from "../src/components/GoldButton";
import { useStyleStore } from "../src/store/useStyleStore";
import { COLORS } from "../src/lib/constants";

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useStyleStore((s) => s.profile);

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No style profile found.</Text>
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
        <Pressable onPress={() => router.replace("/")}>
          <Text style={styles.back}>&larr; Start over</Text>
        </Pressable>

        <StyleCard profile={profile} />

        <View style={styles.ctaContainer}>
          <GoldButton
            title="Find My Outfits"
            onPress={() => router.push("/occasions")}
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
  },
  back: {
    color: COLORS.white[40],
    fontSize: 13,
    marginBottom: 20,
  },
  ctaContainer: {
    marginTop: 32,
  },
});
