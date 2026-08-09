import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from "react-native";
import { listContacts, addContact, deleteContact, Contact } from "../api/contacts";
import { listDetections, listAlerts } from "../api/history";
import * as SecureStore from "expo-secure-store";
import TtsEngine from "../tts/TtsEngine";
import { getBaseUrl, updateBaseUrl } from "../api/client";

interface Props {
    onBackToCamera: () => void;
    onLogout: () => void;
}

type View_ = "menu" | "settings" | "history" | "contacts" | "guide";

export default function HomeScreen({ onBackToCamera, onLogout }: Props) {
    const [view, setView] = useState<View_>("menu");

    // Simulator State
    const [simDist, setSimDist] = useState<number>(200);
    const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);
    const [detailedSpeech, setDetailedSpeech] = useState<boolean>(false);
    const [smsAlerts, setSmsAlerts] = useState<boolean>(true);

    const getSimulatedState = (dist: number) => {
        if (dist < 50) return { label: "🛑 CRITICAL STOP", color: "#EF4444", text: "Stop! Obstacle immediately ahead." };
        if (dist < 150) return { label: "⚠️ OBSTACLE WARNING", color: "#F59E0B", text: "Warning! Obstacle detected nearby." };
        return { label: "✅ PATH CLEAR", color: "#10B981", text: "Path clear. safe to proceed." };
    };

    const simState = getSimulatedState(simDist);

    const playSimulatedAnnouncement = async () => {
        const text = `Simulator report. Distance is ${simDist} centimeters. Status: ${simState.text}`;
        await TtsEngine.getInstance().speak(text);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                {view !== "menu" ? (
                    <TouchableOpacity style={styles.backButton} onPress={() => setView("menu")}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 80 }} />
                )}
                
                <Text style={styles.headerTitle}>
                    {view === "menu" && "Settings Hub"}
                    {view === "settings" && "Configuration"}
                    {view === "history" && "Activity History"}
                    {view === "contacts" && "Emergency Contacts"}
                    {view === "guide" && "User Guide"}
                </Text>

                <TouchableOpacity style={styles.cameraButton} onPress={onBackToCamera}>
                    <Text style={styles.cameraButtonText}>Camera</Text>
                </TouchableOpacity>
            </View>

            {/* Content area */}
            <View style={styles.content}>
                {view === "menu" && (
                    <ScrollView contentContainerStyle={styles.menuContainer} showsVerticalScrollIndicator={false}>
                        {/* Live Cane Simulator Card */}
                        <View style={styles.simCard}>
                            <View style={styles.simHeader}>
                                <Text style={styles.simTitle}>⚡ Smart Cane Simulator</Text>
                                <View style={styles.simBadge}>
                                    <Text style={styles.simBadgeText}>ACTIVE DEMO</Text>
                                </View>
                            </View>
                            
                            <View style={[styles.simStateBox, { backgroundColor: simState.color + "15", borderColor: simState.color }]}>
                                <Text style={[styles.simStateLabel, { color: simState.color }]}>{simState.label}</Text>
                                <Text style={styles.simDistanceText}>{simDist} cm</Text>
                            </View>

                            <Text style={styles.simHelper}>Adjust Distance for Simulation:</Text>
                            <View style={styles.simControls}>
                                {[30, 90, 180].map((d) => (
                                    <TouchableOpacity 
                                        key={d} 
                                        style={[styles.simBtn, simDist === d && { backgroundColor: "#6366F1", borderColor: "#6366F1" }]}
                                        onPress={() => setSimDist(d)}
                                    >
                                        <Text style={[styles.simBtnText, simDist === d && { color: "#FFF" }]}>{d}cm</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.speakSimBtn} onPress={playSimulatedAnnouncement}>
                                <Text style={styles.speakSimBtnText}>🔊 Test Announcement Voice</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.menuSubtitle}>
                            Manage and customize device parameters, contact lists, and activity logs.
                        </Text>
                        
                        <MenuItem 
                            label="Device Settings" 
                            subtitle="Backend URLs, voice & speech rates"
                            icon="⚙️"
                            onPress={() => setView("settings")} 
                        />
                        <MenuItem 
                            label="Activity History" 
                            subtitle="Review past detections & warnings"
                            icon="🕒"
                            onPress={() => setView("history")} 
                        />
                        <MenuItem 
                            label="Emergency Contacts" 
                            subtitle="Manage caregivers & contacts"
                            icon="🚨"
                            onPress={() => setView("contacts")} 
                        />
                        <MenuItem 
                            label="Interactive Guide" 
                            subtitle="Cane pairing guide & gesture keys"
                            icon="📖"
                            onPress={() => setView("guide")} 
                        />
                        <MenuItem 
                            label="Log Out" 
                            subtitle="Disconnect this device session"
                            icon="🚪"
                            onPress={onLogout} 
                            danger 
                        />
                    </ScrollView>
                )}

                {view === "settings" && (
                    <SettingsView 
                        hapticsEnabled={hapticsEnabled}
                        setHapticsEnabled={setHapticsEnabled}
                        detailedSpeech={detailedSpeech}
                        setDetailedSpeech={setDetailedSpeech}
                        smsAlerts={smsAlerts}
                        setSmsAlerts={setSmsAlerts}
                    />
                )}
                {view === "history" && <HistoryView />}
                {view === "contacts" && <ContactsView />}
                {view === "guide" && <GuideView />}
            </View>
        </View>
    );
}

function MenuItem({
    label,
    subtitle,
    icon,
    onPress,
    danger,
}: {
    label: string;
    subtitle: string;
    icon: string;
    onPress: () => void;
    danger?: boolean;
}) {
    return (
        <TouchableOpacity 
            style={[styles.menuItem, danger && styles.menuItemDanger]} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.menuItemIconContainer, danger && styles.menuItemIconDangerContainer]}>
                <Text style={styles.menuItemIcon}>{icon}</Text>
            </View>
            <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemLabel, danger && styles.dangerText]}>{label}</Text>
                <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
            </View>
            <Text style={[styles.menuItemArrow, danger && styles.dangerText]}>→</Text>
        </TouchableOpacity>
    );
}

function SettingsView({
    hapticsEnabled,
    setHapticsEnabled,
    detailedSpeech,
    setDetailedSpeech,
    smsAlerts,
    setSmsAlerts,
}: {
    hapticsEnabled: boolean;
    setHapticsEnabled: (v: boolean) => void;
    detailedSpeech: boolean;
    setDetailedSpeech: (v: boolean) => void;
    smsAlerts: boolean;
    setSmsAlerts: (v: boolean) => void;
}) {
    const [backendUrl, setBackendUrl] = useState("http://10.219.152.42:8000");
    const [speechRate, setSpeechRate] = useState(1.0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            const url = await getBaseUrl();
            setBackendUrl(url);

            const rate = TtsEngine.getInstance().getSpeechRate();
            setSpeechRate(rate);
        }
        loadSettings();
    }, []);

    const handleSaveBackend = async () => {
        if (!backendUrl.trim()) return;
        setSaving(true);
        try {
            await updateBaseUrl(backendUrl.trim());
            Alert.alert("Success", "Backend API URL updated successfully.");
        } catch (e) {
            Alert.alert("Error", "Failed to save Backend URL.");
        } finally {
            setSaving(false);
        }
    };

    const handleRateChange = (val: number) => {
        setSpeechRate(val);
        TtsEngine.getInstance().setSpeechRate(val);
    };

    const testTtsAnnouncement = async () => {
        await TtsEngine.getInstance().speak(`Testing TTS feedback at speech rate ${speechRate} times speed.`);
    };

    return (
        <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <Text style={styles.settingsSectionTitle}>🤖 Backend Configuration</Text>
                <Text style={styles.cardHelperText}>
                    Set up the address of the YOLO object recognition server.
                </Text>
                
                <View style={styles.settingItem}>
                    <Text style={styles.settingsLabel}>Server Endpoint URL</Text>
                    <TextInput
                        style={styles.settingsInput}
                        value={backendUrl}
                        onChangeText={setBackendUrl}
                        placeholder="http://192.168.x.x:8000"
                        placeholderTextColor="#64748B"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveBackend} disabled={saving}>
                        <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Endpoint"}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.settingsSectionTitle}>🔊 Audio & Voice Guidance</Text>
                <Text style={styles.cardHelperText}>
                    Configure the text-to-speech feedback rate for obstacle announcements.
                </Text>
                
                <View style={styles.settingItem}>
                    <Text style={styles.settingsLabel}>Speech Speed ({speechRate.toFixed(2)}x)</Text>
                    <View style={styles.rateButtonContainer}>
                        {[0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((rate) => (
                            <TouchableOpacity
                                key={rate}
                                style={[
                                    styles.rateButton,
                                    speechRate === rate && styles.rateButtonActive,
                                ]}
                                onPress={() => handleRateChange(rate)}
                            >
                                <Text style={[
                                    styles.rateButtonText,
                                    speechRate === rate && styles.rateButtonTextActive
                                ]}>{rate}x</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={[styles.saveButton, { marginTop: 14, backgroundColor: "#475569" }]} onPress={testTtsAnnouncement}>
                        <Text style={styles.buttonText}>📢 Test TTS Voice</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.settingsSectionTitle}>⚙️ Extra Capabilities</Text>
                <Text style={styles.cardHelperText}>
                    Toggle advanced accessibility hardware features.
                </Text>
                
                <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.toggleLabel}>Haptic Cane Vibration</Text>
                        <Text style={styles.toggleDesc}>Trigger vibration motor when obstacles close in.</Text>
                    </View>
                    <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} trackColor={{ true: "#6366F1" }} />
                </View>

                <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.toggleLabel}>Detailed Object Description</Text>
                        <Text style={styles.toggleDesc}>Speak size and categories instead of just alerts.</Text>
                    </View>
                    <Switch value={detailedSpeech} onValueChange={setDetailedSpeech} trackColor={{ true: "#6366F1" }} />
                </View>

                <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.toggleLabel}>SMS Alerts to Caregivers</Text>
                        <Text style={styles.toggleDesc}>Send coordinates on critical obstacle collisions.</Text>
                    </View>
                    <Switch value={smsAlerts} onValueChange={setSmsAlerts} trackColor={{ true: "#6366F1" }} />
                </View>
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

function HistoryView() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [detections, alerts] = await Promise.all([
                listDetections(30),
                listAlerts(30),
            ]);
            const merged = [
                ...(Array.isArray(detections) ? detections : []).map((d: any) => ({
                    ...d,
                    _type: "detection",
                })),
                ...(Array.isArray(alerts) ? alerts : []).map((a: any) => ({
                    ...a,
                    _type: "alert",
                })),
            ];
            setItems(merged);
        } catch (err) {
            console.log("Failed to load history:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    if (items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.placeholderText}>No history logs found.</Text>
            </View>
        );
    }

    return (
        <FlatList
            style={styles.viewContainer}
            data={items}
            keyExtractor={(item, idx) => `${item._type}-${item.id ?? idx}`}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
                const isAlert = item._type === "alert";
                return (
                    <View style={[styles.historyRow, isAlert && styles.historyRowAlert]}>
                        <View style={styles.historyTextContainer}>
                            <View style={[styles.badge, isAlert ? styles.badgeAlert : styles.badgeDetect]}>
                                <Text style={styles.badgeText}>
                                    {isAlert ? "ALERT" : "DETECT"}
                                </Text>
                            </View>
                            <Text style={styles.historyLabel}>
                                {item.label ?? item.scenario ?? "—"}
                            </Text>
                        </View>
                        {item.timestamp && (
                            <Text style={styles.historyTime}>
                                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </Text>
                        )}
                    </View>
                );
            }}
        />
    );
}

function ContactsView() {
    const [loading, setLoading] = useState(true);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await listContacts();
            setContacts(Array.isArray(result) ? result : []);
        } catch (err) {
            console.log("Failed to load contacts:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleAdd = async () => {
        if (!name.trim() || !phone.trim()) return;
        setSaving(true);
        try {
            await addContact(name.trim(), phone.trim());
            setName("");
            setPhone("");
            await load();
        } catch (err) {
            Alert.alert("Error", "Could not add contact.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteContact(id);
            await load();
        } catch (err) {
            Alert.alert("Error", "Could not delete contact.");
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.viewContainer}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.card}>
                <Text style={styles.settingsSectionTitle}>🚨 Add Caregiver / Contact</Text>
                <View style={styles.addForm}>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#64748B"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        placeholderTextColor="#64748B"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleAdd}
                        disabled={saving}
                    >
                        <Text style={styles.buttonText}>{saving ? "Adding Contact..." : "Save Contact"}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.sectionHeaderTitle}>Saved Contacts ({contacts.length})</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 20 }} />
            ) : contacts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.placeholderText}>No emergency contacts added yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={contacts}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={styles.contactRow}>
                            <View style={styles.contactInfo}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.contactName}>{item.name}</Text>
                                    <Text style={styles.contactPhone}>{item.phone}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.removeButton} onPress={() => handleDelete(item.id)}>
                                <Text style={styles.removeButtonText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </KeyboardAvoidingView>
    );
}

function GuideView() {
    const guides = [
        { title: "🔍 Gesture Controls", desc: "Triple tap anywhere on the Camera view to instantly open this settings panel." },
        { title: "🔊 Speed & Pitch", desc: "If announcements feel too fast or slow, modify the speed rates under Device Settings to find the optimal pace." },
        { title: "🚨 Emergency Contacts", desc: "Always register at least one caregiver number so the app can auto-notify them in critical situations." },
        { title: "📡 BLE cane connection", desc: "Turn on the Smart Cane battery pack. The app will auto-discover and connect via Bluetooth." }
    ];

    return (
        <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeaderTitle}>Interactive Help Guides</Text>
            {guides.map((g, idx) => (
                <View key={idx} style={styles.card}>
                    <Text style={styles.guideTitle}>{g.title}</Text>
                    <Text style={styles.guideDesc}>{g.desc}</Text>
                </View>
            ))}
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#0B0F19", // Deep premium dark background
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: "#111827",
        borderBottomWidth: 1,
        borderBottomColor: "#1F2937",
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: "#1F2937",
    },
    backButtonText: {
        color: "#9CA3AF",
        fontSize: 14,
        fontWeight: "600",
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: "800", 
        color: "#F9FAFB",
        letterSpacing: 0.5,
    },
    cameraButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: "#6366F1", // Indigo accent
    },
    cameraButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
    content: {
        flex: 1,
    },
    menuContainer: {
        padding: 20,
    },
    menuSubtitle: {
        fontSize: 14,
        color: "#94A3B8",
        lineHeight: 20,
        marginBottom: 24,
    },
    simCard: {
        backgroundColor: "#1E293B",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(99, 102, 241, 0.4)",
        marginBottom: 24,
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    simHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    simTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#FFF",
    },
    simBadge: {
        backgroundColor: "#6366F1",
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    simBadgeText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "800",
    },
    simStateBox: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
        marginBottom: 16,
    },
    simStateLabel: {
        fontSize: 16,
        fontWeight: "800",
    },
    simDistanceText: {
        fontSize: 32,
        fontWeight: "800",
        color: "#FFF",
        marginTop: 6,
    },
    simHelper: {
        color: "#94A3B8",
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 10,
    },
    simControls: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    simBtn: {
        flex: 1,
        backgroundColor: "#0F172A",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
        marginHorizontal: 4,
    },
    simBtnText: {
        color: "#94A3B8",
        fontSize: 14,
        fontWeight: "700",
    },
    speakSimBtn: {
        backgroundColor: "#1F2937",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#374151",
    },
    speakSimBtnText: {
        color: "#E2E8F0",
        fontSize: 14,
        fontWeight: "600",
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1E293B", // Card dark slate
        padding: 18,
        borderRadius: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#334155",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    menuItemDanger: {
        borderColor: "rgba(239, 68, 68, 0.3)",
        backgroundColor: "rgba(239, 68, 68, 0.05)",
    },
    menuItemIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(99, 102, 241, 0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    menuItemIconDangerContainer: {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
    },
    menuItemIcon: {
        fontSize: 22,
    },
    menuItemContent: {
        flex: 1,
        marginLeft: 14,
    },
    menuItemLabel: {
        fontSize: 16,
        fontWeight: "700",
        color: "#F1F5F9",
    },
    menuItemSubtitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2,
    },
    menuItemArrow: {
        fontSize: 18,
        color: "#64748B",
        fontWeight: "700",
    },
    dangerText: { 
        color: "#EF4444", 
    },
    viewContainer: { 
        flex: 1, 
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0B0F19",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    placeholderText: { 
        fontSize: 15, 
        color: "#64748B", 
        textAlign: "center",
    },
    card: {
        backgroundColor: "#1E293B",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "#334155",
        marginBottom: 20,
    },
    cardHelperText: {
        fontSize: 13,
        color: "#94A3B8",
        marginBottom: 16,
        lineHeight: 18,
    },
    settingsSectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#F8FAFC",
        marginBottom: 6,
    },
    settingItem: {
        marginTop: 4,
    },
    settingsLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#94A3B8",
        marginBottom: 8,
    },
    settingsInput: {
        backgroundColor: "#0F172A",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        fontSize: 15,
        color: "#F1F5F9",
    },
    saveButton: {
        backgroundColor: "#6366F1",
        borderRadius: 10,
        padding: 14,
        alignItems: "center",
    },
    buttonText: { 
        color: "#FFFFFF", 
        fontSize: 15, 
        fontWeight: "700",
    },
    rateButtonContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: -4,
    },
    rateButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#334155",
        backgroundColor: "#0F172A",
        margin: 4,
    },
    rateButtonActive: {
        backgroundColor: "#6366F1",
        borderColor: "#6366F1",
    },
    rateButtonText: {
        fontSize: 14,
        color: "#94A3B8",
        fontWeight: "600",
    },
    rateButtonTextActive: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    toggleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#334155",
        paddingVertical: 14,
    },
    toggleLabel: {
        fontSize: 15,
        fontWeight: "700",
        color: "#F1F5F9",
    },
    toggleDesc: {
        fontSize: 11,
        color: "#64748B",
        marginTop: 2,
    },
    historyRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#1E293B",
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#334155",
    },
    historyRowAlert: {
        borderColor: "rgba(239, 68, 68, 0.2)",
    },
    historyTextContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginRight: 10,
    },
    badgeAlert: {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
    },
    badgeDetect: {
        backgroundColor: "rgba(16, 185, 129, 0.15)",
    },
    badgeText: {
        fontSize: 10,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    historyLabel: { 
        fontSize: 15, 
        fontWeight: "600",
        color: "#F1F5F9",
    },
    historyTime: {
        fontSize: 12,
        color: "#64748B",
    },
    sectionHeaderTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#94A3B8",
        marginTop: 10,
        marginBottom: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    addForm: { 
        marginTop: 4,
    },
    input: {
        backgroundColor: "#0F172A",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 10,
        padding: 14,
        marginBottom: 10,
        fontSize: 15,
        color: "#F1F5F9",
    },
    addButton: {
        backgroundColor: "#10B981", // Emerald accent
        borderRadius: 10,
        padding: 14,
        alignItems: "center",
        marginTop: 4,
    },
    contactRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#1E293B",
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#334155",
    },
    contactInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#6366F1",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 15,
    },
    contactName: { 
        fontSize: 15, 
        fontWeight: "700", 
        color: "#F1F5F9",
    },
    contactPhone: { 
        fontSize: 13, 
        color: "#64748B", 
        marginTop: 2,
    },
    removeButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: "rgba(239, 68, 68, 0.1)",
    },
    removeButtonText: {
        color: "#EF4444",
        fontSize: 13,
        fontWeight: "600",
    },
    guideTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#F1F5F9",
        marginBottom: 6,
    },
    guideDesc: {
        fontSize: 13,
        color: "#94A3B8",
    },
});