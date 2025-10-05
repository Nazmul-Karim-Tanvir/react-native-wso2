import { Image } from "expo-image";
import { Platform, StyleSheet, Button, Alert } from "react-native";
import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";

import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authorize, refresh, revoke } from "react-native-app-auth";
import axios from "axios";

// =====================================================
// 🔹 1️⃣ WSO2 Config (Update IP as needed)
// =====================================================
const config = {
  issuer: "https://192.168.115.17:9443", // ✅ your WSO2 Identity Server base URL
  clientId: "uj1BM9b20y2dOfLSntbILiIVDzEa",
  redirectUrl: "com.myapp://oauthredirect", // ✅ must match WSO2 callback URL
  scopes: ["openid", "profile", "email", "roles"],
  serviceConfiguration: {
    authorizationEndpoint: "https://192.168.115.17:9443/oauth2/authorize",
    tokenEndpoint: "https://192.168.115.17:9443/oauth2/token",
    revocationEndpoint: "https://192.168.115.17:9443/oauth2/revoke",
  },
};

// =====================================================
// 🔹 2️⃣ Main Screen Component
// =====================================================
export default function HomeScreen() {
  const [status, setStatus] = useState("Not logged in");
  const [profile, setProfile] = useState<any>(null);

  // -----------------------------------
  // 🔹 Login
  // -----------------------------------
  const handleLogin = async () => {
    // 👇 For Web preview (mock login)
    if (Platform.OS === "web") {
      await AsyncStorage.setItem("access_token", "dummy");
      setStatus("✅ Mock login (web mode)");
      return;
    }

    try {
      const result = await authorize(config);
      await AsyncStorage.setItem("access_token", result.accessToken);
      await AsyncStorage.setItem("id_token", result.idToken ?? "");
      await AsyncStorage.setItem("refresh_token", result.refreshToken ?? "");
      setStatus("✅ Logged in!");
    } catch (e) {
      console.error("❌ Login error:", e);
      setStatus("❌ Login failed");
    }
  };

  // -----------------------------------
  // 🔹 Refresh
  // -----------------------------------
  const handleRefresh = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      if (!refreshToken) return;
      const result = await refresh(config, { refreshToken });
      await AsyncStorage.setItem("access_token", result.accessToken);
      await AsyncStorage.setItem("id_token", result.idToken ?? "");
      await AsyncStorage.setItem("refresh_token", result.refreshToken ?? "");
      setStatus("🔄 Token refreshed");
    } catch (e) {
      console.error("❌ Refresh error:", e);
      setStatus("❌ Refresh failed");
    }
  };

  // -----------------------------------
  // 🔹 Logout
  // -----------------------------------
  const handleLogout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      if (refreshToken) {
        await revoke(config, { tokenToRevoke: refreshToken, sendClientId: true });
      }
      await AsyncStorage.clear();
      setProfile(null);
      setStatus("🚪 Logged out");
    } catch (e) {
      console.error("❌ Logout error:", e);
      setStatus("❌ Logout failed");
    }
  };

  // -----------------------------------
  // 🔹 Call .NET Backend
  // -----------------------------------
  const callBackend = async () => {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) {
      Alert.alert("Please login first!");
      return;
    }

    try {
      // ⚠️ Change IP based on where you run
      // 👉 Android Emulator: http://10.0.2.2:5032
      // 👉 Real Phone:       http://192.168.115.17:5032
      const apiUrl = "http://192.168.115.17:5032/api/orders";

      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Orders from backend:", response.data);
      Alert.alert("✅ Success", "Orders fetched! Check console/logs.");
    } catch (error: any) {
      console.error("❌ API Error:", error.response?.data || error.message);
      Alert.alert("❌ Failed", "Could not load data from backend.");
    }
  };

  // -----------------------------------
  // 🔹 Fetch Profile Info (WSO2 /me endpoint)
  // -----------------------------------
  const fetchProfile = async () => {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) {
      Alert.alert("Please login first!");
      return;
    }

    try {
      const res = await axios.get("https://192.168.115.17:9443/scim2/Me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      console.log("✅ Profile:", res.data);
      Alert.alert("✅ Profile loaded", res.data.userName);
    } catch (err: any) {
      console.error("❌ Profile error:", err.response?.data || err.message);
      Alert.alert("❌ Failed", "Could not fetch profile.");
    }
  };

  // =====================================================
  // 🔹 3️⃣ UI Section
  // =====================================================
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      {/* Title */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      {/* Auth Status */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Auth Status</ThemedText>
        <ThemedText>{status}</ThemedText>
      </ThemedView>

      {/* Auth Buttons */}
      <ThemedView style={styles.stepContainer}>
        <Button title="Login with WSO2" onPress={handleLogin} />
        <Button title="Refresh Token" onPress={handleRefresh} />
        <Button title="Logout" onPress={handleLogout} />
      </ThemedView>

      {/* Backend Call */}
      <ThemedView style={styles.stepContainer}>
        <Button title="Get Orders (from API)" onPress={callBackend} />
      </ThemedView>

      {/* WSO2 Profile */}
      <ThemedView style={styles.stepContainer}>
        <Button title="Fetch Profile Info" onPress={fetchProfile} />
        {profile && (
          <>
            <ThemedText type="subtitle">Username: {profile.userName}</ThemedText>
            <ThemedText>Email: {profile.emails?.[0]?.value}</ThemedText>
          </>
        )}
      </ThemedView>

      {/* Template Info */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see
          changes. Press{" "}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: "cmd + d",
              android: "cmd + m",
              web: "F12",
            })}
          </ThemedText>{" "}
          to open developer tools.
        </ThemedText>
      </ThemedView>

      {/* Default Template Explore */}
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert("Action pressed")} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert("Share pressed")}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert("Delete pressed")}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          Tap the Explore tab to learn more about what's included in this starter app.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

// =====================================================
// 🔹 4️⃣ Styles
// =====================================================
const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
