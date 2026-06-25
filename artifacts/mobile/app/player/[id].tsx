import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BeltBadge } from "@/components/BeltBadge";
import { StatBlock } from "@/components/StatBlock";
import { StatusBadge } from "@/components/StatusBadge";
import { useDues } from "@/context/DuesContext";
import { usePlayers } from "@/context/PlayersContext";
import { useColors } from "@/hooks/useColors";

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getPlayer, deletePlayer, addAchievement, deleteAchievement } = usePlayers();
  const { getPlayerDues } = useDues();
  const player = getPlayer(id ?? "");

  const [showAchForm, setShowAchForm] = useState(false);
  const [achTitle, setAchTitle] = useState("");
  const [achDate, setAchDate] = useState("");
  const [achDesc, setAchDesc] = useState("");

  if (!player) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Feather name="user-x" size={48} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
          Player not found
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: colors.accent }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const yearsActive = new Date().getFullYear() - player.year_started;
  const playerDues = getPlayerDues(player.id);

  const handleDelete = () => {
    if (Platform.OS === "web") {
      deletePlayer(player.id).then(() => router.back());
      return;
    }
    Alert.alert("Delete Player", `Remove ${player.name} from the roster?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deletePlayer(player.id);
          router.back();
        },
      },
    ]);
  };

  const handleAddAchievement = async () => {
    if (!achTitle.trim()) return;
    await addAchievement(player.id, {
      title: achTitle.trim(),
      date: achDate.trim() || new Date().toISOString().split("T")[0],
      description: achDesc.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAchTitle("");
    setAchDate("");
    setAchDesc("");
    setShowAchForm(false);
  };

  const handleDeleteAchievement = (achId: string, achName: string) => {
    if (Platform.OS === "web") {
      deleteAchievement(player.id, achId);
      return;
    }
    Alert.alert("Delete Achievement", `Remove "${achName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteAchievement(player.id, achId),
      },
    ]);
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24,
        }}
      >
        <View style={[styles.heroSection, { backgroundColor: colors.navBar, paddingTop: topPadding + 12 }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backPress, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={[styles.bigAvatar, { borderColor: colors.primary }]}>
                <Text style={styles.bigAvatarText}>
                  {player.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroName} numberOfLines={2}>{player.name}</Text>
                <BeltBadge rank={player.belt_rank} />
                <View style={{ marginTop: 6 }}>
                  <StatusBadge status={player.membership_status} />
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.statsStrip, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
            <StatBlock
              label="Age"
              value={String(player.age)}
              unit=" yrs"
            />
            <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
            <StatBlock
              label="Height"
              value={String(player.height_cm)}
              unit=" cm"
            />
            <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
            <StatBlock
              label="Weight"
              value={String(player.weight_kg)}
              unit=" kg"
            />
            <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
            <StatBlock
              label="Years"
              value={String(yearsActive)}
              unit=" yr"
            />
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Player Info
            </Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Birthdate</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{player.birthdate}</Text>
            </View>
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Year Started</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{player.year_started}</Text>
            </View>
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Belt Rank</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{player.belt_rank}</Text>
            </View>
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Membership</Text>
              <StatusBadge status={player.membership_status} size="sm" />
            </View>
          </View>

          <View style={[styles.achCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.achHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  Achievements
                </Text>
                <Text style={[styles.achCount, { color: colors.mutedForeground }]}>
                  {player.achievements.length} total
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAchForm(!showAchForm)}
                style={({ pressed }) => [
                  styles.addAchBtn,
                  {
                    backgroundColor: showAchForm ? colors.border : colors.accent,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather name={showAchForm ? "x" : "plus"} size={16} color="#FFF" />
              </Pressable>
            </View>

            {showAchForm && (
              <View style={[styles.achForm, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.achInput, { borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Achievement title *"
                  placeholderTextColor={colors.mutedForeground}
                  value={achTitle}
                  onChangeText={setAchTitle}
                />
                <TextInput
                  style={[styles.achInput, { borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Date (YYYY-MM-DD)"
                  placeholderTextColor={colors.mutedForeground}
                  value={achDate}
                  onChangeText={setAchDate}
                />
                <TextInput
                  style={[styles.achInput, { borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Description (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={achDesc}
                  onChangeText={setAchDesc}
                />
                <Pressable
                  onPress={handleAddAchievement}
                  style={({ pressed }) => [
                    styles.saveAchBtn,
                    { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={styles.saveAchText}>Save Achievement</Text>
                </Pressable>
              </View>
            )}

            {player.achievements.length === 0 ? (
              <View style={styles.emptyAch}>
                <Feather name="award" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyAchText, { color: colors.mutedForeground }]}>
                  No achievements recorded
                </Text>
              </View>
            ) : (
              player.achievements.map((ach, i) => (
                <View key={ach.id}>
                  {i > 0 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
                  <View style={styles.achItem}>
                    <View style={[styles.achDot, { backgroundColor: colors.accent }]} />
                    <View style={styles.achItemContent}>
                      <Text style={[styles.achTitle, { color: colors.foreground }]}>{ach.title}</Text>
                      <Text style={[styles.achDate, { color: colors.mutedForeground }]}>{ach.date}</Text>
                      {ach.description ? (
                        <Text style={[styles.achDesc, { color: colors.mutedForeground }]}>
                          {ach.description}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => handleDeleteAchievement(ach.id, ach.title)}
                      hitSlop={8}
                    >
                      <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Payment History */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Payment History</Text>
            {playerDues.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 16, gap: 8 }}>
                <Feather name="credit-card" size={28} color={colors.mutedForeground} />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground, textAlign: "center" }]}>
                  No dues records yet
                </Text>
              </View>
            ) : (
              playerDues.map((rec, i) => {
                const statusColors: Record<string, string> = { paid: "#10B981", overdue: "#EF4444", pending: "#F59E0B" };
                const statusBg: Record<string, string> = { paid: "#D1FAE5", overdue: "#FEE2E2", pending: "#FEF3C7" };
                const sc = statusColors[rec.status] ?? "#9CA3AF";
                const bg = statusBg[rec.status] ?? "#F3F4F6";
                const monthLabel = new Date(rec.month + "-01").toLocaleDateString("en-PH", { month: "long", year: "numeric" });
                return (
                  <View key={rec.id}>
                    {i > 0 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
                    <View style={[styles.infoRow, { alignItems: "flex-start" }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.infoValue, { color: colors.foreground }]}>{monthLabel}</Text>
                        {rec.status === "paid" && rec.paidDate && (
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            Paid {new Date(rec.paidDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })} · ₱{rec.amount.toLocaleString()}
                          </Text>
                        )}
                        {rec.notes ? (
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground, fontStyle: "italic" }]}>{rec.notes}</Text>
                        ) : null}
                      </View>
                      <View style={[{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: bg }]}>
                        <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: sc, textTransform: "capitalize" }}>
                          {rec.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <Pressable
            onPress={() => router.push(`/edit-player/${player.id}`)}
            style={({ pressed }) => [
              styles.editBtn,
              { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="edit-2" size={16} color="#FFF" />
            <Text style={styles.editBtnText}>Edit Player</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteBtn,
              { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="trash-2" size={16} color={colors.primary} />
            <Text style={[styles.deleteBtnText, { color: colors.primary }]}>
              Remove Player
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  backPress: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignSelf: "flex-start",
  },
  backBtn: { marginTop: 8 },
  heroSection: {
    paddingBottom: 0,
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  bigAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  bigAvatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  heroInfo: {
    flex: 1,
    gap: 6,
    paddingTop: 4,
  },
  heroName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  statsStrip: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  body: {
    padding: 16,
    gap: 14,
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sep: { height: 1 },
  achCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  achHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  achCount: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  addAchBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  achForm: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  achInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  saveAchBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveAchText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  emptyAch: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  emptyAchText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  achItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
  },
  achDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  achItemContent: { flex: 1 },
  achTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  achDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  achDesc: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  editBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  editBtnText: { color: "#FFF", fontSize: 15, fontFamily: "Inter_700Bold" },
  deleteBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1.5,
  },
  deleteBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
