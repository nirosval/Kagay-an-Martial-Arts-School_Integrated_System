import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, TextInput, TextInputProps, View } from "react-native";

export function PasswordInput({ style, ...props }: Omit<TextInputProps, "secureTextEntry">) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ position: "relative", justifyContent: "center" }}>
      <TextInput
        {...props}
        style={[style, { paddingRight: 44 }]}
        secureTextEntry={!visible}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        hitSlop={8}
        style={{ position: "absolute", right: 12, padding: 4 }}
      >
        <Feather name={visible ? "eye" : "eye-off"} size={18} color="#9CA3AF" />
      </Pressable>
    </View>
  );
}
