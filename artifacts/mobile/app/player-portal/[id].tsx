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
import { usePlayerAuth } from "@/context/PlayerAuthContext";
import { usePlayers } from "@/context/PlayersContext";
import { useColors } from "@/hooks/useColors";
import { Achievement, MembershipStatus } from "@/types";

const BELT_RANKS = [
  "White Belt", "Yellow Belt", "Orange Belt", "Green Belt",
  "Blue Belt", "Purple Belt", "Brown Belt", "Black Belt",
];

const MEMBERSHIP_OPTIONS: Array<{ label: string; value: MembershipStatus }> = [
  { label: "Active Member", value: "active_member" },
  { label: "Active (Non-Member)", value: "active_nonmember" },
  { label: "Inactive", value: "inactive" },
];

type Tab = "profile" | "edit" | "achievements";

export default function PlayerPortalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getPlayer, updatePlayer, addAchievement, deleteAchievement } = usePlayers();
  const { playerAccount, playerLogout } = usePlayerAuth();

  const player = getPlayer(id ?? "");
  const isOwner = playerAccount?.playerId === id;

  const [tab, setTab] = useState<Tab>("profile");

  // Edit form state
  const [editBirthdate, setEditBirthdate] = useState(player?.birthdate ?? "");
  const [editWeight, setEditWeight] = useState(String(player?.weight_kg ?? ""));
  const [editHeight, setEditHeight] = useState(String(player?.height_cm ?? ""));
  const [editYearStarted, setEditYearStarted] = useState(String(player?.year_started ?? ""));
  const [editBelt, setEditBelt] = useState(player?.belt_rank ?? "White Belt");
  const [editMembership, setEditMembership] = useState<MembershipStatus>(player?.membership_status ?? "active_member");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  // Achievement form
  const [showAchForm, setShowAchForm] = useState(false);
  const [achTitle, setAchTitle] = useState("");
  const [achDate, setAchDate] = useState("");
  const [achDesc, setAchDesc] = useState("");

  if (!player) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="user-x" size={48} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Profile not found</Text>
        <Pressable onPress={() => router.replace("/login")}>
          <Text style={{ color: colors.accent }}>Back to login</Text>
        </Pressable>
      </View>
    );
  }

  const yearsActive = new Date().getFullYear() - player.year_started;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSaveEdit = async () => {
    const wt = parseFloat(editWeight);
    const ht = parseFloat(editHeight);
    const yr = parseInt(editYearStarted, 10);
    if (isNaN(wt) || isNaN(ht) || isNaN(yr)) {
      setEditError("Please fill in all fields correctly.");
      return;
    }
    setEditLoading(true);
    setEditError("");
    await updatePlayer(player.id, {
      birthdate: editBirthdate,
      weight_kg: wt,
      height_cm: ht,
      year_started: yr,
      belt_rank: editBelt,
      membership_status: editMembership,
    });
    setEditLoading(false);
    setEditSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setEditSuccess(false), 2500);
  };

  const handleAddAchievement = async () => {
    if (!achTitle.trim()) return;
    await addAchievement(player.id, {
      title: achTitle.trim(),
      date: achDate.trim() || new Date().toISOString().split("T")[0],
      description: achDesc.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAchTitle(""); setAchDate(""); setAchDesc("");
    setShowAchForm(false);
  };

  const handleDeleteAchievement = (achId: string, title: string) => {
    if (Platform.OS === "web") { deleteAchievement(player.id, achId); return; }
    Alert.alert("Delete Achievement", `Remove "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteAchievement(player.id, achId) },
    ]);
  };

  const handleLogout = async () => {
    await playerLogout();
    router.replace("/login");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 24 }}>

        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.navBar, paddingTop: topPad + 12 }]}>
          <View style={styles.heroTopRow}>
            <Pressable onPress={() => router.replace("/login")} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
              <Feather name="arrow-left" size={20} color="#FFF" />
              <Text style={styles.backLabel}>Portals</Text>
            </Pressable>
            {isOwner && (
              <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.6 : 1 }]}>
                <Feather name="log-out" size={16} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          <View style={styles.heroBody}>
            <View style={[styles.avatar, { borderColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {player.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{player.name}</Text>
              <BeltBadge rank={player.belt_rank} />
              <View style={{ marginTop: 4 }}>
                <StatusBadge status={player.membership_status} />
              </View>
            </View>
          </View>

          <View style={[styles.statsStrip, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
            <StatBlock label="Age" value={String(player.age)} unit=" yrs" />
            <View style={[styles.stripDiv, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
            <StatBlock label="Height" value={String(player.height_cm)} unit=" cm" />
            <View style={[styles.stripDiv, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
            <StatBlock label="Weight" value={String(player.weight_kg)} unit=" kg" />
            <View style={[styles.stripDiv, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
            <StatBlock label="Years" value={String(yearsActive)} unit=" yr" />
          </View>

          {/* Tabs */}
          {isOwner && (
            <View style={styles.tabRow}>
              {(["profile", "edit", "achievements"] as Tab[]).map((t) => (
                <Pressable key={t} onPress={() => setTab(t)} style={[styles.tabItem, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
                  <Text style={[styles.tabText, { color: tab === t ? "#FFF" : "#9CA3AF" }]}>
                    {t === "profile" ? "Profile" : t === "edit" ? "Edit Info" : "Achievements"}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.body}>

          {/* ── PROFILE TAB ── */}
          {(tab === "profile" || !isOwner) && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Profile Info</Text>
              <InfoRow label="Birthdate" value={player.birthdate} colors={colors} />
              <Sep colors={colors} />
              <InfoRow label="Year Started" value={String(player.year_started)} colors={colors} />
              <Sep colors={colors} />
              <InfoRow label="Belt Rank" value={player.belt_rank} colors={colors} />
              <Sep colors={colors} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Membership</Text>
                <StatusBadge status={player.membership_status} size="sm" />
              </View>
              {!isOwner && (
                <View style={[styles.footerNote, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Feather name="info" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                    Log in as this player to edit their profile and add achievements.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── EDIT TAB ── */}
          {tab === "edit" && isOwner && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Edit My Info</Text>

              {editError ? <View style={styles.errorBox}><Text style={styles.errorText}>{editError}</Text></View> : null}
              {editSuccess ? <View style={styles.successBox}><Text style={styles.successText}>Profile updated!</Text></View> : null}

              <Label label="BIRTHDATE" colors={colors} />
              <TextInput style={[styles.input, iStyle(colors)]} value={editBirthdate} onChangeText={setEditBirthdate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} keyboardType="numbers-and-punctuation" />

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Label label="HEIGHT (cm)" colors={colors} />
                  <TextInput style={[styles.input, iStyle(colors)]} value={editHeight} onChangeText={setEditHeight} keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Label label="WEIGHT (kg)" colors={colors} />
                  <TextInput style={[styles.input, iStyle(colors)]} value={editWeight} onChangeText={setEditWeight} keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
                </View>
              </View>

              <Label label="YEAR STARTED" colors={colors} />
              <TextInput style={[styles.input, iStyle(colors)]} value={editYearStarted} onChangeText={setEditYearStarted} keyboardType="number-pad" placeholderTextColor={colors.mutedForeground} />

              <Label label="BELT RANK" colors={colors} />
              <View style={styles.chipWrap}>
                {BELT_RANKS.map((b) => (
                  <Pressable key={b} onPress={() => setEditBelt(b)}
                    style={[styles.chip, { backgroundColor: editBelt === b ? colors.navBar : colors.background, borderColor: editBelt === b ? colors.navBar : colors.border }]}>
                    <Text style={[styles.chipText, { color: editBelt === b ? "#FFF" : colors.foreground }]}>{b}</Text>
                  </Pressable>
                ))}
              </View>

              <Label label="MEMBERSHIP STATUS" colors={colors} />
              {MEMBERSHIP_OPTIONS.map((opt) => (
                <Pressable key={opt.value} onPress={() => setEditMembership(opt.value)}
                  style={[styles.memOption, { borderColor: editMembership === opt.value ? colors.accent : colors.border, backgroundColor: editMembership === opt.value ? colors.accent + "10" : colors.background }]}>
                  <View style={[styles.radio, { borderColor: editMembership === opt.value ? colors.accent : colors.border }]}>
                    {editMembership === opt.value && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}
                  </View>
                  <Text style={[styles.memLabel, { color: colors.foreground }]}>{opt.label}</Text>
                </Pressable>
              ))}

              <Pressable onPress={handleSaveEdit} disabled={editLoading}
                style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.accent, opacity: pressed || editLoading ? 0.8 : 1 }]}>
                <Text style={styles.saveBtnText}>{editLoading ? "Saving..." : "SAVE CHANGES"}</Text>
              </Pressable>
            </View>
          )}

          {/* ── ACHIEVEMENTS TAB ── */}
          {tab === "achievements" && isOwner && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.achHeader}>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>My Achievements</Text>
                  <Text style={[styles.achCount, { color: colors.mutedForeground }]}>{player.achievements.length} total</Text>
                </View>
                <Pressable onPress={() => setShowAchForm(!showAchForm)}
                  style={({ pressed }) => [styles.addAchBtn, { backgroundColor: showAchForm ? colors.border : colors.accent, opacity: pressed ? 0.8 : 1 }]}>
                  <Feather name={showAchForm ? "x" : "plus"} size={16} color="#FFF" />
                </Pressable>
              </View>

              {showAchForm && (
                <View style={[styles.achForm, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput style={[styles.input, iStyle(colors)]} placeholder="Achievement title *" placeholderTextColor={colors.mutedForeground} value={achTitle} onChangeText={setAchTitle} />
                  <TextInput style={[styles.input, iStyle(colors)]} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={colors.mutedForeground} value={achDate} onChangeText={setAchDate} />
                  <TextInput style={[styles.input, iStyle(colors)]} placeholder="Description (optional)" placeholderTextColor={colors.mutedForeground} value={achDesc} onChangeText={setAchDesc} />
                  <Pressable onPress={handleAddAchievement} style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }]}>
                    <Text style={styles.saveBtnText}>ADD ACHIEVEMENT</Text>
                  </Pressable>
                </View>
              )}

              {player.achievements.length === 0 ? (
                <View style={styles.emptyAch}>
                  <Feather name="award" size={36} color={colors.mutedForeground} />
                  <Text style={[styles.emptyAchText, { color: colors.mutedForeground }]}>No achievements yet. Add your first!</Text>
                </View>
              ) : (
                player.achievements.map((ach: Achievement, i: number) => (
                  <View key={ach.id}>
                    {i > 0 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
                    <View style={styles.achItem}>
                      <View style={[styles.achDot, { backgroundColor: colors.accent }]} />
                      <View style={styles.achContent}>
                        <Text style={[styles.achTitle, { color: colors.foreground }]}>{ach.title}</Text>
                        <Text style={[styles.achDate, { color: colors.mutedForeground }]}>{ach.date}</Text>
                        {ach.description ? <Text style={[styles.achDesc, { color: colors.mutedForeground }]}>{ach.description}</Text> : null}
                      </View>
                      <Pressable onPress={() => handleDeleteAchievement(ach.id, ach.title)} hitSlop={8}>
                        <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}
function Sep({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.sep, { backgroundColor: colors.border }]} />;
}
function Label({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, color: colors.mutedForeground, marginTop: 4 }}>{label}</Text>;
}
function iStyle(colors: ReturnType<typeof useColors>) {
  return { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background };
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  hero: { paddingBottom: 0 },
  heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backLabel: { color: "#FFF", fontSize: 15, fontFamily: "Inter_500Medium" },
  logoutBtn: { padding: 4 },
  heroBody: { flexDirection: "row", alignItems: "flex-start", gap: 16, paddingHorizontal: 20, paddingBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, backgroundColor: "#1F2937", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: 26, fontFamily: "Inter_700Bold" },
  heroInfo: { flex: 1, gap: 6, paddingTop: 4 },
  heroName: { color: "#FFF", fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 26 },
  statsStrip: { flexDirection: "row", paddingVertical: 16, paddingHorizontal: 8 },
  stripDiv: { width: 1, marginVertical: 4 },
  tabRow: { flexDirection: "row", paddingHorizontal: 4 },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomColor: "transparent", borderBottomWidth: 2 },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  body: { padding: 16, gap: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  infoLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sep: { height: 1 },
  footerNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  footerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  errorBox: { backgroundColor: "#FEE2E2", borderRadius: 8, padding: 12 },
  errorText: { color: "#991B1B", fontSize: 13, fontFamily: "Inter_500Medium" },
  successBox: { backgroundColor: "#D1FAE5", borderRadius: 8, padding: 12 },
  successText: { color: "#065F46", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular" },
  row2: { flexDirection: "row", gap: 12 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  memOption: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderRadius: 10, padding: 14 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  memLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  saveBtn: { borderRadius: 10, paddingVertical: 13, alignItems: "center", justifyContent: "center", marginTop: 4 },
  saveBtnText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  achHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  achCount: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  addAchBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  achForm: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 8 },
  emptyAch: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyAchText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  achItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8 },
  achDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  achContent: { flex: 1 },
  achTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  achDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  achDesc: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
});
