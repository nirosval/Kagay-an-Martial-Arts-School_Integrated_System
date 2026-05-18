import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string;
  unit?: string;
}

export function StatBlock({ label, value, unit }: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.value, { color: colors.foreground }]}>
        {value}
        {unit ? <Text style={[styles.unit, { color: colors.mutedForeground }]}>{unit}</Text> : null}
      </Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },
});
