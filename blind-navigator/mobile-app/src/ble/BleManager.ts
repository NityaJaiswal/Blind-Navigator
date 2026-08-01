import { BLE_SERVICE_UUID, BLE_CHARACTERISTIC_UUID } from "./bleConstants";

export interface BLETelemetry {
    distance_cm: number;
    delta_cm: number;
    state: number; // 0=IDLE, 1=MUTE, 2=ALARM, 3=OVERRIDE_STOP
    battery_pct: number;
}

export type ConnectionState = "disconnected" | "scanning" | "connecting" | "connected";

type TelemetryCallback = (data: BLETelemetry) => void;
type ConnectionCallback = (state: ConnectionState) => void;

class BleManager {
    private static instance: BleManager;
    private connectionState: ConnectionState = "disconnected";
    
    private telemetryCallbacks: Set<TelemetryCallback> = new Set();
    private connectionCallbacks: Set<ConnectionCallback> = new Set();

    // Telemetry cache
    private currentTelemetry: BLETelemetry = {
        distance_cm: 200,
        delta_cm: 0,
        state: 0,
        battery_pct: 100,
    };

    private constructor() {}

    public static getInstance(): BleManager {
        if (!BleManager.instance) {
            BleManager.instance = new BleManager();
        }
        return BleManager.instance;
    }

    public getConnectionState(): ConnectionState {
        return this.connectionState;
    }

    public subscribeTelemetry(callback: TelemetryCallback): () => void {
        this.telemetryCallbacks.add(callback);
        // Immediately fire with current telemetry
        callback(this.currentTelemetry);
        return () => {
            this.telemetryCallbacks.delete(callback);
        };
    }

    public subscribeConnection(callback: ConnectionCallback): () => void {
        this.connectionCallbacks.add(callback);
        callback(this.connectionState);
        return () => {
            this.connectionCallbacks.delete(callback);
        };
    }

    private updateConnectionState(newState: ConnectionState) {
        this.connectionState = newState;
        this.connectionCallbacks.forEach((cb) => cb(newState));
    }

    private notifyTelemetry(data: BLETelemetry) {
        this.currentTelemetry = data;
        this.telemetryCallbacks.forEach((cb) => cb(data));
    }

    /**
     * Connect to the ESP32 BLE device.
     *
     * TODO: Implement real BLE scan + connect using react-native-ble-plx.
     * Currently logs a warning and stays disconnected — the app will
     * function without BLE (camera + YOLO + TTS still work), and the
     * AlarmHandler gracefully handles missing telemetry.
     */
    public async connect(): Promise<void> {
        if (this.connectionState === "connected" || this.connectionState === "connecting") {
            return;
        }

        this.updateConnectionState("connecting");

        // Real BLE implementation placeholder:
        // 1. Scan for devices with DEVICE_NAME_PREFIX
        // 2. Connect to first matching device
        // 3. Subscribe to BLE_CHARACTERISTIC_UUID for telemetry notifications
        // 4. Parse incoming 8-byte packets into BLETelemetry
        console.log(
            "BleManager: Real BLE not yet implemented (requires react-native-ble-plx with native build). " +
            "ESP32 telemetry unavailable — app will operate in camera+AI-only mode."
        );

        // Stay in "connecting" briefly, then mark as disconnected since no real device
        await new Promise((resolve) => setTimeout(resolve, 1500));
        this.updateConnectionState("disconnected");
    }

    public disconnect() {
        if (this.connectionState === "disconnected") {
            return;
        }
        // TODO: Disconnect real BLE device
        this.updateConnectionState("disconnected");
    }

    /**
     * Manually inject telemetry data. Useful for testing or when
     * telemetry arrives from a source other than BLE (e.g., USB serial).
     */
    public injectTelemetry(data: BLETelemetry) {
        this.notifyTelemetry(data);
    }
}

export default BleManager;
