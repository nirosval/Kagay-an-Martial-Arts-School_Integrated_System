import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
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
            <View style={[styles.logoMark, { borderColor: colors.primary }]}>
              <Text style={[styles.logoLetter, { color: colors.primary }]}>K</Text>
            </View>
            <Text style={styles.dojo}>KAGAY-AN</Text>
            <Text style={styles.subtitle}>MARTIAL ARTS SCHOOL</Text>
            <View style={[styles.divider, { backgroundColor: colors.primary }]} />
            <Text style={[styles.portalLabel, { color: colors.primary }]}>
              INSTRUCTOR PORTAL
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Sign In
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Access restricted to Sensei & Senpai
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                EMAIL
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background },
                ]}
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
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                PASSWORD
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background },
                ]}
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
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.loginBtn,
                { backgroundColor: colors.primary, opacity: pressed || loading ? 0.8 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginBtnText}>SIGN IN</Text>
              )}
            </Pressable>

            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              Demo: sensei@kagayan.com / sensei123
            </Text>
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
    gap: 32,
  },
  header: {
    alignItems: "center",
    gap: 6,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoLetter: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
  },
  dojo: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
  },
  divider: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginVertical: 8,
  },
  portalLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
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
  loginBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  loginBtnText: {
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
