import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, updateBirthdate } = useAuth();

  const [editingBirthdate, setEditingBirthdate] = useState(false);
  const [bdInput, setBdInput] = useState(user?.birthdate ?? "");
  const [bdSaving, setBdSaving] = useState(false);
  const [bdError, setBdError] = useState("");

  const handleLogout = () => {
    if (Platform.OS === "web") {
      logout().then(() => router.replace("/login"));
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleSaveBirthdate = async () => {
    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!pattern.test(bdInput)) {
      setBdError("Use format YYYY-MM-DD (e.g. 1990-03-15)");
      return;
    }
    setBdSaving(true);
    setBdError("");
    await updateBirthdate(bdInput);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBdSaving(false);
    setEditingBirthdate(false);
  };

  const roleLabel = user?.role === "sensei" ? "Sensei" : user?.role === "senpai" ? "Senpai" : "Coach";
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.navBar, paddingTop: topPadding + 16 }]}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.navBar }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileRole}>{roleLabel} · {user?.email}</Text>
          </View>
        </View>

        {/* Birthday Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>BIRTHDAY</Text>
          {!editingBirthdate ? (
            <View style={styles.row}>
              <Feather name="gift" size={18} color="#F59E0B" />
              <Text style={[styles.rowText, { color: colors.foreground, flex: 1 }]}>
                {user?.birthdate ? user.birthdate : "Not set"}
              </Text>
              <Pressable onPress={() => { setBdInput(user?.birthdate ?? ""); setEditingBirthdate(true); }}>
                <Text style={[styles.editLink, { color: colors.accent }]}>Edit</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                value={bdInput}
                onChangeText={setBdInput}
                keyboardType="numeric"
                maxLength={10}
              />
              {!!bdError && <Text style={styles.errText}>{bdError}</Text>}
              <View style={styles.bdBtnRow}>
                <Pressable
                  onPress={() => setEditingBirthdate(false)}
                  style={({ pressed }) => [styles.cancelBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveBirthdate}
                  disabled={bdSaving}
                  style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, opacity: pressed || bdSaving ? 0.8 : 1 }]}
                >
                  <Text style={styles.saveBtnText}>{bdSaving ? "Saving..." : "Save"}</Text>
                </Pressable>
              </View>
              <Text style={[styles.bdHint, { color: colors.mutedForeground }]}>
                Your birthday will appear in the dojo's Birthday celebration!
              </Text>
            </View>
          )}
        </View>

        {/* About Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ABOUT</Text>
          <View style={styles.row}>
            <Feather name="shield" size={18} color={colors.accent} />
            <Text style={[styles.rowText, { color: colors.foreground }]}>Kagay-an Martial Arts School</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Feather name="info" size={18} color={colors.mutedForeground} />
            <Text style={[styles.rowText, { color: colors.foreground }]}>Version 1.0.0</Text>
          </View>
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
        >
          <Feather name="log-out" size={18} color="#FFF" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { color: "#FFFFFF", fontSize: 28, fontFamily: "Inter_700Bold" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  profileCard: { borderRadius: 14, padding: 20, flexDirection: "row", alignItems: "center", gap: 16 },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#D32F2F", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: 20, fontFamily: "Inter_700Bold" },
  profileInfo: { flex: 1 },
  profileName: { color: "#FFFFFF", fontSize: 17, fontFamily: "Inter_700Bold" },
  profileRole: { color: "#9CA3AF", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  editLink: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  errText: { color: "#EF4444", fontSize: 12, fontFamily: "Inter_500Medium" },
  bdBtnRow: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  saveBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  saveBtnText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bdHint: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  separator: { height: 1 },
  logoutBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  logoutText: { color: "#FFF", fontSize: 15, fontFamily: "Inter_700Bold" },
});
