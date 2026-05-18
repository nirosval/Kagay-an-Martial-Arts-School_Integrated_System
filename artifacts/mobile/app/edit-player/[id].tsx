import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
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
import { usePlayers } from "@/context/PlayersContext";
import { useColors } from "@/hooks/useColors";
import { MembershipStatus } from "@/types";

const BELT_RANKS = [
  "White Belt", "Yellow Belt", "Orange Belt", "Green Belt",
  "Blue Belt", "Purple Belt", "Brown Belt", "Black Belt",
];

const MEMBERSHIP_OPTIONS: Array<{ label: string; value: MembershipStatus }> = [
  { label: "Active Member", value: "active_member" },
  { label: "Active (Non-Member)", value: "active_nonmember" },
  { label: "Inactive", value: "inactive" },
];

export default function EditPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getPlayer, updatePlayer } = usePlayers();
  const player = getPlayer(id ?? "");

  const [name, setName] = useState(player?.name ?? "");
  const [birthdate, setBirthdate] = useState(player?.birthdate ?? "");
  const [weightKg, setWeightKg] = useState(String(player?.weight_kg ?? ""));
  const [heightCm, setHeightCm] = useState(String(player?.height_cm ?? ""));
  const [yearStarted, setYearStarted] = useState(String(player?.year_started ?? ""));
  const [beltRank, setBeltRank] = useState(player?.belt_rank ?? "White Belt");
  const [membership, setMembership] = useState<MembershipStatus>(player?.membership_status ?? "active_member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!player) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Player not found.</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!name.trim() || !birthdate.trim()) {
      setError("Name and birthdate are required.");
      return;
    }
    const wt = parseFloat(weightKg);
    const ht = parseFloat(heightCm);
    const yr = parseInt(yearStarted, 10);
    if (isNaN(wt) || isNaN(ht) || isNaN(yr)) {
      setError("Please fill in all numeric fields correctly.");
      return;
    }
    setError("");
    setLoading(true);
    await updatePlayer(player.id, {
      name: name.trim(),
      birthdate: birthdate.trim(),
      weight_kg: wt,
      height_cm: ht,
      year_started: yr,
      belt_rank: beltRank,
      membership_status: membership,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(false);
    router.back();
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.navBar, paddingTop: topPadding + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Feather name="arrow-left" size={22} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Player</Text>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.form,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Personal Info</Text>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>FULL NAME</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.mutedForeground}
          />
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>BIRTHDATE</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
            value={birthdate}
            onChangeText={setBirthdate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Physical Stats</Text>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>HEIGHT (cm)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>WEIGHT (kg)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Training Info</Text>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>YEAR STARTED</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
            value={yearStarted}
            onChangeText={setYearStarted}
            keyboardType="number-pad"
            placeholderTextColor={colors.mutedForeground}
          />
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>BELT RANK</Text>
          <View style={styles.chipWrap}>
            {BELT_RANKS.map((b) => (
              <Pressable
                key={b}
                onPress={() => setBeltRank(b)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: beltRank === b ? colors.navBar : colors.background,
                    borderColor: beltRank === b ? colors.navBar : colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: beltRank === b ? "#FFF" : colors.foreground }]}>
                  {b}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Membership Status</Text>
          {MEMBERSHIP_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setMembership(opt.value)}
              style={[
                styles.memOption,
                {
                  borderColor: membership === opt.value ? colors.accent : colors.border,
                  backgroundColor: membership === opt.value ? colors.accent + "10" : colors.background,
                },
              ]}
            >
              <View style={[styles.radio, { borderColor: membership === opt.value ? colors.accent : colors.border }]}>
                {membership === opt.value && (
                  <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />
                )}
              </View>
              <Text style={[styles.memLabel, { color: colors.foreground }]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { color: "#FFF", fontSize: 17, fontFamily: "Inter_700Bold" },
  saveText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  form: { padding: 16, gap: 14 },
  errorBox: { backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12 },
  errorText: { color: "#991B1B", fontSize: 13, fontFamily: "Inter_500Medium" },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular" },
  row2: { flexDirection: "row", gap: 12 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  memOption: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderRadius: 10, padding: 14 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  memLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
