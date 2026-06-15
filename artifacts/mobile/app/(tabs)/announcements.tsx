import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { useAnnouncements } from "@/context/AnnouncementsContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { AnnouncementCategory } from "@/types";

const CATEGORIES: { key: AnnouncementCategory; label: string; icon: string; color: string }[] = [
  { key: "tournament", label: "Tournament", icon: "award", color: "#D32F2F" },
  { key: "belt_promotion", label: "Belt Promotion", icon: "star", color: "#F59E0B" },
  { key: "general", label: "General", icon: "bell", color: "#1E40AF" },
];

function catInfo(cat: AnnouncementCategory) {
  return CATEGORIES.find((c) => c.key === cat) ?? CATEGORIES[2];
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AnnouncementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { announcements, addAnnouncement, deleteAnnouncement } = useAnnouncements();

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<AnnouncementCategory>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const resetForm = () => {
    setTitle(""); setBody(""); setVenue(""); setEventDate("");
    setCategory("general"); setFormError(""); setShowForm(false);
  };

  const handleSave = async () => {
    if (!title.trim()) { setFormError("Title is required."); return; }
    if (!body.trim()) { setFormError("Message is required."); return; }
    if (!user) return;
    setSaving(true);
    await addAnnouncement(
      category, title.trim(), body.trim(),
      user.name, user.role,
      venue.trim() || undefined,
      eventDate.trim() || undefined
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    resetForm();
  };

  const handleDelete = (id: string, ttl: string) => {
    if (Platform.OS === "web") { deleteAnnouncement(id); return; }
    Alert.alert("Delete Announcement", `Remove "${ttl}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteAnnouncement(id) },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.navBar, paddingTop: topPadding + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Announcements</Text>
            <Text style={styles.headerSub}>Tournaments · Belt Promotions · News</Text>
          </View>
          <Pressable
            onPress={() => setShowForm((v) => !v)}
            style={({ pressed }) => [styles.newBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Feather name={showForm ? "x" : "plus"} size={18} color="#FFF" />
            <Text style={styles.newBtnText}>{showForm ? "Cancel" : "New"}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Create Form */}
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>New Announcement</Text>

            {/* Category picker */}
            <View style={styles.catRow}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  style={[styles.catChip, { borderColor: category === c.key ? c.color : colors.border, backgroundColor: category === c.key ? c.color + "18" : "transparent" }]}
                >
                  <Feather name={c.icon as any} size={13} color={category === c.key ? c.color : colors.mutedForeground} />
                  <Text style={[styles.catChipText, { color: category === c.key ? c.color : colors.mutedForeground }]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Title *"
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.inputMulti, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Message / Details *"
              placeholderTextColor={colors.mutedForeground}
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={3}
            />
            {(category === "tournament" || category === "belt_promotion") && (
              <>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Venue (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={venue}
                  onChangeText={setVenue}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Event Date (YYYY-MM-DD, optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={eventDate}
                  onChangeText={setEventDate}
                />
              </>
            )}
            {!!formError && <Text style={styles.errText}>{formError}</Text>}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, opacity: pressed || saving ? 0.8 : 1 }]}
            >
              <Feather name="send" size={16} color="#FFF" />
              <Text style={styles.saveBtnText}>{saving ? "Posting..." : "Post Announcement"}</Text>
            </Pressable>
          </View>
        )}

        {/* Announcements List */}
        {announcements.length === 0 && !showForm && (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Feather name="bell-off" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Announcements Yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Tap "New" to post a tournament, belt promotion, or general notice.
            </Text>
          </View>
        )}

        {announcements.map((ann) => {
          const cat = catInfo(ann.category);
          return (
            <View key={ann.id} style={[styles.annCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: cat.color }]}>
              <View style={styles.annHeader}>
                <View style={[styles.annBadge, { backgroundColor: cat.color + "20" }]}>
                  <Feather name={cat.icon as any} size={12} color={cat.color} />
                  <Text style={[styles.annBadgeText, { color: cat.color }]}>{cat.label}</Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(ann.id, ann.title)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
                >
                  <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                </Pressable>
              </View>
              <Text style={[styles.annTitle, { color: colors.foreground }]}>{ann.title}</Text>
              <Text style={[styles.annBody, { color: colors.mutedForeground }]}>{ann.body}</Text>
              {(ann.venue || ann.eventDate) && (
                <View style={[styles.annMetaRow, { borderTopColor: colors.border }]}>
                  {ann.venue && (
                    <View style={styles.annMeta}>
                      <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.annMetaText, { color: colors.mutedForeground }]}>{ann.venue}</Text>
                    </View>
                  )}
                  {ann.eventDate && (
                    <View style={styles.annMeta}>
                      <Feather name="calendar" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.annMetaText, { color: colors.mutedForeground }]}>{fmtDate(ann.eventDate + "T00:00:00")}</Text>
                    </View>
                  )}
                </View>
              )}
              <Text style={[styles.annFooter, { color: colors.mutedForeground }]}>
                Posted by {ann.createdBy} · {fmtDate(ann.createdAt)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginTop: 4 },
  headerTitle: { color: "#FFF", fontSize: 28, fontFamily: "Inter_700Bold" },
  headerSub: { color: "#9CA3AF", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#D32F2F", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  newBtnText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14 },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  formTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  catChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
  errText: { color: "#EF4444", fontSize: 12, fontFamily: "Inter_500Medium" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, paddingVertical: 12 },
  saveBtnText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyBox: { borderWidth: 1, borderRadius: 14, borderStyle: "dashed", padding: 40, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  annCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, gap: 8 },
  annHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  annBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  annBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  annTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  annBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  annMetaRow: { borderTopWidth: 1, paddingTop: 8, gap: 6 },
  annMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  annMetaText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  annFooter: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
