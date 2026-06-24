import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { UserRole } from "@/types";
import { PasswordInput } from "@/components/PasswordInput";

const ROLES: Array<{ label: string; desc: string; value: UserRole }> = [
  { label: "Sensei", desc: "Head instructor with full access", value: "sensei" },
  { label: "Senpai", desc: "Senior student / assistant instructor", value: "senpai" },
  { label: "Coach", desc: "Specialist coach (Boxing, Arnis, etc.)", value: "coach" },
];

export default function RegisterInstructorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("senpai");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await register(name.trim(), email.trim(), password, role);
    setLoading(false);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/players");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? "Registration failed.");
    }
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.navBar, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Feather name="arrow-left" size={22} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Staff Registration</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account Info</Text>
          <Label label="FULL NAME *" colors={colors} />
          <TextInput style={[styles.input, iStyle(colors)]} value={name} onChangeText={setName} placeholder="e.g. Coach Reyes" placeholderTextColor={colors.mutedForeground} />
          <Label label="EMAIL *" colors={colors} />
          <TextInput style={[styles.input, iStyle(colors)]} value={email} onChangeText={setEmail} placeholder="coach@kagayan.com" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" keyboardType="email-address" />
          <Label label="PASSWORD *" colors={colors} />
          <PasswordInput style={[styles.input, iStyle(colors)]} value={password} onChangeText={setPassword} placeholder="Min. 6 characters" placeholderTextColor={colors.mutedForeground} />
          <Label label="CONFIRM PASSWORD *" colors={colors} />
          <PasswordInput style={[styles.input, iStyle(colors)]} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" placeholderTextColor={colors.mutedForeground} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Role</Text>
          {ROLES.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => setRole(r.value)}
              style={[styles.roleOption, { borderColor: role === r.value ? colors.primary : colors.border, backgroundColor: role === r.value ? colors.primary + "10" : colors.background }]}
            >
              <View style={[styles.radio, { borderColor: role === r.value ? colors.primary : colors.border }]}>
                {role === r.value && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.roleLabel, { color: colors.foreground }]}>{r.label}</Text>
                <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{r.desc}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          style={({ pressed }) => [styles.registerBtn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.8 : 1 }]}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Label({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, color: colors.mutedForeground, marginTop: 4 }}>{label}</Text>;
}
function iStyle(colors: ReturnType<typeof useColors>) {
  return { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background };
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { color: "#FFF", fontSize: 17, fontFamily: "Inter_700Bold" },
  form: { padding: 16, gap: 14 },
  errorBox: { backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12 },
  errorText: { color: "#991B1B", fontSize: 13, fontFamily: "Inter_500Medium" },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular" },
  roleOption: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderWidth: 1.5, borderRadius: 10, padding: 14 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 2 },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  roleLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  roleDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  registerBtn: { borderRadius: 12, paddingVertical: 15, alignItems: "center", justifyContent: "center", marginTop: 4 },
  registerBtnText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
});
