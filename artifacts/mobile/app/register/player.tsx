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
import { usePlayerAuth } from "@/context/PlayerAuthContext";
import { usePlayers } from "@/context/PlayersContext";
import { useColors } from "@/hooks/useColors";
import { MembershipStatus, PlayerAccount } from "@/types";
import { PasswordInput } from "@/components/PasswordInput";

const BELT_RANKS = [
  "White Belt", "Yellow Belt", "Orange Belt", "Green Belt",
  "Blue Belt", "Purple Belt", "Brown Belt", "Black Belt",
];

const MEMBERSHIP_OPTIONS: Array<{ label: string; value: MembershipStatus }> = [
  { label: "Active Member", value: "active_member" },
  { label: "Active (Non-Member)", value: "active_nonmember" },
  { label: "Inactive", value: "inactive" },
];

export default function RegisterPlayerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addPlayerAccount, playerAccounts } = usePlayerAuth();
  const { addPlayer } = usePlayers();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [yearStarted, setYearStarted] = useState(String(new Date().getFullYear()));
  const [beltRank, setBeltRank] = useState("White Belt");
  const [membership, setMembership] = useState<MembershipStatus>("active_member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !birthdate.trim()) {
      setError("Name, email, birthdate, and password are required.");
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
    const wt = parseFloat(weightKg);
    const ht = parseFloat(heightCm);
    const yr = parseInt(yearStarted, 10);
    if (isNaN(wt) || isNaN(ht) || isNaN(yr)) {
      setError("Please fill in all physical stats correctly.");
      return;
    }
    const emailLower = email.trim().toLowerCase();
    if (playerAccounts.find((a) => a.email === emailLower)) {
      setError("An account with this email already exists.");
      return;
    }

    setLoading(true);
    setError("");

    const newPlayer = await addPlayer({
      name: name.trim(),
      birthdate: birthdate.trim(),
      weight_kg: wt,
      height_cm: ht,
      year_started: yr,
      belt_rank: beltRank,
      membership_status: membership,
      photo_url: null,
    });

    const account: PlayerAccount = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      email: emailLower,
      password,
      playerId: newPlayer.id,
    };

    await addPlayerAccount(account);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(false);
    router.replace(`/player-portal/${newPlayer.id}`);
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.navBar, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Feather name="arrow-left" size={22} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Player Registration</Text>
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

        {/* Account info */}
        <Section title="Account Info" colors={colors}>
          <FieldLabel label="FULL NAME *" colors={colors} />
          <TextInput style={[styles.input, inputStyle(colors)]} value={name} onChangeText={setName} placeholder="Juan dela Cruz" placeholderTextColor={colors.mutedForeground} />
          <FieldLabel label="EMAIL *" colors={colors} />
          <TextInput style={[styles.input, inputStyle(colors)]} value={email} onChangeText={setEmail} placeholder="player@email.com" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" keyboardType="email-address" />
          <FieldLabel label="PASSWORD *" colors={colors} />
          <PasswordInput style={[styles.input, inputStyle(colors)]} value={password} onChangeText={setPassword} placeholder="Min. 6 characters" placeholderTextColor={colors.mutedForeground} />
          <FieldLabel label="CONFIRM PASSWORD *" colors={colors} />
          <PasswordInput style={[styles.input, inputStyle(colors)]} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" placeholderTextColor={colors.mutedForeground} />
        </Section>

        {/* Personal info */}
        <Section title="Personal Info" colors={colors}>
          <FieldLabel label="BIRTHDATE *" colors={colors} />
          <TextInput style={[styles.input, inputStyle(colors)]} value={birthdate} onChangeText={setBirthdate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} keyboardType="numbers-and-punctuation" />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <FieldLabel label="HEIGHT (cm)" colors={colors} />
              <TextInput style={[styles.input, inputStyle(colors)]} value={heightCm} onChangeText={setHeightCm} placeholder="165" placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel label="WEIGHT (kg)" colors={colors} />
              <TextInput style={[styles.input, inputStyle(colors)]} value={weightKg} onChangeText={setWeightKg} placeholder="60" placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad" />
            </View>
          </View>
        </Section>

        {/* Training info */}
        <Section title="Training Info" colors={colors}>
          <FieldLabel label="YEAR STARTED" colors={colors} />
          <TextInput style={[styles.input, inputStyle(colors)]} value={yearStarted} onChangeText={setYearStarted} keyboardType="number-pad" placeholderTextColor={colors.mutedForeground} />
          <FieldLabel label="BELT RANK" colors={colors} />
          <View style={styles.chipWrap}>
            {BELT_RANKS.map((b) => (
              <Pressable
                key={b}
                onPress={() => setBeltRank(b)}
                style={[styles.chip, { backgroundColor: beltRank === b ? colors.navBar : colors.background, borderColor: beltRank === b ? colors.navBar : colors.border }]}
              >
                <Text style={[styles.chipText, { color: beltRank === b ? "#FFF" : colors.foreground }]}>{b}</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        {/* Membership */}
        <Section title="Membership Status" colors={colors}>
          {MEMBERSHIP_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setMembership(opt.value)}
              style={[styles.memOption, { borderColor: membership === opt.value ? colors.accent : colors.border, backgroundColor: membership === opt.value ? colors.accent + "10" : colors.background }]}
            >
              <View style={[styles.radio, { borderColor: membership === opt.value ? colors.accent : colors.border }]}>
                {membership === opt.value && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}
              </View>
              <Text style={[styles.memLabel, { color: colors.foreground }]}>{opt.label}</Text>
            </Pressable>
          ))}
        </Section>

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          style={({ pressed }) => [styles.registerBtn, { backgroundColor: colors.accent, opacity: pressed || loading ? 0.8 : 1 }]}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

function FieldLabel({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, color: colors.mutedForeground, marginTop: 4 }}>{label}</Text>;
}

function inputStyle(colors: ReturnType<typeof useColors>) {
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
  row2: { flexDirection: "row", gap: 12 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  memOption: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderRadius: 10, padding: 14 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  memLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  registerBtn: { borderRadius: 12, paddingVertical: 15, alignItems: "center", justifyContent: "center", marginTop: 4 },
  registerBtnText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
});
