import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEFAULT_DUES_AMOUNT, DuesStatus, useDues } from "@/context/DuesContext";
import { usePlayers } from "@/context/PlayersContext";
import { useColors } from "@/hooks/useColors";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" });
}

function prevMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

const STATUS_CONFIG: Record<DuesStatus, { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Feather>["name"] }> = {
  paid:    { label: "Paid",    color: "#10B981", bg: "#D1FAE5", icon: "check-circle" },
  overdue: { label: "Overdue", color: "#EF4444", bg: "#FEE2E2", icon: "alert-circle" },
  pending: { label: "Pending", color: "#F59E0B", bg: "#FEF3C7", icon: "clock" },
};

export default function DuesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { players, isLoading: playersLoading } = usePlayers();
  const { getMonthStatus, getMonthRecord, markPaid, markOverdue, markPending, isLoading: duesLoading } = useDues();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(String(DEFAULT_DUES_AMOUNT));
  const [payNotes, setPayNotes] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const activePlayers = useMemo(
    () => players.filter((p) => p.membership_status !== "inactive"),
    [players]
  );

  const summary = useMemo(() => {
    let paid = 0, overdue = 0, pending = 0;
    activePlayers.forEach((p) => {
      const s = getMonthStatus(p.id, selectedMonth);
      if (s === "paid") paid++;
      else if (s === "overdue") overdue++;
      else pending++;
    });
    return { paid, overdue, pending, total: activePlayers.length };
  }, [activePlayers, selectedMonth, getMonthStatus]);

  const sortedPlayers = useMemo(() => {
    const order: Record<DuesStatus, number> = { overdue: 0, pending: 1, paid: 2 };
    return [...activePlayers].sort((a, b) => {
      const sa = getMonthStatus(a.id, selectedMonth);
      const sb = getMonthStatus(b.id, selectedMonth);
      return order[sa] - order[sb];
    });
  }, [activePlayers, selectedMonth, getMonthStatus]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const isCurrentMonth = selectedMonth === currentMonth();
  const isLoading = playersLoading || duesLoading;

  const handleExpand = (playerId: string) => {
    if (expandedId === playerId) {
      setExpandedId(null);
    } else {
      setExpandedId(playerId);
      setPayAmount(String(DEFAULT_DUES_AMOUNT));
      setPayNotes("");
    }
  };

  const handleMarkPaid = async (playerId: string) => {
    setSaving(playerId);
    const amt = parseFloat(payAmount) || DEFAULT_DUES_AMOUNT;
    await markPaid(playerId, selectedMonth, amt, payNotes.trim() || undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(null);
    setExpandedId(null);
  };

  const handleMarkOverdue = async (playerId: string) => {
    setSaving(playerId);
    await markOverdue(playerId, selectedMonth);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setSaving(null);
    setExpandedId(null);
  };

  const handleMarkPending = async (playerId: string) => {
    setSaving(playerId);
    await markPending(playerId, selectedMonth);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(null);
    setExpandedId(null);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.navBar, paddingTop: topPad + 16 }]}>
        <Text style={styles.headerTitle}>Dues Tracker</Text>
        <Text style={styles.headerSub}>Monthly membership fees</Text>

        {/* Month navigation */}
        <View style={styles.monthNav}>
          <Pressable onPress={() => setSelectedMonth(prevMonth(selectedMonth))} style={styles.monthArrow}>
            <Feather name="chevron-left" size={20} color="#FFF" />
          </Pressable>
          <View style={styles.monthLabelWrap}>
            <Text style={styles.monthLabel}>{monthLabel(selectedMonth)}</Text>
            {isCurrentMonth && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>CURRENT</Text>
              </View>
            )}
          </View>
          <Pressable
            onPress={() => setSelectedMonth(nextMonth(selectedMonth))}
            disabled={isCurrentMonth}
            style={[styles.monthArrow, isCurrentMonth && { opacity: 0.3 }]}
          >
            <Feather name="chevron-right" size={20} color="#FFF" />
          </Pressable>
        </View>

        {/* Summary row */}
        <View style={styles.summaryRow}>
          {(["paid", "overdue", "pending"] as DuesStatus[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const count = summary[s];
            return (
              <View key={s} style={[styles.summaryCard, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
                <Feather name={cfg.icon} size={14} color={cfg.color} />
                <Text style={[styles.summaryCount, { color: cfg.color }]}>{count}</Text>
                <Text style={styles.summaryLabel}>{cfg.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : activePlayers.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="users" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No active players yet. Add players from the Players tab.
          </Text>
          <Pressable onPress={() => router.push("/add-player")}
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.emptyBtnText}>Add Player</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 90 }]}
        >
          <Text style={[styles.listHeader, { color: colors.mutedForeground }]}>
            {activePlayers.length} ACTIVE PLAYERS
          </Text>

          {sortedPlayers.map((player) => {
            const status = getMonthStatus(player.id, selectedMonth);
            const record = getMonthRecord(player.id, selectedMonth);
            const cfg = STATUS_CONFIG[status];
            const isExpanded = expandedId === player.id;
            const isSaving = saving === player.id;

            return (
              <View key={player.id} style={[styles.playerCard, { backgroundColor: colors.card, borderColor: status === "overdue" ? "#FCA5A5" : colors.border }]}>
                <Pressable onPress={() => handleExpand(player.id)} style={styles.playerRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.navBar }]}>
                    <Text style={styles.avatarText}>
                      {player.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, { color: colors.foreground }]} numberOfLines={1}>
                      {player.name}
                    </Text>
                    <Text style={[styles.playerBelt, { color: colors.mutedForeground }]}>
                      {player.belt_rank}
                    </Text>
                    {status === "paid" && record?.paidDate && (
                      <Text style={[styles.paidInfo, { color: "#10B981" }]}>
                        ₱{record.amount.toLocaleString()} · Paid {fmtDate(record.paidDate)}
                      </Text>
                    )}
                    {record?.notes ? (
                      <Text style={[styles.notesText, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {record.notes}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.statusWrap}>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Feather name={cfg.icon} size={11} color={cfg.color} />
                      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} style={{ marginTop: 4 }} />
                  </View>
                </Pressable>

                {/* Expanded actions */}
                {isExpanded && (
                  <View style={[styles.actions, { borderTopColor: colors.border }]}>
                    {status !== "paid" && (
                      <>
                        <View style={styles.payFields}>
                          <View style={styles.amountWrap}>
                            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>AMOUNT (₱)</Text>
                            <TextInput
                              style={[styles.fieldInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                              value={payAmount}
                              onChangeText={setPayAmount}
                              keyboardType="decimal-pad"
                              placeholder="500"
                              placeholderTextColor={colors.mutedForeground}
                            />
                          </View>
                          <View style={styles.notesWrap}>
                            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NOTES</Text>
                            <TextInput
                              style={[styles.fieldInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                              value={payNotes}
                              onChangeText={setPayNotes}
                              placeholder="Optional"
                              placeholderTextColor={colors.mutedForeground}
                            />
                          </View>
                        </View>
                        <Pressable
                          onPress={() => handleMarkPaid(player.id)}
                          disabled={isSaving}
                          style={({ pressed }) => [styles.actionBtn, { backgroundColor: "#10B981", opacity: pressed || isSaving ? 0.8 : 1 }]}
                        >
                          {isSaving ? <ActivityIndicator color="#FFF" size="small" /> : (
                            <>
                              <Feather name="check-circle" size={14} color="#FFF" />
                              <Text style={styles.actionBtnText}>Mark as PAID</Text>
                            </>
                          )}
                        </Pressable>
                      </>
                    )}

                    <View style={styles.secondaryActions}>
                      {status !== "overdue" && (
                        <Pressable
                          onPress={() => handleMarkOverdue(player.id)}
                          disabled={isSaving}
                          style={({ pressed }) => [styles.actionBtnSm, { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5", opacity: pressed || isSaving ? 0.8 : 1 }]}
                        >
                          <Feather name="alert-circle" size={13} color="#EF4444" />
                          <Text style={[styles.actionBtnSmText, { color: "#EF4444" }]}>Mark Overdue</Text>
                        </Pressable>
                      )}
                      {status !== "pending" && (
                        <Pressable
                          onPress={() => handleMarkPending(player.id)}
                          disabled={isSaving}
                          style={({ pressed }) => [styles.actionBtnSm, { backgroundColor: "#FEF3C7", borderColor: "#FCD34D", opacity: pressed || isSaving ? 0.8 : 1 }]}
                        >
                          <Feather name="clock" size={13} color="#D97706" />
                          <Text style={[styles.actionBtnSmText, { color: "#D97706" }]}>Reset to Pending</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  headerTitle: { color: "#FFF", fontSize: 28, fontFamily: "Inter_700Bold" },
  headerSub: { color: "#9CA3AF", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -8 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthArrow: { padding: 8 },
  monthLabelWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  monthLabel: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  currentBadge: { backgroundColor: "#D32F2F", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  currentBadgeText: { color: "#FFF", fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryCard: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center", gap: 4 },
  summaryCount: { fontSize: 22, fontFamily: "Inter_700Bold" },
  summaryLabel: { color: "#9CA3AF", fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  list: { paddingTop: 12, paddingHorizontal: 16, gap: 10 },
  listHeader: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 4 },
  playerCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  playerRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: 15, fontFamily: "Inter_700Bold" },
  playerInfo: { flex: 1, gap: 2 },
  playerName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  playerBelt: { fontSize: 12, fontFamily: "Inter_400Regular" },
  paidInfo: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  notesText: { fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  statusWrap: { alignItems: "flex-end", gap: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  actions: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  payFields: { flexDirection: "row", gap: 10 },
  amountWrap: { flex: 1, gap: 4 },
  notesWrap: { flex: 2, gap: 4 },
  fieldLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  fieldInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, fontFamily: "Inter_400Regular" },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, paddingVertical: 11 },
  actionBtnText: { color: "#FFF", fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  secondaryActions: { flexDirection: "row", gap: 8 },
  actionBtnSm: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 8, paddingVertical: 8, borderWidth: 1 },
  actionBtnSmText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  emptyBtnText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
