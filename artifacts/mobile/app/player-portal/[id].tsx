import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
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
import { useAnnouncements } from "@/context/AnnouncementsContext";
import { useAttendance } from "@/context/AttendanceContext";
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
const SESSIONS_PER_PROMO = 12;

type Tab = "profile" | "edit" | "achievements" | "attendance" | "news";

function todayMMDD(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function clockStr(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m}:${s} ${ampm}`;
}
function todayDateLabel() {
  return new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function PlayerPortalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getPlayer, updatePlayer, addAchievement, deleteAchievement } = usePlayers();
  const { playerAccount, playerLogout } = usePlayerAuth();
  const { timeIn, timeOut, getTodayRecord, getPlayerRecords, getPromoProgress } = useAttendance();
  const { announcements } = useAnnouncements();

  const player = getPlayer(id ?? "");
  const isOwner = playerAccount?.playerId === id;
  const isPlayerBirthday = player?.birthdate ? player.birthdate.slice(5) === todayMMDD() : false;
  const [tab, setTab] = useState<Tab>("profile");

  // Live clock
  const [now, setNow] = useState(new Date());
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, []);

  // Edit state
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

  // Attendance
  const [attLoading, setAttLoading] = useState(false);
  const todayRecord = getTodayRecord(id ?? "");
  const playerRecords = getPlayerRecords(id ?? "");
  const promo = getPromoProgress(id ?? "");

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
    const wt = parseFloat(editWeight), ht = parseFloat(editHeight), yr = parseInt(editYearStarted, 10);
    if (isNaN(wt) || isNaN(ht) || isNaN(yr)) { setEditError("Fill in all fields correctly."); return; }
    setEditLoading(true); setEditError("");
    await updatePlayer(player.id, { birthdate: editBirthdate, weight_kg: wt, height_cm: ht, year_started: yr, belt_rank: editBelt, membership_status: editMembership });
    setEditLoading(false); setEditSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setEditSuccess(false), 2500);
  };

  const handleAddAchievement = async () => {
    if (!achTitle.trim()) return;
    await addAchievement(player.id, { title: achTitle.trim(), date: achDate.trim() || new Date().toISOString().split("T")[0], description: achDesc.trim() || undefined });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAchTitle(""); setAchDate(""); setAchDesc(""); setShowAchForm(false);
  };

  const handleDeleteAchievement = (achId: string, title: string) => {
    if (Platform.OS === "web") { deleteAchievement(player.id, achId); return; }
    Alert.alert("Delete Achievement", `Remove "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteAchievement(player.id, achId) },
    ]);
  };

  const handleTimeIn = async () => {
  setAttLoading(true);
  try {
    await timeIn(player.id);

    // Haptics support for native devices only
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (error: any) {
    console.error("Time-in failed:", error);
    if (Platform.OS === "web") {
      window.alert("Time-in failed: " + (error?.message || "Check network/Supabase logs"));
    } else {
      Alert.alert("Time-in Failed", error?.message || "Something went wrong.");
    }
  } finally {
    // Siguradong mag-re-reset ang loading state kahit mag-fail o mag-success!
    setAttLoading(false);
  }
};

const handleTimeOut = async () => {
  setAttLoading(true);
  try {
    await timeOut(player.id);

    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (error: any) {
    console.error("Time-out failed:", error);
    if (Platform.OS === "web") {
      window.alert("Time-out failed: " + (error?.message || "Check network/Supabase logs"));
    } else {
      Alert.alert("Time-out Failed", error?.message || "Something went wrong.");
    }
  } finally {
    setAttLoading(false);
  }
};

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow access to your photos to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      await updatePlayer(player.id, { photo_url: result.assets[0].uri });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleLogout = async () => {
    await playerLogout();
    router.replace("/login");
  };

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: "profile", label: "Profile" },
    { key: "edit", label: "Edit Info" },
    { key: "achievements", label: "Awards" },
    { key: "attendance", label: "Attendance" },
    { key: "news", label: "News" },
  ];

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
              <Pressable onPress={handleLogout} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}>
                <Feather name="log-out" size={16} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
          <View style={styles.heroBody}>
            <Pressable onPress={isOwner ? handlePickPhoto : undefined} style={[styles.avatarWrap, { borderColor: colors.primary }]}>
              {player.photo_url ? (
                <Image source={{ uri: player.photo_url }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{player.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}</Text>
              )}
              {isOwner && (
                <View style={styles.cameraOverlay}>
                  <Feather name="camera" size={11} color="#FFF" />
                </View>
              )}
            </Pressable>
            <View style={styles.heroInfo}>
              {isOwner ? (
                <Text style={styles.welcomeName}>Welcome, {player.name.split(" ")[0]}!</Text>
              ) : (
                <Text style={styles.heroName}>{player.name}</Text>
              )}
              <BeltBadge rank={player.belt_rank} />
              <View style={{ marginTop: 4 }}><StatusBadge status={player.membership_status} /></View>
            </View>
          </View>
          <View style={[styles.statsStrip, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
            <StatBlock label="Age" value={String(player.age)} unit=" yrs" textColor="#FFFFFF" subColor="#93C5FD" />
            <View style={[styles.stripDiv, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
            <StatBlock label="Height" value={String(player.height_cm)} unit=" cm" textColor="#FFFFFF" subColor="#93C5FD" />
            <View style={[styles.stripDiv, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
            <StatBlock label="Weight" value={String(player.weight_kg)} unit=" kg" textColor="#FFFFFF" subColor="#93C5FD" />
            <View style={[styles.stripDiv, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
            <StatBlock label="Years" value={String(yearsActive)} unit=" yr" textColor="#FFFFFF" subColor="#93C5FD" />
          </View>

          {isOwner && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
              {TABS.map((t) => (
                <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tabItem, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
                  <Text style={[styles.tabText, { color: tab === t.key ? "#FFF" : "#9CA3AF" }]}>{t.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.body}>

          {/* ── BIRTHDAY BANNER ── */}
          {isOwner && isPlayerBirthday && (
            <View style={[styles.bdBanner, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
              <Text style={styles.bdCake}>🎂</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bdTitle}>Happy Birthday, {player.name.split(" ")[0]}!</Text>
                <Text style={styles.bdSub}>The Kagay-an dojo family celebrates with you! 🎉</Text>
              </View>
            </View>
          )}

          {/* ── PROFILE ── */}
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
                  <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Log in as this player to edit their profile and add achievements.</Text>
                </View>
              )}
            </View>
          )}

          {/* ── EDIT ── */}
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

          {/* ── ACHIEVEMENTS ── */}
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

          {/* ── NEWS ── */}
          {tab === "news" && (
            <View style={{ gap: 12 }}>
              {announcements.length === 0 ? (
                <View style={[styles.emptyAch, { paddingVertical: 40 }]}>
                  <Feather name="bell-off" size={32} color={colors.mutedForeground} />
                  <Text style={[styles.emptyAchText, { color: colors.mutedForeground }]}>No announcements yet. Check back soon!</Text>
                </View>
              ) : (
                announcements.map((ann) => {
                  const catColor = ann.category === "tournament" ? "#D32F2F" : ann.category === "belt_promotion" ? "#F59E0B" : "#1E40AF";
                  const catLabel = ann.category === "tournament" ? "Tournament" : ann.category === "belt_promotion" ? "Belt Promotion" : "General";
                  const catIcon: React.ComponentProps<typeof Feather>["name"] = ann.category === "tournament" ? "award" : ann.category === "belt_promotion" ? "star" : "bell";
                  return (
                    <View key={ann.id} style={[styles.newsCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: catColor }]}>
                      <View style={[styles.newsBadge, { backgroundColor: catColor + "20" }]}>
                        <Feather name={catIcon} size={11} color={catColor} />
                        <Text style={[styles.newsBadgeText, { color: catColor }]}>{catLabel}</Text>
                      </View>
                      <Text style={[styles.newsTitle, { color: colors.foreground }]}>{ann.title}</Text>
                      <Text style={[styles.newsBody, { color: colors.mutedForeground }]}>{ann.body}</Text>
                      {(ann.venue || ann.eventDate) && (
                        <View style={[styles.newsMeta, { borderTopColor: colors.border }]}>
                          {ann.venue && (
                            <View style={styles.newsMetaRow}>
                              <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                              <Text style={[styles.newsMetaText, { color: colors.mutedForeground }]}>{ann.venue}</Text>
                            </View>
                          )}
                          {ann.eventDate && (
                            <View style={styles.newsMetaRow}>
                              <Feather name="calendar" size={11} color={colors.mutedForeground} />
                              <Text style={[styles.newsMetaText, { color: colors.mutedForeground }]}>
                                {new Date(ann.eventDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                      <Text style={[styles.newsFooter, { color: colors.mutedForeground }]}>
                        Posted by {ann.createdBy} · {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {tab === "attendance" && isOwner && (
            <>
              {/* Clock card */}
              <View style={[styles.card, { backgroundColor: colors.navBar, borderColor: "transparent" }]}>
                <Text style={[styles.dateLabel, { color: "#9CA3AF" }]}>{todayDateLabel()}</Text>
                <Text style={styles.clockText}>{clockStr(now)}</Text>
                <View style={[styles.clockDivider, { backgroundColor: colors.primary }]} />

                {!todayRecord ? (
                  <Pressable onPress={handleTimeIn} disabled={attLoading}
                    style={({ pressed }) => [styles.timeBtn, { backgroundColor: "#10B981", opacity: pressed || attLoading ? 0.8 : 1 }]}>
                    <Feather name="clock" size={18} color="#FFF" />
                    <Text style={styles.timeBtnText}>{attLoading ? "Recording..." : "Time IN"}</Text>
                  </Pressable>
                ) : todayRecord.time_out === null ? (
                  <View style={{ gap: 10 }}>
                    <View style={styles.checkedInRow}>
                      <View style={[styles.greenDot, { backgroundColor: "#10B981" }]} />
                      <Text style={{ color: "#FFF", fontSize: 13, fontFamily: "Inter_500Medium" }}>
                        Checked in at {formatTime(todayRecord.time_in)}
                        {todayRecord.status === "late" ? "  (Late)" : ""}
                      </Text>
                    </View>
                    <Pressable onPress={handleTimeOut} disabled={attLoading}
                      style={({ pressed }) => [styles.timeBtn, { backgroundColor: colors.primary, opacity: pressed || attLoading ? 0.8 : 1 }]}>
                      <Feather name="clock" size={18} color="#FFF" />
                      <Text style={styles.timeBtnText}>{attLoading ? "Recording..." : "Time OUT"}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={[styles.completedRow, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
                    <Feather name="check-circle" size={16} color="#10B981" />
                    <Text style={{ color: "#FFF", fontSize: 13, fontFamily: "Inter_500Medium" }}>
                      Session complete · {formatTime(todayRecord.time_in)} – {formatTime(todayRecord.time_out)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Promo progress */}
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Promo Session Progress</Text>
                <Text style={[styles.promoSub, { color: colors.mutedForeground }]}>Block {promo.block} · {SESSIONS_PER_PROMO} sessions per promo</Text>

                <View style={styles.promoRow}>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.promoTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.promoFill, {
                        backgroundColor: promo.remaining === 0 ? "#10B981" : colors.accent,
                        width: `${Math.round((promo.completed / SESSIONS_PER_PROMO) * 100)}%`,
                      }]} />
                    </View>
                    <Text style={[styles.promoCount, { color: colors.foreground }]}>
                      {promo.completed} / {SESSIONS_PER_PROMO} sessions
                    </Text>
                  </View>
                  <View style={[styles.promoBubble, { backgroundColor: promo.remaining === 0 ? "#10B981" + "20" : colors.accent + "15" }]}>
                    <Text style={[styles.promoBubbleNum, { color: promo.remaining === 0 ? "#10B981" : colors.accent }]}>
                      {promo.remaining === 0 ? "✓" : promo.remaining}
                    </Text>
                    <Text style={[styles.promoBubbleLabel, { color: colors.mutedForeground }]}>
                      {promo.remaining === 0 ? "Done" : "left"}
                    </Text>
                  </View>
                </View>

                {promo.remaining === 0 && (
                  <View style={[styles.renewalBanner, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B40" }]}>
                    <Feather name="alert-circle" size={14} color="#D97706" />
                    <Text style={styles.renewalText}>Promo block complete — renewal required for next 12 sessions.</Text>
                  </View>
                )}
              </View>

              {/* Attendance history */}
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Attendance History</Text>
                {playerRecords.length === 0 ? (
                  <View style={styles.emptyAch}>
                    <Feather name="calendar" size={36} color={colors.mutedForeground} />
                    <Text style={[styles.emptyAchText, { color: colors.mutedForeground }]}>No sessions recorded yet.</Text>
                  </View>
                ) : (
                  playerRecords.map((rec, i) => {
                    const duration = rec.time_out
                      ? Math.round((new Date(rec.time_out).getTime() - new Date(rec.time_in).getTime()) / 60000)
                      : null;
                    return (
                      <View key={rec.id}>
                        {i > 0 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
                        <View style={styles.recRow}>
                          <View style={[styles.recDot, { backgroundColor: rec.status === "present" ? "#10B981" : "#F59E0B" }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.recDate, { color: colors.foreground }]}>{formatDate(rec.time_in)}</Text>
                            <Text style={[styles.recTime, { color: colors.mutedForeground }]}>
                              IN {formatTime(rec.time_in)}
                              {rec.time_out ? ` · OUT ${formatTime(rec.time_out)}` : " · In progress"}
                              {duration !== null ? ` · ${duration}m` : ""}
                            </Text>
                          </View>
                          <View style={[styles.recBadge, { backgroundColor: rec.status === "present" ? "#10B98118" : "#F59E0B18" }]}>
                            <Text style={[styles.recBadgeText, { color: rec.status === "present" ? "#10B981" : "#F59E0B" }]}>
                              {rec.status === "present" ? "Present" : "Late"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </>
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
  heroBody: { flexDirection: "row", alignItems: "flex-start", gap: 16, paddingHorizontal: 20, paddingBottom: 16 },
  avatarText: { color: "#FFF", fontSize: 26, fontFamily: "Inter_700Bold" },
  heroInfo: { flex: 1, gap: 6, paddingTop: 4 },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, backgroundColor: "#1F2937", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  cameraOverlay: { position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: "#111827", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#374151" },
  welcomeName: { color: "#93C5FD", fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 24 },
  heroName: { color: "#FFF", fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 26 },
  statsStrip: { flexDirection: "row", paddingVertical: 16, paddingHorizontal: 8 },
  stripDiv: { width: 1, marginVertical: 4 },
  tabScroll: { borderTopWidth: 0 },
  tabRow: { flexDirection: "row", paddingHorizontal: 4 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomColor: "transparent", borderBottomWidth: 2 },
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
  // Attendance
  dateLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  clockText: { color: "#FFF", fontSize: 40, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  clockDivider: { height: 3, borderRadius: 2, width: 40 },
  timeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, paddingVertical: 14 },
  timeBtnText: { color: "#FFF", fontSize: 15, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  checkedInRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  greenDot: { width: 8, height: 8, borderRadius: 4 },
  completedRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12 },
  promoSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -6 },
  promoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  promoTrack: { height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 6 },
  promoFill: { height: 10, borderRadius: 5 },
  promoCount: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  promoBubble: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  promoBubbleNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  promoBubbleLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  renewalBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 8, borderWidth: 1, padding: 10 },
  renewalText: { flex: 1, color: "#92400E", fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 18 },
  bdBanner: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 4 },
  bdCake: { fontSize: 28 },
  bdTitle: { color: "#92400E", fontSize: 15, fontFamily: "Inter_700Bold" },
  bdSub: { color: "#78350F", fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  newsCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 12, gap: 6 },
  newsBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  newsBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  newsTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  newsBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  newsMeta: { borderTopWidth: 1, paddingTop: 8, gap: 4 },
  newsMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  newsMetaText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  newsFooter: { fontSize: 10, fontFamily: "Inter_400Regular" },
  recRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  recDot: { width: 8, height: 8, borderRadius: 4 },
  recDate: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  recTime: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  recBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  recBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
