import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BeltBadge } from "@/components/BeltBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { useColors } from "@/hooks/useColors";
import { Player } from "@/types";

interface Props {
  player: Player;
}

export function PlayerCard({ player }: Props) {
  const colors = useColors();
  const yearsActive = new Date().getFullYear() - player.year_started;

  return (
    <Pressable
      onPress={() => router.push(`/player/${player.id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.navBar }]}>
            <Text style={styles.avatarText}>
              {player.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {player.name}
          </Text>
          <View style={styles.badgeRow}>
            <BeltBadge rank={player.belt_rank} size="sm" />
          </View>
          <View style={styles.statusRow}>
            <StatusBadge status={player.membership_status} size="sm" />
          </View>
        </View>
        <View style={styles.metaRight}>
          <Text style={[styles.yearsLabel, { color: colors.mutedForeground }]}>
            {yearsActive}
          </Text>
          <Text style={[styles.yearsUnit, { color: colors.mutedForeground }]}>
            {yearsActive === 1 ? "yr" : "yrs"}
          </Text>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={{ marginTop: 6 }} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  avatarContainer: {},
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  badgeRow: {
    flexDirection: "row",
  },
  statusRow: {
    flexDirection: "row",
  },
  metaRight: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
  },
  yearsLabel: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  yearsUnit: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
  },
});
