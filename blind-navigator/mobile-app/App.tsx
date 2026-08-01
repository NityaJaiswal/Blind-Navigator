import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";

import LoginScreen from "./src/screens/LoginScreen";
import CameraScreen from "./src/screens/CameraScreen";
import HomeScreen from "./src/screens/HomeScreen";

type Screen = "loading" | "login" | "camera" | "settings";

export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");

  useEffect(() => {
    const checkExistingLogin = async () => {
      await SecureStore.deleteItemAsync("access_token");
      await SecureStore.deleteItemAsync("user_id");
      await SecureStore.deleteItemAsync("user_name");
      await SecureStore.deleteItemAsync("role");

      setScreen("login");
    };
  }, []);

  const checkExistingLogin = async () => {
    const token = await SecureStore.getItemAsync("access_token");
    setScreen(token ? "camera" : "login");
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("access_token");
    setScreen("login");
  };

  if (screen === "loading") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (screen === "login") {
    return (
      <LoginScreen
        onLoginSuccess={() => setScreen("camera")}
      />
    );
  }

  if (screen === "settings") {
    return (
      <HomeScreen
        onBackToCamera={() => setScreen("camera")}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <CameraScreen
      onOpenSettings={() => setScreen("settings")}
    />
  );
}