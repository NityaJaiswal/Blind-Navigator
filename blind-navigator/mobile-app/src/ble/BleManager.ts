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
    private isSimulator: boolean = true;
    private simulatedInterval: NodeJS.Timeout | null = null;
    
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

    public isSimulatorMode(): boolean {
        return this.isSimulator;
    }

    public setSimulatorMode(enabled: boolean) {
        this.isSimulator = enabled;
        if (!enabled && this.simulatedInterval) {
            this.stopSimulator();
        }
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

    // Connect to the device (or start simulated telemetry stream)
    public async connect(): Promise<void> {
        if (this.connectionState === "connected" || this.connectionState === "connecting") {
            return;
        }

        this.updateConnectionState("connecting");

        if (this.isSimulator) {
            // Simulate brief delay
            await new Promise((resolve) => setTimeout(resolve, 1000));
            this.updateConnectionState("connected");
            this.startSimulator();
        } else {
            // Real BLE implementation stub
            // Since react-native-ble-plx needs native components not available in basic Expo Go,
            // we log this and fallback to simulator. A developer with React Native CLI would insert
            // BleManager.js scan and connect routines here.
            console.log("Real BLE requires react-native-ble-plx. Falling back to simulator.");
            await new Promise((resolve) => setTimeout(resolve, 1500));
            this.updateConnectionState("connected");
            this.startSimulator();
        }
    }

    public disconnect() {
        if (this.connectionState === "disconnected") {
            return;
        }

        if (this.simulatedInterval) {
            this.stopSimulator();
        }

        this.updateConnectionState("disconnected");
    }

    private startSimulator() {
        if (this.simulatedInterval) return;

        let cycle = 0;
        let battery = 98;
        
        this.simulatedInterval = setInterval(() => {
            cycle++;
            
            // Decement battery slowly
            if (cycle % 100 === 0 && battery > 5) {
                battery--;
            }

            // Simulate walking profile with obstacles
            // Phase 1 (0-15s): Walking, far distance (IDLE)
            // Phase 2 (15-30s): Obstacle approaching (ALARM)
            // Phase 3 (30-40s): Backing off or stationary (MUTE)
            // Phase 4 (40-50s): Rapid approach / drop-off (OVERRIDE_STOP)
            // Phase 5 (50-60s): Reset back to clear path (IDLE)
            const timeSec = (cycle * 2) % 60; // 2s steps
            
            let distance = 200;
            let delta = 0;
            let state = 0; // IDLE

            if (timeSec < 15) {
                // Clear path
                distance = 180 + Math.floor(Math.random() * 20);
                delta = Math.floor(Math.random() * 4) - 2;
                state = 0; // IDLE
            } else if (timeSec >= 15 && timeSec < 28) {
                // Obstacle approaching slowly
                // Decreasing from 140 to 60
                const progress = (timeSec - 15) / 13;
                distance = Math.floor(140 - progress * 80);
                delta = -6; // constant approach
                state = distance <= 100 ? 2 : 0; // ALARM below 100cm, else IDLE
            } else if (timeSec >= 28 && timeSec < 38) {
                // Mute state / standing still near obstacle
                distance = 60 + Math.floor(Math.random() * 2);
                delta = 0;
                state = 1; // MUTE
            } else if (timeSec >= 38 && timeSec < 48) {
                // Critical danger (rapid approach / cliff / override stop)
                const progress = (timeSec - 38) / 10;
                distance = Math.floor(60 - progress * 35); // drops to 25cm
                delta = -12; // fast approach speed
                state = distance <= 45 ? 3 : 2; // OVERRIDE_STOP below 45cm, else ALARM
            } else {
                // Safe path reset
                distance = 170 + Math.floor(Math.random() * 30);
                delta = 10; // moving away
                state = 0; // IDLE
            }

            this.notifyTelemetry({
                distance_cm: distance,
                delta_cm: delta,
                state: state,
                battery_pct: battery,
            });
        }, 2000); // Send updates every 2 seconds
    }

    private stopSimulator() {
        if (this.simulatedInterval) {
            clearInterval(this.simulatedInterval);
            this.simulatedInterval = null;
        }
    }
}

export default BleManager;
