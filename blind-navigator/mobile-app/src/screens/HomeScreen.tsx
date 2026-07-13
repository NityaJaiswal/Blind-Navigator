import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>You're logged in! 🎉</Text>
            <Text style={styles.subtext}>Home screen coming next.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    text: { fontSize: 22, fontWeight: "bold" },
    subtext: { fontSize: 14, color: "#666", marginTop: 8 },
});