import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const BELT_COLORS: Record<string, { bg: string; text: string }> = {
  "White Belt": { bg: "#F9FAFB", text: "#111827" },
  "Yellow Belt": { bg: "#FEF08A", text: "#713F12" },
  "Orange Belt": { bg: "#FED7AA", text: "#7C2D12" },
  "Green Belt": { bg: "#BBF7D0", text: "#14532D" },
  "Blue Belt": { bg: "#BFDBFE", text: "#1E3A8A" },
  "Purple Belt": { bg: "#E9D5FF", text: "#581C87" },
  "Brown Belt": { bg: "#D6B3A0", text: "#4A1500" },
  "Black Belt": { bg: "#1F2937", text: "#F9FAFB" },
};

interface Props {
  rank: string;
  size?: "sm" | "md";
}

export function BeltBadge({ rank, size = "md" }: Props) {
  const colors = useColors();
  const palette = BELT_COLORS[rank] ?? { bg: colors.border, text: colors.foreground };
  const isSm = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          borderRadius: isSm ? 4 : 6,
          paddingHorizontal: isSm ? 8 : 12,
          paddingVertical: isSm ? 2 : 4,
          borderWidth: rank === "White Belt" ? 1 : 0,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: palette.text, fontSize: isSm ? 11 : 12 },
        ]}
      >
        {rank}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
