import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { startSession, endSession } from "../api/sessions";
import BleManager, { BLETelemetry, ConnectionState } from "../ble/BleManager";
import AlarmHandler from "../alarmHandler/AlarmHandler";

interface Props {
    onOpenSettings: () => void;
}

export default function CameraScreen({ onOpenSettings }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [connState, setConnState] = useState<ConnectionState>("disconnected");
    const [telemetry, setTelemetry] = useState<BLETelemetry | null>(null);
    const [connectingSession, setConnectingSession] = useState(true);

    const tapTimestamps = useRef<number[]>([]);

    useEffect(() => {
        let activeSessionId: string | null = null;

        async function initSessionAndBle() {
            setConnectingSession(true);
            try {
                // 1. Start active session on the backend
                const session = await startSession();
                console.log("✅ CameraScreen: Session started:", session._id);
                activeSessionId = session._id;
                setSessionId(session._id);
                
                // Set session ID in AlarmHandler
                AlarmHandler.getInstance().setSessionId(session._id);
                
                // 2. Connect BLE manager (will auto-start simulator if simulator mode is active)
                const ble = BleManager.getInstance();
                await ble.connect();

                // 3. Start Alarm Handler listening to BLE events
                AlarmHandler.getInstance().startListening();
            } catch (error) {
                console.log("❌ CameraScreen: Initialization error:", error);
                Alert.alert(
                    "Connection Failed",
                    "Could not start session on backend. Please check backend URL in settings.",
                    [{ text: "OK" }]
                );
            } finally {
                setConnectingSession(false);
            }
        }

        initSessionAndBle();

        // Subscribe to BLE connection states
        const unsubConnection = BleManager.getInstance().subscribeConnection((state) => {
            setConnState(state);
        });

        // Subscribe to telemetry updates
        const unsubTelemetry = BleManager.getInstance().subscribeTelemetry((data) => {
            setTelemetry(data);
        });

        // Cleanup on unmount
        return () => {
            console.log("CameraScreen: Cleaning up...");
            unsubConnection();
            unsubTelemetry();
            AlarmHandler.getInstance().stopListening();
            AlarmHandler.getInstance().setSessionId(null);
            BleManager.getInstance().disconnect();

            if (activeSessionId) {
                endSession(activeSessionId).catch((err) => {
                    console.log("CameraScreen: Failed to end session:", err);
                });
            }
        };
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

    const getAlertStateText = (state: number) => {
        switch (state) {
            case 0:
                return "PATH CLEAR";
            case 1:
                return "MUTED (STATIONARY)";
            case 2:
                return "OBSTACLE WARNING";
            case 3:
                return "CRITICAL STOP";
            default:
                return "UNKNOWN";
        }
    };

    const getAlertStateColor = (state: number) => {
        switch (state) {
            case 0:
                return "#4caf50"; // Green
            case 1:
                return "#ffb300"; // Amber
            case 2:
                return "#ff9800"; // Orange
            case 3:
                return "#f44336"; // Red
            default:
                return "#757575";
        }
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
        <Pressable style={styles.container} onPress={handleScreenTap}>
            <CameraView style={StyleSheet.absoluteFill} facing="back" />

            {/* Top Stats Overlay */}
            <View style={styles.topOverlay}>
                <View style={styles.statsRow}>
                    <View style={styles.badgeContainer}>
                        <View
                            style={[
                                styles.statusDot,
                                {
                                    backgroundColor:
                                        connState === "connected"
                                            ? "#4caf50"
                                            : connState === "connecting"
                                            ? "#ffb300"
                                            : "#f44336",
                                },
                            ]}
                        />
                        <Text style={styles.badgeText}>
                            Band: {connState.toUpperCase()}
                        </Text>
                    </View>

                    {telemetry && (
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>
                                🔋 {telemetry.battery_pct}%
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={styles.sessionText}>
                    {connectingSession
                        ? "Connecting to backend..."
                        : sessionId
                        ? `Active Session: ${sessionId.substring(0, 8)}...`
                        : "Offline Mode (No Session)"}
                </Text>
            </View>

            {/* Telemetry Display */}
            {telemetry && (
                <View style={styles.telemetryOverlay}>
                    <View
                        style={[
                            styles.stateBadge,
                            { backgroundColor: getAlertStateColor(telemetry.state) },
                        ]}
                    >
                        <Text style={styles.stateBadgeText}>
                            {getAlertStateText(telemetry.state)}
                        </Text>
                    </View>

                    <Text style={styles.distanceValue}>
                        {telemetry.distance_cm} cm
                    </Text>

                    <Text style={styles.deltaValue}>
                        Approach: {telemetry.delta_cm} cm/s
                    </Text>
                </View>
            )}

            {/* Bottom Actions Overlay */}
            <View style={styles.bottomOverlay}>
                <Text style={styles.instructionText}>
                    Triple tap screen to open settings
                </Text>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={onOpenSettings}
                >
                    <Text style={styles.buttonText}>Settings Menu</Text>
                </TouchableOpacity>
            </View>
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
    topOverlay: {
        position: "absolute",
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: "rgba(10, 14, 39, 0.75)",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    badgeContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    badgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    sessionText: {
        color: "#ccc",
        fontSize: 11,
        marginTop: 4,
        fontFamily: "System",
    },
    telemetryOverlay: {
        position: "absolute",
        top: "35%",
        left: 30,
        right: 30,
        backgroundColor: "rgba(10, 14, 39, 0.8)",
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    stateBadge: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 16,
    },
    stateBadgeText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    distanceValue: {
        color: "#fff",
        fontSize: 48,
        fontWeight: "800",
    },
    deltaValue: {
        color: "#aaa",
        fontSize: 16,
        marginTop: 8,
    },
    bottomOverlay: {
        position: "absolute",
        bottom: 40,
        left: 20,
        right: 20,
        alignItems: "center",
    },
    instructionText: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 13,
        marginBottom: 12,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    settingsButton: {
        width: "100%",
        backgroundColor: "rgba(79, 140, 255, 0.9)",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
    },
});