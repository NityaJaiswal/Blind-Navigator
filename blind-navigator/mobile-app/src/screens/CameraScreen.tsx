import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Pressable,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";

import { startSession } from "../api/sessions";

interface Props {
    onOpenSettings: () => void;
}

const FAKE_OBJECTS = [
    { label: "chair", color: "red" },
    { label: "table", color: "brown" },
    { label: "person", color: "blue shirt" },
    { label: "wall", color: "white" },
    { label: "door", color: "gray" },
];

export default function CameraScreen({ onOpenSettings }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
    const [detectedLabel, setDetectedLabel] = useState<string | null>(null);
    const [distance, setDistance] = useState<number | null>(null);

    // NEW: Stores the current active session ID
    const [sessionId, setSessionId] = useState<string | null>(null);

    const tapTimestamps = useRef<number[]>([]);

    // Automatically create a session when CameraScreen opens
    useEffect(() => {
        async function createSession() {
            try {
                const session = await startSession();

                console.log("✅ Session Started:", session);

                setSessionId(session._id);
            } catch (error) {
                console.log("❌ Could not start session:", error);
            }
        }

        createSession();
    }, []);

    const handleScreenTap = () => {
        const now = Date.now();

        tapTimestamps.current = [...tapTimestamps.current, now].filter(
            (t) => now - t < 600
        );

        if (tapTimestamps.current.length >= 3) {
            tapTimestamps.current = [];
            onOpenSettings();
        }
    };

    const simulateAlarm = () => {
        const random =
            FAKE_OBJECTS[Math.floor(Math.random() * FAKE_OBJECTS.length)];

        const fakeDistance = Math.floor(Math.random() * 45) + 5;

        const message = `${random.color} ${random.label} ahead`;

        setDetectedLabel(message);
        setDistance(fakeDistance);

        Speech.speak(message);

        console.log("Current Session:", sessionId);

        setTimeout(() => {
            setDetectedLabel(null);
            setDistance(null);
        }, 4000);
    };

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>
                    Camera access is needed for object detection.
                </Text>

                <TouchableOpacity
                    style={styles.permButton}
                    onPress={requestPermission}
                >
                    <Text style={styles.buttonText}>
                        Grant Camera Access
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <Pressable
            style={styles.container}
            onPress={handleScreenTap}
        >
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
            />

            {detectedLabel && (
                <View style={styles.overlay}>
                    <Text style={styles.overlayText}>
                        {detectedLabel}
                    </Text>

                    {distance !== null && (
                        <Text style={styles.overlaySubtext}>
                            Distance: {distance} cm
                        </Text>
                    )}
                </View>
            )}

            <TouchableOpacity
                style={styles.simulateButton}
                onPress={simulateAlarm}
            >
                <Text style={styles.buttonText}>
                    Simulate Alarm (test only)
                </Text>
            </TouchableOpacity>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },

    permissionText: {
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
        marginTop: 100,
        paddingHorizontal: 24,
    },

    permButton: {
        backgroundColor: "#4f8cff",
        borderRadius: 8,
        padding: 16,
        margin: 24,
        alignItems: "center",
    },

    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },

    overlay: {
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: "rgba(0,0,0,0.7)",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
    },

    overlayText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
    },

    overlaySubtext: {
        color: "#ccc",
        fontSize: 14,
        marginTop: 4,
    },

    simulateButton: {
        position: "absolute",
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: "#ff4f4f",
        borderRadius: 12,
        padding: 18,
        alignItems: "center",
    },
});