import BleManager, { BLETelemetry } from "../ble/BleManager";
import { DetectionResult } from "../detection/ObjectDetector";
import TtsEngine from "../tts/TtsEngine";
import { logDetection } from "../api/detection";
import { logAlert } from "../api/alerts";

/**
 * Cooldown period per object class (milliseconds).
 * Don't re-alert on the same label within this window unless
 * confidence increases significantly.
 */
const CLASS_COOLDOWN_MS = 5000;
const CONFIDENCE_REANOUNCE_DELTA = 0.15;

class AlarmHandler {
    private static instance: AlarmHandler;
    private sessionId: string | null = null;
    private bleSubscription: (() => void) | null = null;

    // Rate limit announcements to avoid spamming the user
    private lastAnnouncementTime: number = 0;
    private minAnnouncementIntervalMs: number = 3000; // 3 seconds between announcements

    // Per-class cooldown tracking: label → { timestamp, confidence }
    private classCooldowns: Map<string, { time: number; confidence: number }> = new Map();

    // Latest real detections from the YOLO pipeline (pushed by CameraScreen)
    private lastDetections: DetectionResult[] = [];
    private lastDetectionTime: number = 0;

    private constructor() {}

    public static getInstance(): AlarmHandler {
        if (!AlarmHandler.instance) {
            AlarmHandler.instance = new AlarmHandler();
        }
        return AlarmHandler.instance;
    }

    public setSessionId(id: string | null) {
        this.sessionId = id;
    }

    public getSessionId(): string | null {
        return this.sessionId;
    }

    /**
     * Accept real detection results from the YOLO backend pipeline.
     * Called by CameraScreen after each successful detectObjects() call.
     *
     * This method:
     * 1. Stores the detections for use by the BLE telemetry handler
     * 2. Independently announces high-confidence objects via TTS
     *    (even without BLE telemetry, so camera-only mode works)
     */
    public async handleDetections(detections: DetectionResult[]) {
        this.lastDetections = detections;
        this.lastDetectionTime = Date.now();

        if (detections.length === 0) return;

        const now = Date.now();
        const hasTimeElapsed = now - this.lastAnnouncementTime >= this.minAnnouncementIntervalMs;
        if (!hasTimeElapsed) return;

        // Find the highest-confidence detection that isn't on cooldown
        for (const det of detections) {
            const cooldown = this.classCooldowns.get(det.label);
            if (cooldown) {
                const timeSinceLast = now - cooldown.time;
                const confidenceIncrease = det.confidence - cooldown.confidence;

                // Skip if within cooldown AND confidence hasn't jumped significantly
                if (timeSinceLast < CLASS_COOLDOWN_MS && confidenceIncrease < CONFIDENCE_REANOUNCE_DELTA) {
                    continue;
                }
            }

            // Announce this detection
            const sentence = `${det.label} ahead, ${Math.round(det.confidence * 100)} percent confidence`;
            console.log(`AlarmHandler: Announcing "${sentence}"`);

            await TtsEngine.getInstance().speak(sentence);

            // Log to backend
            if (this.sessionId) {
                try {
                    await logDetection(
                        this.sessionId,
                        det.label,
                        det.confidence,
                        det.color || "unknown"
                    );
                } catch (e) {
                    console.error("AlarmHandler: Failed to log detection:", e);
                }
            }

            // Update cooldown tracking
            this.classCooldowns.set(det.label, { time: now, confidence: det.confidence });
            this.lastAnnouncementTime = now;

            // Only announce the top detection per cycle to avoid spamming
            break;
        }
    }

    public startListening() {
        if (this.bleSubscription) return;

        console.log("AlarmHandler: Subscribing to BLE telemetry updates...");
        const ble = BleManager.getInstance();

        this.bleSubscription = ble.subscribeTelemetry((data) => {
            this.handleTelemetry(data);
        });
    }

    public stopListening() {
        if (this.bleSubscription) {
            this.bleSubscription();
            this.bleSubscription = null;
            console.log("AlarmHandler: Unsubscribed from BLE updates.");
        }
    }

    private async handleTelemetry(data: BLETelemetry) {
        const { distance_cm, delta_cm, state } = data;
        const now = Date.now();

        // 0=IDLE, 1=MUTE, 2=ALARM, 3=OVERRIDE_STOP
        if (state === 3) {
            console.log("AlarmHandler: Critical Hazard State! Triggering stop alert.");

            const stopMessage = "STOP! Obstacle too close!";
            await TtsEngine.getInstance().speak(stopMessage);

            if (this.sessionId) {
                try {
                    await logAlert(
                        this.sessionId,
                        "C",
                        distance_cm,
                        `OVERRIDE_STOP: distance ${distance_cm}cm, delta ${delta_cm}cm`
                    );
                } catch (e) {
                    console.error("Failed to log critical alert:", e);
                }
            }

            this.lastAnnouncementTime = now;
            return;
        }

        if (state === 2) {
            // ALARM: Impending obstacle — use real detections if available
            const hasTimeElapsed =
                now - this.lastAnnouncementTime >= this.minAnnouncementIntervalMs;

            if (!hasTimeElapsed) return;

            // Use real detection results if we have recent ones (within 10 seconds)
            const detectionsAreFresh = (now - this.lastDetectionTime) < 10000;

            if (detectionsAreFresh && this.lastDetections.length > 0) {
                const primaryDetection = this.lastDetections[0];
                const color = primaryDetection.color || "";

                const distanceDesc =
                    distance_cm < 100
                        ? `${distance_cm} centimeters`
                        : `${Math.round((distance_cm / 100) * 10) / 10} meters`;

                const sentence = color && color !== "unknown"
                    ? `${color} ${primaryDetection.label} ahead, ${distanceDesc}`
                    : `${primaryDetection.label} ahead, ${distanceDesc}`;

                console.log(`AlarmHandler: Announcing "${sentence}"`);
                await TtsEngine.getInstance().speak(sentence);

                if (this.sessionId) {
                    try {
                        await logAlert(
                            this.sessionId,
                            "B",
                            distance_cm,
                            sentence
                        );
                    } catch (e) {
                        console.error("AlarmHandler: Failed to log alert:", e);
                    }
                }

                this.lastAnnouncementTime = now;
                this.classCooldowns.set(primaryDetection.label, {
                    time: now,
                    confidence: primaryDetection.confidence,
                });
            } else {
                // No recent detection results — announce raw distance warning
                const distanceDesc =
                    distance_cm < 100
                        ? `${distance_cm} centimeters`
                        : `${Math.round((distance_cm / 100) * 10) / 10} meters`;

                const rawSentence = `Obstacle ahead, ${distanceDesc}`;

                console.log(`AlarmHandler: Announcing raw distance "${rawSentence}"`);
                await TtsEngine.getInstance().speak(rawSentence);

                if (this.sessionId) {
                    try {
                        await logAlert(
                            this.sessionId,
                            "B",
                            distance_cm,
                            rawSentence
                        );
                    } catch (e) {
                        console.error("AlarmHandler: Failed to log alert:", e);
                    }
                }

                this.lastAnnouncementTime = now;
            }
        }

        // Reset rate-limiter and cooldowns when path is clear
        if (state === 0) {
            this.classCooldowns.clear();
            this.lastAnnouncementTime = 0;
        }
    }
}

export default AlarmHandler;