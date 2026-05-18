import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MembershipStatus } from "@/types";

const STATUS_CONFIG: Record<MembershipStatus, { bg: string; text: string; label: string }> = {
  active_member: { bg: "#D1FAE5", text: "#065F46", label: "Active Member" },
  active_nonmember: { bg: "#FEF3C7", text: "#92400E", label: "Active (Non-Member)" },
  inactive: { bg: "#F3F4F6", text: "#6B7280", label: "Inactive" },
};

interface Props {
  status: MembershipStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: Props) {
  const config = STATUS_CONFIG[status];
  const isSm = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderRadius: isSm ? 4 : 6,
          paddingHorizontal: isSm ? 8 : 12,
          paddingVertical: isSm ? 2 : 4,
        },
      ]}
    >
      <Text style={[styles.text, { color: config.text, fontSize: isSm ? 11 : 12 }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start" },
  text: { fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
});
