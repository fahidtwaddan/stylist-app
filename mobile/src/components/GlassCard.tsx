import { View, type ViewProps, StyleSheet } from "react-native";
import { COLORS } from "../lib/constants";

interface GlassCardProps extends ViewProps {
  children?: React.ReactNode;
}

export default function GlassCard({
  children,
  style,
  ...props
}: GlassCardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
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
});
