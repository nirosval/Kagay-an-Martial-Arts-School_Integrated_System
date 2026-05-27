import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { usePlayers } from "@/context/PlayersContext";
import { useColors } from "@/hooks/useColors";

const dojoLogo = require("../assets/images/logo.png");

type PortalMode = "instructor" | "player";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { players } = usePlayers();

  const [mode, setMode] = useState<PortalMode>("instructor");

  // Instructor
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Player
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerError, setPlayerError] = useState("");

  const handleInstructorLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your credentials.");
      return;
    }
    setLoading(true);
    setError("");
    const success = await login(email.trim(), password);
    setLoading(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/players");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Invalid email or password. Please try again.");
    }
  };

  const handlePlayerLookup = () => {
    const query = playerSearch.trim().toLowerCase();
    if (!query) {
      setPlayerError("Please enter your name to look up your profile.");
      return;
    }
    const found = players.find((p) =>
      p.name.toLowerCase().includes(query)
    );
    if (!found) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPlayerError("No player found with that name. Ask your instructor to add your profile.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push(`/player-portal/${found.id}`);
  };

  const switchMode = (next: PortalMode) => {
    setMode(next);
    setError("");
    setPlayerError("");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navBar }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <View
          style={[
            styles.container,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <View style={styles.header}>
            <Image source={dojoLogo} style={styles.logoImage} resizeMode="contain" />
            <View style={[styles.divider, { backgroundColor: colors.primary }]} />
            <Text style={[styles.portalLabel, { color: colors.primary }]}>
              {mode === "instructor" ? "INSTRUCTOR PORTAL" : "PLAYER PORTAL"}
            </Text>
          </View>

          {/* Portal toggle */}
          <View style={[styles.toggle, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
            <Pressable
              onPress={() => switchMode("instructor")}
              style={[
                styles.toggleOption,
                mode === "instructor" && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: mode === "instructor" ? "#FFF" : "#9CA3AF" },
                ]}
              >
                Instructor
              </Text>
            </Pressable>
            <Pressable
              onPress={() => switchMode("player")}
              style={[
                styles.toggleOption,
                mode === "player" && { backgroundColor: colors.accent },
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: mode === "player" ? "#FFF" : "#9CA3AF" },
                ]}
              >
                Player
              </Text>
            </Pressable>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {mode === "instructor" ? (
              <>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sign In</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  Access restricted to Sensei &amp; Senpai
                </Text>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>EMAIL</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="instructor@kagayan.com"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PASSWORD</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry
                  />
                </View>

                {error ? (
                  <View style={[styles.errorBox, { backgroundColor: "#FEE2E2" }]}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={handleInstructorLogin}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { backgroundColor: colors.primary, opacity: pressed || loading ? 0.8 : 1 },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.actionBtnText}>SIGN IN</Text>
                  )}
                </Pressable>

                <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                  Demo: sensei@kagayan.com / sensei123
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>View My Profile</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  Enter your name to find your profile
                </Text>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>YOUR NAME</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                    value={playerSearch}
                    onChangeText={(t) => { setPlayerSearch(t); setPlayerError(""); }}
                    placeholder="e.g. Carlos"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="words"
                    returnKeyType="search"
                    onSubmitEditing={handlePlayerLookup}
                  />
                </View>

                {playerError ? (
                  <View style={[styles.errorBox, { backgroundColor: "#FEE2E2" }]}>
                    <Text style={styles.errorText}>{playerError}</Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={handlePlayerLookup}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={styles.actionBtnText}>FIND MY PROFILE</Text>
                </Pressable>

                <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                  Demo: try "Carlos" or "Maria"
                </Text>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 6,
  },
  logoImage: {
    width: 260,
    height: 260,
  },
  divider: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginVertical: 6,
  },
  portalLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  toggle: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  cardSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: "#991B1B",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  hintText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
