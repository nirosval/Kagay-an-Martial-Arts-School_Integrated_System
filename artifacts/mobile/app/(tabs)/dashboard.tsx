import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BeltBadge } from "@/components/BeltBadge";
import { useAttendance } from "@/context/AttendanceContext";
import { useAuth } from "@/context/AuthContext";
import { usePlayers } from "@/context/PlayersContext";
import { useColors } from "@/hooks/useColors";

function StatCard({ label, value, icon, accent }: {
  label: string; value: number | string;
  icon: React.ComponentProps<typeof Feather>["name"]; accent: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: accent + "18" }]}>
        <Feather name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function clockStr(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m}:${s} ${ampm}`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function roleLabel(role: string) {
  if (role === "sensei") return "Sensei";
  if (role === "coach") return "Coach";
  return "Senpai";
}

function roleColor(role: string) {
  if (role === "sensei") return "#D32F2F";
  if (role === "coach") return "#1E40AF";
  return "#7C3AED";
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateProfilePhoto } = useAuth();
  const { players } = usePlayers();
  const {
    getTodayAll, getTodayStaffRecord, staffTimeIn, staffTimeOut,
    getTodayPresentStaff,
  } = useAttendance();

  const [attLoading, setAttLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, []);

  const todayRecords = getTodayAll();
  const myStaffRecord = user ? getTodayStaffRecord(user.id) : undefined;
  const presentStaff = getTodayPresentStaff();

  const stats = useMemo(() => {
    const total = players.length;
    const members = players.filter((p) => p.membership_status === "active_member").length;
    const nonMembers = players.filter((p) => p.membership_status === "active_nonmember").length;
    const totalAchievements = players.reduce((acc, p) => acc + p.achievements.length, 0);
    return { total, members, nonMembers, totalAchievements };
  }, [players]);

  const attendanceStats = useMemo(() => {
    const presentIds = new Set(todayRecords.map((r) => r.playerId));
    const present = todayRecords.filter((r) => r.status === "present").length;
    const late = todayRecords.filter((r) => r.status === "late").length;
    const activePlayers = players.filter((p) => p.membership_status !== "inactive");
    const absent = activePlayers.filter((p) => !presentIds.has(p.id)).length;
    return { present, late, absent, total: activePlayers.length };
  }, [players, todayRecords]);

  const playerListToday = useMemo(() => {
    return players
      .filter((p) => p.membership_status !== "inactive")
      .map((p) => {
        const rec = todayRecords.find((r) => r.playerId === p.id);
        return { ...p, todayStatus: rec ? rec.status : "absent" as const, timeIn: rec?.time_in ?? null };
      })
      .sort((a, b) => {
        const order = { present: 0, late: 1, absent: 2 };
        return order[a.todayStatus] - order[b.todayStatus];
      });
  }, [players, todayRecords]);

  const beltBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach((p) => { counts[p.belt_rank] = (counts[p.belt_rank] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [players]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const statusColor = (s: string) => s === "present" ? "#10B981" : s === "late" ? "#F59E0B" : "#EF4444";
  const statusLabel = (s: string) => s === "present" ? "Present" : s === "late" ? "Late" : "Absent";

  const handlePickStaffPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfilePhoto(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleStaffTimeIn = async () => {
    if (!user) return;
    setAttLoading(true);
    await staffTimeIn(user.id, user.name, user.role, user.photo_url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAttLoading(false);
  };

  const handleStaffTimeOut = async () => {
    if (!user) return;
    setAttLoading(true);
    await staffTimeOut(user.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAttLoading(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.navBar, paddingTop: topPadding + 16 }]}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSub}>
          {roleLabel(user?.role ?? "")} {user?.name?.split(" ")[1] ?? ""}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date */}
        <View style={[styles.dateRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={15} color={colors.mutedForeground} />
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{todayLabel()}</Text>
        </View>

        {/* ── Staff Overview / My Time In ── */}
        <View style={[styles.section, { backgroundColor: colors.navBar, borderColor: "transparent" }]}>
          <Text style={styles.staffSectionTitle}>Staff Overview</Text>
          <Text style={styles.staffSectionSub}>{presentStaff.length} staff present today</Text>

          {/* My personal time-in widget */}
          <View style={[styles.myAttendBox, { backgroundColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.12)" }]}>
            <View style={styles.myAttendTop}>
              <View style={styles.myAttendLeft}>
                <Pressable onPress={handlePickStaffPhoto} style={styles.myAvatarWrap}>
                  {user?.photo_url ? (
                    <Image source={{ uri: user.photo_url }} style={styles.myAvatarImg} />
                  ) : (
                    <Text style={styles.myAvatarText}>
                      {user?.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?"}
                    </Text>
                  )}
                  <View style={styles.myAvatarCamera}>
                    <Feather name="camera" size={9} color="#FFF" />
                  </View>
                </Pressable>
                <View>
                  <Text style={styles.myAttendName}>{user?.name ?? "You"}</Text>
                  <View style={[styles.myRoleBadge, { backgroundColor: roleColor(user?.role ?? "") + "30" }]}>
                    <Text style={[styles.myRoleText, { color: roleColor(user?.role ?? "") === "#D32F2F" ? "#F87171" : roleColor(user?.role ?? "") === "#1E40AF" ? "#93C5FD" : "#C4B5FD" }]}>
                      {roleLabel(user?.role ?? "")}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.clockSmall}>{clockStr(now)}</Text>
            </View>

            {!myStaffRecord ? (
              <Pressable onPress={handleStaffTimeIn} disabled={attLoading}
                style={({ pressed }) => [styles.staffTimeBtn, { backgroundColor: "#10B981", opacity: pressed || attLoading ? 0.8 : 1 }]}>
                <Feather name="clock" size={16} color="#FFF" />
                <Text style={styles.staffTimeBtnText}>{attLoading ? "Recording..." : "Time IN — Start Session"}</Text>
              </Pressable>
            ) : myStaffRecord.time_out === null ? (
              <View style={{ gap: 8 }}>
                <View style={styles.checkedInRow}>
                  <View style={[styles.greenDot, { backgroundColor: "#10B981" }]} />
                  <Text style={styles.checkedInText}>On duty since {formatTime(myStaffRecord.time_in)}</Text>
                </View>
                <Pressable onPress={handleStaffTimeOut} disabled={attLoading}
                  style={({ pressed }) => [styles.staffTimeBtn, { backgroundColor: "#D32F2F", opacity: pressed || attLoading ? 0.8 : 1 }]}>
                  <Feather name="clock" size={16} color="#FFF" />
                  <Text style={styles.staffTimeBtnText}>{attLoading ? "Recording..." : "Time OUT — End Session"}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={[styles.doneRow, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
                <Feather name="check-circle" size={15} color="#10B981" />
                <Text style={styles.doneText}>
                  Session complete · {formatTime(myStaffRecord.time_in)} – {formatTime(myStaffRecord.time_out)}
                </Text>
              </View>
            )}
          </View>

          {/* All present staff today */}
          {presentStaff.length > 0 && (
            <View style={[styles.staffListBox, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }]}>
              <Text style={styles.staffListTitle}>Present Staff Today</Text>
              {presentStaff.map((s, i) => (
                <View key={s.id}>
                  {i > 0 && <View style={[styles.staffRowSep, { backgroundColor: "rgba(255,255,255,0.08)" }]} />}
                  <View style={styles.staffRow}>
                    <View style={[styles.staffAvatar, { backgroundColor: roleColor(s.staffRole) + "30" }]}>
                      {s.staffPhotoUrl ? (
                        <Image source={{ uri: s.staffPhotoUrl }} style={styles.staffAvatarImg} />
                      ) : (
                        <Text style={[styles.staffAvatarText, { color: "#FFF" }]}>
                          {s.staffName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.staffName}>{s.staffName}</Text>
                      <Text style={[styles.staffRole, { color: roleColor(s.staffRole) === "#D32F2F" ? "#F87171" : roleColor(s.staffRole) === "#1E40AF" ? "#93C5FD" : "#C4B5FD" }]}>
                        {roleLabel(s.staffRole)}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.staffTimeText}>IN {formatTime(s.time_in)}</Text>
                      {s.time_out ? (
                        <Text style={styles.staffTimeOut}>OUT {formatTime(s.time_out)}</Text>
                      ) : (
                        <View style={styles.onDutyPill}>
                          <Text style={styles.onDutyText}>On duty</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Player Stats */}
        <View style={styles.statsGrid}>
          <StatCard label="Total Athletes" value={stats.total} icon="users" accent={colors.primary} />
          <StatCard label="Active Members" value={stats.members} icon="check-circle" accent="#10B981" />
          <StatCard label="Non-Members" value={stats.nonMembers} icon="alert-circle" accent="#F59E0B" />
          <StatCard label="Achievements" value={stats.totalAchievements} icon="award" accent={colors.accent} />
        </View>

        {/* Player Attendance Status Overview */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Player Attendance</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>{attendanceStats.total} active players tracked</Text>

          <View style={styles.statusRow}>
            <StatusPill label="Present" count={attendanceStats.present} color="#10B981" colors={colors} />
            <StatusPill label="Absent" count={attendanceStats.absent} color="#EF4444" colors={colors} />
            <StatusPill label="Late" count={attendanceStats.late} color="#F59E0B" colors={colors} />
          </View>

          {attendanceStats.total > 0 && (
            <View style={{ gap: 4 }}>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                {attendanceStats.present > 0 && (
                  <View style={[styles.progressFill, { backgroundColor: "#10B981", width: `${Math.round((attendanceStats.present / attendanceStats.total) * 100)}%` }]} />
                )}
                {attendanceStats.late > 0 && (
                  <View style={[styles.progressFill, { backgroundColor: "#F59E0B", width: `${Math.round((attendanceStats.late / attendanceStats.total) * 100)}%` }]} />
                )}
              </View>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                {attendanceStats.present + attendanceStats.late} of {attendanceStats.total} attended today
              </Text>
            </View>
          )}
        </View>

        {/* Player List Overview */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Player List Overview</Text>
          {playerListToday.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active players.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.thName, { color: colors.mutedForeground }]}>Name</Text>
                <Text style={[styles.thStatus, { color: colors.mutedForeground }]}>Status</Text>
                <Text style={[styles.thTime, { color: colors.mutedForeground }]}>Time In</Text>
              </View>
              {playerListToday.map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <View style={[styles.rowSep, { backgroundColor: colors.border }]} />}
                  <View style={styles.tableRow}>
                    <Text style={[styles.tdName, { color: colors.foreground }]} numberOfLines={1}>{p.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor(p.todayStatus) + "18" }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor(p.todayStatus) }]}>{statusLabel(p.todayStatus)}</Text>
                    </View>
                    <Text style={[styles.tdTime, { color: colors.mutedForeground }]}>
                      {p.timeIn ? formatTime(p.timeIn) : "—"}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Belt Distribution */}
        {beltBreakdown.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Belt Distribution</Text>
            {beltBreakdown.map(([belt, count]) => (
              <View key={belt} style={styles.beltRow}>
                <BeltBadge rank={belt} size="sm" />
                <View style={styles.beltBarWrap}>
                  <View style={[styles.beltBar, { backgroundColor: colors.primary, width: `${Math.round((count / stats.total) * 100)}%` }]} />
                </View>
                <Text style={[styles.beltCount, { color: colors.mutedForeground }]}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Top Achievers */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Achievers</Text>
          {players
            .filter((p) => p.achievements.length > 0)
            .sort((a, b) => b.achievements.length - a.achievements.length)
            .slice(0, 5)
            .map((p, i) => (
              <View key={p.id} style={styles.achieverRow}>
                <View style={[styles.rankCircle, { backgroundColor: i === 0 ? colors.primary : colors.border }]}>
                  <Text style={[styles.rankNum, { color: i === 0 ? "#FFF" : colors.mutedForeground }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.achieverName, { color: colors.foreground }]} numberOfLines={1}>{p.name}</Text>
                <View style={styles.achieverBadge}>
                  <Feather name="award" size={12} color={colors.accent} />
                  <Text style={[styles.achieverCount, { color: colors.accent }]}>{p.achievements.length}</Text>
                </View>
              </View>
            ))}
          {players.every((p) => p.achievements.length === 0) && (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No achievements recorded yet.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatusPill({ label, count, color, colors }: {
  label: string; count: number; color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: color + "12", borderColor: color + "40" }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <View>
        <Text style={[styles.pillCount, { color }]}>{count}</Text>
        <Text style={[styles.pillLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, gap: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 28, fontFamily: "Inter_700Bold" },
  headerSub: { color: "#9CA3AF", fontSize: 13, fontFamily: "Inter_400Regular" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  dateText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  // Staff overview
  staffSectionTitle: { color: "#FFFFFF", fontSize: 17, fontFamily: "Inter_700Bold" },
  staffSectionSub: { color: "#9CA3AF", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -4 },
  myAttendBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  myAttendTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  myAttendLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  myAvatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#374151", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  myAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  myAvatarText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  myAvatarCamera: { position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  myAttendName: { color: "#FFF", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  myRoleBadge: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  myRoleText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  clockSmall: { color: "#9CA3AF", fontSize: 13, fontFamily: "Inter_400Regular", paddingTop: 2 },
  staffTimeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, paddingVertical: 12 },
  staffTimeBtnText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  checkedInRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  greenDot: { width: 8, height: 8, borderRadius: 4 },
  checkedInText: { color: "#D1FAE5", fontSize: 13, fontFamily: "Inter_500Medium" },
  doneRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 8, padding: 10 },
  doneText: { color: "#D1FAE5", fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  staffListBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 0 },
  staffListTitle: { color: "#9CA3AF", fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10 },
  staffRowSep: { height: 1, marginVertical: 2 },
  staffRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  staffAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  staffAvatarImg: { width: 36, height: 36, borderRadius: 18 },
  staffAvatarText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  staffName: { color: "#FFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  staffRole: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 1 },
  staffTimeText: { color: "#9CA3AF", fontSize: 12, fontFamily: "Inter_400Regular" },
  staffTimeOut: { color: "#6B7280", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  onDutyPill: { backgroundColor: "#10B98120", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  onDutyText: { color: "#10B981", fontSize: 10, fontFamily: "Inter_600SemiBold" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", borderRadius: 12, borderWidth: 1, padding: 16, gap: 8, elevation: 1 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 28, fontFamily: "Inter_700Bold", lineHeight: 32 },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12, elevation: 1 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -6 },
  statusRow: { flexDirection: "row", gap: 10 },
  pill: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  pillDot: { width: 10, height: 10, borderRadius: 5 },
  pillCount: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 26 },
  pillLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  progressTrack: { height: 8, borderRadius: 4, flexDirection: "row", overflow: "hidden" },
  progressFill: { height: 8 },
  progressLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tableHeader: { flexDirection: "row", alignItems: "center", paddingBottom: 8 },
  thName: { flex: 1, fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  thStatus: { width: 72, fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textAlign: "center" },
  thTime: { width: 70, fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textAlign: "right" },
  rowSep: { height: 1 },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  tdName: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  statusBadge: { width: 72, borderRadius: 6, paddingVertical: 3, alignItems: "center" },
  statusBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tdTime: { width: 70, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  beltRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  beltBarWrap: { flex: 1, height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" },
  beltBar: { height: 6, borderRadius: 3 },
  beltCount: { fontSize: 13, fontFamily: "Inter_600SemiBold", minWidth: 20, textAlign: "right" },
  achieverRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rankCircle: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  rankNum: { fontSize: 12, fontFamily: "Inter_700Bold" },
  achieverName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  achieverBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  achieverCount: { fontSize: 13, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 8 },
});
