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
    Switch,
    ScrollView,
} from "react-native";
import { listContacts, addContact, deleteContact, Contact } from "../api/contacts";
import { listDetections, listAlerts } from "../api/history";
import * as SecureStore from "expo-secure-store";
import BleManager from "../ble/BleManager";
import ObjectDetector from "../detection/ObjectDetector";
import ColorDetector from "../detection/ColorDetector";
import TtsEngine from "../tts/TtsEngine";
import { getBaseUrl, updateBaseUrl } from "../api/client";

interface Props {
    onBackToCamera: () => void;
    onLogout: () => void;
}

type View_ = "menu" | "settings" | "history" | "contacts";

export default function HomeScreen({ onBackToCamera, onLogout }: Props) {
    const [view, setView] = useState<View_>("menu");

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {view !== "menu" ? (
                    <TouchableOpacity onPress={() => setView("menu")}>
                        <Text style={styles.headerAction}>{"< Back"}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 60 }} />
                )}
                <Text style={styles.headerTitle}>
                    {view === "menu" && "Menu"}
                    {view === "settings" && "Settings"}
                    {view === "history" && "History"}
                    {view === "contacts" && "Emergency Contacts"}
                </Text>
                <TouchableOpacity onPress={onBackToCamera}>
                    <Text style={styles.headerAction}>Camera</Text>
                </TouchableOpacity>
            </View>

            {view === "menu" && (
                <View style={styles.menuList}>
                    <MenuItem label="Settings" onPress={() => setView("settings")} />
                    <MenuItem label="History" onPress={() => setView("history")} />
                    <MenuItem label="Emergency Contacts" onPress={() => setView("contacts")} />
                    <MenuItem label="Logout" onPress={onLogout} danger />
                </View>
            )}

            {view === "settings" && <SettingsView />}
            {view === "history" && <HistoryView />}
            {view === "contacts" && <ContactsView />}
        </View>
    );
}

function MenuItem({
    label,
    onPress,
    danger,
}: {
    label: string;
    onPress: () => void;
    danger?: boolean;
}) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <Text style={[styles.menuItemText, danger && styles.dangerText]}>{label}</Text>
        </TouchableOpacity>
    );
}

function SettingsView() {
    const [backendUrl, setBackendUrl] = useState("http://192.168.31.217:8000");
    const [simulatorMode, setSimulatorMode] = useState(true);
    const [speechRate, setSpeechRate] = useState(1.0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Load settings
        async function loadSettings() {
            const url = await getBaseUrl();
            setBackendUrl(url);

            const isSim = BleManager.getInstance().isSimulatorMode();
            setSimulatorMode(isSim);

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

    const handleToggleSimulator = (val: boolean) => {
        setSimulatorMode(val);
        BleManager.getInstance().setSimulatorMode(val);
        ObjectDetector.getInstance().setSimulatorMode(val);
        ColorDetector.getInstance().setSimulatorMode(val);
    };

    const handleRateChange = (val: number) => {
        setSpeechRate(val);
        TtsEngine.getInstance().setSpeechRate(val);
    };

    return (
        <ScrollView style={styles.viewContainer}>
            <Text style={styles.settingsSectionTitle}>Backend Configuration</Text>
            <View style={styles.settingItem}>
                <Text style={styles.settingsLabel}>Server Endpoint URL</Text>
                <TextInput
                    style={styles.settingsInput}
                    value={backendUrl}
                    onChangeText={setBackendUrl}
                    placeholder="http://192.168.x.x:8000"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveBackend} disabled={saving}>
                    <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Endpoint"}</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.settingsSectionTitle}>Hardware Settings</Text>
            <View style={styles.switchSetting}>
                <View style={styles.settingTexts}>
                    <Text style={styles.settingsLabel}>Simulate BLE & AI Band</Text>
                    <Text style={styles.settingsSubLabel}>Uses mock telemetry and class predictions when hardware is disconnected.</Text>
                </View>
                <Switch
                    value={simulatorMode}
                    onValueChange={handleToggleSimulator}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={simulatorMode ? "#4f8cff" : "#f4f3f4"}
                />
            </View>

            <Text style={styles.settingsSectionTitle}>Audio & Voice Guidance</Text>
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
            <View style={styles.viewContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (items.length === 0) {
        return (
            <View style={styles.viewContainer}>
                <Text style={styles.placeholderText}>No history yet.</Text>
            </View>
        );
    }

    return (
        <FlatList
            style={styles.viewContainer}
            data={items}
            keyExtractor={(item, idx) => `${item._type}-${item.id ?? idx}`}
            renderItem={({ item }) => (
                <View style={styles.historyRow}>
                    <Text style={styles.historyType}>
                        {item._type === "alert" ? "🔔 Alert" : "👁 Detection"}
                    </Text>
                    <Text style={styles.historyLabel}>
                        {item.label ?? item.scenario ?? "—"}
                    </Text>
                </View>
            )}
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
        <View style={styles.viewContainer}>
            <View style={styles.addForm}>
                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Phone"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAdd}
                    disabled={saving}
                >
                    <Text style={styles.buttonText}>{saving ? "Adding..." : "Add Contact"}</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : contacts.length === 0 ? (
                <Text style={styles.placeholderText}>No contacts yet.</Text>
            ) : (
                <FlatList
                    data={contacts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.contactRow}>
                            <View>
                                <Text style={styles.contactName}>{item.name}</Text>
                                <Text style={styles.contactPhone}>{item.phone}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                <Text style={styles.dangerText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    headerTitle: { fontSize: 18, fontWeight: "700" },
    headerAction: { color: "#4f8cff", fontSize: 16 },
    menuList: { padding: 20 },
    menuItem: {
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    menuItemText: { fontSize: 18 },
    dangerText: { color: "#ff4f4f" },
    viewContainer: { flex: 1, padding: 20 },
    placeholderText: { fontSize: 15, color: "#666", marginTop: 20 },
    historyRow: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    historyType: { fontSize: 13, color: "#888" },
    historyLabel: { fontSize: 16, marginTop: 2 },
    addForm: { marginBottom: 16 },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        fontSize: 15,
    },
    addButton: {
        backgroundColor: "#4f8cff",
        borderRadius: 8,
        padding: 14,
        alignItems: "center",
    },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    contactRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    contactName: { fontSize: 16, fontWeight: "600" },
    contactPhone: { fontSize: 14, color: "#666", marginTop: 2 },
    settingsSectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#333",
        marginTop: 20,
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    settingItem: {
        marginBottom: 20,
    },
    settingsLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: "#444",
        marginBottom: 8,
    },
    settingsSubLabel: {
        fontSize: 12,
        color: "#888",
    },
    settingsInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        fontSize: 15,
        backgroundColor: "#fafafa",
    },
    saveButton: {
        backgroundColor: "#4f8cff",
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
    },
    switchSetting: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        marginBottom: 15,
    },
    settingTexts: {
        flex: 1,
        marginRight: 10,
    },
    rateButtonContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: -4,
    },
    rateButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#ddd",
        margin: 4,
    },
    rateButtonActive: {
        backgroundColor: "#4f8cff",
        borderColor: "#4f8cff",
    },
    rateButtonText: {
        fontSize: 14,
        color: "#555",
    },
    rateButtonTextActive: {
        color: "#fff",
        fontWeight: "600",
    },
});