import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { login } from "../api/auth";

interface Props {
    onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Missing info", "Please enter both email and password.");
            return;
        }

        setLoading(true);
        try {
            const result = await login(email, password);

            // Save the token securely so the user isn't asked to log in again
            await SecureStore.setItemAsync("access_token", result.access_token);
            await SecureStore.setItemAsync("user_name", result.user_name);
            await SecureStore.setItemAsync("user_id", result.user_id);
            await SecureStore.setItemAsync("role", result.role);

            onLoginSuccess();
        } catch (error) {
            Alert.alert(
                "Login failed",
                "Please check the email and password and try again."
            );
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Blind-Navigator Setup</Text>
            <Text style={styles.subtitle}>
                This login is a one-time setup, usually done by a caregiver or family
                member. After this, the app will stay signed in.
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                accessibilityLabel="Email input"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                accessibilityLabel="Password input"
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
                accessibilityLabel="Log in button"
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Log In</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "#666",
        marginBottom: 24,
        textAlign: "center",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
        fontSize: 16,
    },
    button: {
        backgroundColor: "#4f8cff",
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
        marginTop: 8,
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
});