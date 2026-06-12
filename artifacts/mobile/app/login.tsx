import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { useAuth } from "@/context/AuthContext";
import { usePlayerAuth } from "@/context/PlayerAuthContext";
import { useColors } from "@/hooks/useColors";

const dojoLogo = require("../assets/images/logo.png");

type PortalMode = "instructor" | "player";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { playerLogin } = usePlayerAuth();

  const [mode, setMode] = useState<PortalMode>("instructor");

  const [iEmail, setIEmail] = useState("");
  const [iPassword, setIPassword] = useState("");
  const [iError, setIError] = useState("");
  const [iLoading, setILoading] = useState(false);

  const [pEmail, setPEmail] = useState("");
  const [pPassword, setPPassword] = useState("");
  const [pError, setPError] = useState("");
  const [pLoading, setPLoading] = useState(false);

  const switchMode = (next: PortalMode) => {
    setMode(next);
    setIError("");
    setPError("");
  };

  const handleInstructorLogin = async () => {
    if (!iEmail.trim() || !iPassword.trim()) {
      setIError("Please enter your credentials.");
      return;
    }
    setILoading(true);
    setIError("");
    const success = await login(iEmail.trim(), iPassword);
    setILoading(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/players");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIError("Invalid email or password.");
    }
  };

  const handlePlayerLogin = async () => {
    if (!pEmail.trim() || !pPassword.trim()) {
      setPError("Please enter your credentials.");
      return;
    }
    setPLoading(true);
    setPError("");
    const result = await playerLogin(pEmail.trim(), pPassword);
    setPLoading(false);
    if (result.success && result.playerId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/player-portal/${result.playerId}`);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPError(result.error ?? "Login failed.");
    }
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.navBar }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.kav}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.header}>
            <Image source={dojoLogo} style={styles.logoImage} resizeMode="contain" />
            <View style={[styles.divider, { backgroundColor: colors.primary }]} />
            <Text style={[styles.portalLabel, { color: colors.primary }]}>
              {mode === "instructor" ? "INSTRUCTOR PORTAL" : "PLAYER PORTAL"}
            </Text>
          </View>

          {/* Toggle */}
          <View style={[styles.toggle, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
            <Pressable
              onPress={() => switchMode("instructor")}
              style={[styles.toggleOption, mode === "instructor" && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.toggleText, { color: mode === "instructor" ? "#FFF" : "#9CA3AF" }]}>
                Instructor
              </Text>
            </Pressable>
            <Pressable
              onPress={() => switchMode("player")}
              style={[styles.toggleOption, mode === "player" && { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.toggleText, { color: mode === "player" ? "#FFF" : "#9CA3AF" }]}>
                Player
              </Text>
            </Pressable>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {mode === "instructor" ? (
              <>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sign In</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Sensei &amp; Senpai access</Text>

                <FieldLabel label="EMAIL" color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  value={iEmail} onChangeText={setIEmail}
                  placeholder="instructor@kagayan.com" placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none" keyboardType="email-address"
                />
                <FieldLabel label="PASSWORD" color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  value={iPassword} onChangeText={setIPassword}
                  placeholder="••••••••" placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                />

                {iError ? <ErrorBox msg={iError} /> : null}

                <Pressable onPress={handleInstructorLogin} disabled={iLoading}
                  style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary, opacity: pressed || iLoading ? 0.8 : 1 }]}>
                  {iLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>SIGN IN</Text>}
                </Pressable>

                <View style={styles.footerLinks}>
                  <Pressable onPress={() => router.push({ pathname: "/forgot-password", params: { portal: "instructor" } })}>
                    <Text style={[styles.linkSmall, { color: colors.mutedForeground }]}>
                      Forgot password? <Text style={{ color: colors.primary }}>Reset</Text>
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => router.push("/register/instructor")}>
                    <Text style={[styles.linkSmall, { color: colors.mutedForeground }]}>
                      New instructor? <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Register here</Text>
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Player Sign In</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>View &amp; manage your profile</Text>

                <FieldLabel label="EMAIL" color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  value={pEmail} onChangeText={setPEmail}
                  placeholder="player@email.com" placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none" keyboardType="email-address"
                />
                <FieldLabel label="PASSWORD" color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  value={pPassword} onChangeText={setPPassword}
                  placeholder="••••••••" placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                />

                {pError ? <ErrorBox msg={pError} /> : null}

                <Pressable onPress={handlePlayerLogin} disabled={pLoading}
                  style={({ pressed }) => [styles.btn, { backgroundColor: colors.accent, opacity: pressed || pLoading ? 0.8 : 1 }]}>
                  {pLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>SIGN IN</Text>}
                </Pressable>

                <View style={styles.footerLinks}>
                  <Pressable onPress={() => router.push({ pathname: "/forgot-password", params: { portal: "player" } })}>
                    <Text style={[styles.linkSmall, { color: colors.mutedForeground }]}>
                      Forgot password? <Text style={{ color: colors.accent }}>Reset</Text>
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => router.push("/register/player")}>
                    <Text style={[styles.linkSmall, { color: colors.mutedForeground }]}>
                      New player? <Text style={{ color: colors.accent, fontFamily: "Inter_600SemiBold" }}>Register here</Text>
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FieldLabel({ label, color }: { label: string; color: string }) {
  return <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, color }}>{label}</Text>;
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <View style={{ backgroundColor: "#FEE2E2", borderRadius: 8, padding: 12 }}>
      <Text style={{ color: "#991B1B", fontSize: 13, fontFamily: "Inter_500Medium" }}>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  container: { paddingHorizontal: 24, gap: 20, flexGrow: 1, justifyContent: "center" },
  header: { alignItems: "center", gap: 6 },
  logoImage: { width: 160, height: 160 },
  divider: { width: 40, height: 3, borderRadius: 2, marginVertical: 6 },
  portalLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  toggle: { flexDirection: "row", borderRadius: 12, padding: 4, gap: 4 },
  toggleOption: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
  toggleText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 16, borderWidth: 1, padding: 24, gap: 12 },
  cardTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  cardSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  btn: { borderRadius: 10, paddingVertical: 14, alignItems: "center", justifyContent: "center", marginTop: 2 },
  btnText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  footerLinks: { gap: 8, alignItems: "center" },
  linkSmall: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
