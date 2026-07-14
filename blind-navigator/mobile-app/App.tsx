import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import CameraScreen from "./src/screens/CameraScreen";

type Screen = "camera" | "menu";

export default function App() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [screen, setScreen] = useState<Screen>("camera");

  useEffect(() => {
    checkExistingLogin();
  }, []);

  const checkExistingLogin = async () => {
    const token = await SecureStore.getItemAsync("access_token");
    setIsLoggedIn(!!token);
    setCheckingAuth(false);
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("access_token");
    setIsLoggedIn(false);
    setScreen("camera");
  };

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  if (screen === "menu") {
    return (
      <HomeScreen
        onBackToCamera={() => setScreen("camera")}
        onLogout={handleLogout}
      />
    );
  }

  return <CameraScreen onOpenSettings={() => setScreen("menu")} />;
}