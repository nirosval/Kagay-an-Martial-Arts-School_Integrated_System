import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { AdminAccount, PlayerAccount } from "@/types";

const ADMIN_ACCOUNTS_KEY = "kagayan_admin_accounts";
const PLAYER_ACCOUNTS_KEY = "kagayan_player_accounts";

const DEFAULT_ADMINS: AdminAccount[] = [
  { id: "1", email: "sensei@kagayan.com", password: "sensei123", name: "Sensei Rivera", role: "sensei" },
  { id: "2", email: "senpai@kagayan.com", password: "senpai123", name: "Senpai Santos", role: "senpai" },
];

type Step = "email" | "reset" | "done";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { portal } = useLocalSearchParams<{ portal?: string }>();
  const isPlayer = portal === "player";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [foundName, setFoundName] = useState("");

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleFindAccount = async () => {
    if (!email.trim()) { setError("Please enter your email."); return; }
    setLoading(true);
    setError("");
    const emailLower = email.trim().toLowerCase();
    if (isPlayer) {
      const stored = await AsyncStorage.getItem(PLAYER_ACCOUNTS_KEY);
      const list: PlayerAccount[] = stored ? JSON.parse(stored) : [];
      const found = list.find((a) => a.email === emailLower);
      if (!found) {
        setError("No player account found with that email.");
        setLoading(false);
        return;
      }
      setFoundName(emailLower);
    } else {
      const stored = await AsyncStorage.getItem(ADMIN_ACCOUNTS_KEY);
      const list: AdminAccount[] = stored ? JSON.parse(stored) : DEFAULT_ADMINS;
      const found = list.find((a) => a.email === emailLower);
      if (!found) {
        setError("No instructor account found with that email.");
        setLoading(false);
        return;
      }
      setFoundName(found.name);
    }
    setLoading(false);
    setStep("reset");
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) { setError("Please fill in all fields."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");
    const emailLower = email.trim().toLowerCase();
    if (isPlayer) {
      const stored = await AsyncStorage.getItem(PLAYER_ACCOUNTS_KEY);
      const list: PlayerAccount[] = stored ? JSON.parse(stored) : [];
      const updated = list.map((a) => a.email === emailLower ? { ...a, password: newPassword } : a);
      await AsyncStorage.setItem(PLAYER_ACCOUNTS_KEY, JSON.stringify(updated));
    } else {
      const stored = await AsyncStorage.getItem(ADMIN_ACCOUNTS_KEY);
      const list: AdminAccount[] = stored ? JSON.parse(stored) : DEFAULT_ADMINS;
      const updated = list.map((a) => a.email === emailLower ? { ...a, password: newPassword } : a);
      await AsyncStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(updated));
    }
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep("done");
  };

  const accentColor = isPlayer ? colors.accent : colors.primary;

  return (
    <View style={[styles.root, { backgroundColor: colors.navBar }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.container, { paddingTop: topPad + 24, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Back */}
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <Feather name="arrow-left" size={20} color="#FFF" />
            <Text style={styles.backLabel}>Back to Sign In</Text>
          </Pressable>

          {/* Header */}
          <View style={styles.headerBlock}>
            <View style={[styles.lockIcon, { backgroundColor: accentColor + "22" }]}>
              <Feather name="lock" size={28} color={accentColor} />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {isPlayer ? "Player Portal" : "Instructor Portal"}
            </Text>
          </View>

          {/* Step: email */}
          {step === "email" && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Find Your Account</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                Enter the email address linked to your account.
              </Text>

              <Text style={[styles.label, { color: colors.mutedForeground }]}>EMAIL</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

              <Pressable onPress={handleFindAccount} disabled={loading}
                style={({ pressed }) => [styles.btn, { backgroundColor: accentColor, opacity: pressed || loading ? 0.8 : 1 }]}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>FIND ACCOUNT</Text>}
              </Pressable>
            </View>
          )}

          {/* Step: reset */}
          {step === "reset" && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.foundBadge, { backgroundColor: "#D1FAE5" }]}>
                <Feather name="check-circle" size={16} color="#065F46" />
                <Text style={styles.foundText}>Account found{foundName ? ` — ${foundName}` : ""}</Text>
              </View>

              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Set New Password</Text>

              <Text style={[styles.label, { color: colors.mutedForeground }]}>NEW PASSWORD</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
              />
              <Text style={[styles.label, { color: colors.mutedForeground }]}>CONFIRM PASSWORD</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
              />

              {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

              <Pressable onPress={handleResetPassword} disabled={loading}
                style={({ pressed }) => [styles.btn, { backgroundColor: accentColor, opacity: pressed || loading ? 0.8 : 1 }]}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>RESET PASSWORD</Text>}
              </Pressable>
            </View>
          )}

          {/* Step: done */}
          {step === "done" && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.successBlock}>
                <View style={[styles.lockIcon, { backgroundColor: "#D1FAE5" }]}>
                  <Feather name="check" size={28} color="#059669" />
                </View>
                <Text style={[styles.cardTitle, { color: colors.foreground, textAlign: "center" }]}>
                  Password Reset!
                </Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground, textAlign: "center" }]}>
                  Your password has been updated. You can now sign in with your new password.
                </Text>
              </View>
              <Pressable onPress={() => router.replace("/login")}
                style={({ pressed }) => [styles.btn, { backgroundColor: accentColor, opacity: pressed ? 0.8 : 1 }]}>
                <Text style={styles.btnText}>BACK TO SIGN IN</Text>
              </Pressable>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingHorizontal: 24, gap: 20 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  backLabel: { color: "#FFF", fontSize: 15, fontFamily: "Inter_500Medium" },
  headerBlock: { alignItems: "center", gap: 8, paddingVertical: 8 },
  lockIcon: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  title: { color: "#FFF", fontSize: 24, fontFamily: "Inter_700Bold" },
  subtitle: { color: "#9CA3AF", fontSize: 13, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 16, borderWidth: 1, padding: 24, gap: 14 },
  cardTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  cardSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -6, lineHeight: 20 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  errorBox: { backgroundColor: "#FEE2E2", borderRadius: 8, padding: 12 },
  errorText: { color: "#991B1B", fontSize: 13, fontFamily: "Inter_500Medium" },
  btn: { borderRadius: 10, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  foundBadge: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 8, padding: 10 },
  foundText: { color: "#065F46", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  successBlock: { alignItems: "center", gap: 12, paddingVertical: 8 },
});
