import BleManager, { BLETelemetry } from "../ble/BleManager";
import ObjectDetector from "../detection/ObjectDetector";
import TtsEngine from "../tts/TtsEngine";
import { logDetection } from "../api/detection";
import { logAlert } from "../api/alerts";

class AlarmHandler {
    private static instance: AlarmHandler;
    private sessionId: string | null = null;
    private bleSubscription: (() => void) | null = null;

    // Rate limit announcements to avoid spamming the user
    private lastAnnouncementTime: number = 0;
    private minAnnouncementIntervalMs: number = 3000; // 3 seconds between announcements
    private lastAnnouncedLabel: string | null = null;
    private lastAnnouncedDistance: number | null = null;

    private constructor() { }

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
            this.lastAnnouncedLabel = "STOP";
            this.lastAnnouncedDistance = distance_cm;
            return;
        }

        if (state === 2) {
            // ALARM: Impending obstacle
            const isNewObjectOrSubstantialChange =
                this.lastAnnouncedLabel === null ||
                (this.lastAnnouncedDistance !== null &&
                    Math.abs(this.lastAnnouncedDistance - distance_cm) > 30);

            const hasTimeElapsed =
                now - this.lastAnnouncementTime >=
                this.minAnnouncementIntervalMs;

            if (hasTimeElapsed || isNewObjectOrSubstantialChange) {
                console.log("AlarmHandler: Triggering object classification...");

                try {
                    const detections =
                        await ObjectDetector.getInstance().detectObjects();

                    if (detections.length > 0) {
                        const primaryDetection = detections[0];
                        const color = primaryDetection.color;

                        const distanceDesc =
                            distance_cm < 100
                                ? `${distance_cm} centimeters`
                                : `${Math.round((distance_cm / 100) * 10) / 10} meters`;

                        const sentence = `${color} ${primaryDetection.label} ahead, ${distanceDesc}`;

                        console.log(
                            `AlarmHandler: Announcing "${sentence}"`
                        );

                        await TtsEngine.getInstance().speak(sentence);

                        if (this.sessionId) {
                            await logDetection(
                                this.sessionId,
                                primaryDetection.label,
                                primaryDetection.confidence,
                                primaryDetection.color
                            );

                            await logAlert(
                                this.sessionId,
                                "B",
                                distance_cm,
                                sentence
                            );
                        }

                        this.lastAnnouncementTime = now;
                        this.lastAnnouncedLabel =
                            primaryDetection.label;
                        this.lastAnnouncedDistance = distance_cm;
                    } else {
                        const distanceDesc =
                            distance_cm < 100
                                ? `${distance_cm} centimeters`
                                : `${Math.round((distance_cm / 100) * 10) / 10} meters`;

                        const rawSentence = `Obstacle ahead, ${distanceDesc}`;

                        console.log(
                            `AlarmHandler: Announcing raw distance "${rawSentence}"`
                        );

                        await TtsEngine.getInstance().speak(rawSentence);

                        if (this.sessionId) {
                            await logAlert(
                                this.sessionId,
                                "B",
                                distance_cm,
                                rawSentence
                            );
                        }

                        this.lastAnnouncementTime = now;
                        this.lastAnnouncedLabel = "obstacle";
                        this.lastAnnouncedDistance = distance_cm;
                    }
                } catch (error) {
                    console.error(
                        "AlarmHandler: Failed to process obstacle detection:",
                        error
                    );
                }
            }
        }

        // Reset rate-limiter when path is clear
        if (state === 0) {
            this.lastAnnouncedLabel = null;
            this.lastAnnouncedDistance = null;
            this.lastAnnouncementTime = 0;
        }
    }
}

export default AlarmHandler;