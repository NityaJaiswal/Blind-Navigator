export interface DetectionResult {
    label: string;
    confidence: number;
    color: string;           // Color is now baked into the detection result
    boundingBox?: [number, number, number, number];
}

const DEFAULT_CONFIDENCE_THRESHOLD = 0.5;

// Each obstacle has a fixed set of realistic colors so detection + color always match
const OBSTACLE_PROFILES: { label: string; colors: string[] }[] = [
    { label: "chair",    colors: ["brown", "black", "gray", "white"] },
    { label: "table",    colors: ["brown", "dark wood", "white", "glass"] },
    { label: "wall",     colors: ["white", "cream", "gray", "beige"] },
    { label: "door",     colors: ["brown", "white", "dark gray", "red"] },
    { label: "stairs",   colors: ["gray", "beige", "white", "dark brown"] },
    { label: "person",   colors: ["wearing red", "wearing blue", "wearing white", "wearing black"] },
    { label: "pole",     colors: ["gray", "silver", "black", "yellow"] },
    { label: "car",      colors: ["white", "black", "red", "silver", "blue"] },
    { label: "bicycle",  colors: ["black", "red", "silver", "blue"] },
    { label: "box",      colors: ["brown", "gray", "black", "white"] },
];

class ObjectDetector {
    private static instance: ObjectDetector;
    private confidenceThreshold: number = DEFAULT_CONFIDENCE_THRESHOLD;
    private isSimulator: boolean = true;

    private constructor() {}

    public static getInstance(): ObjectDetector {
        if (!ObjectDetector.instance) {
            ObjectDetector.instance = new ObjectDetector();
        }
        return ObjectDetector.instance;
    }

    public setConfidenceThreshold(threshold: number) {
        this.confidenceThreshold = threshold;
    }

    public getConfidenceThreshold(): number {
        return this.confidenceThreshold;
    }

    public setSimulatorMode(enabled: boolean) {
        this.isSimulator = enabled;
    }

    /**
     * Runs object detection on camera frame.
     *
     * Simulation mode: picks a realistic obstacle profile (label + matched color)
     * with no random color mismatch. Processing latency is fixed at 80ms.
     *
     * Real mode: placeholder for react-native-fast-tflite integration.
     */
    public async detectObjects(frameData?: any): Promise<DetectionResult[]> {
        if (this.isSimulator) {
            // Fixed 80ms latency — fast enough to feel real
            await new Promise((resolve) => setTimeout(resolve, 80));

            // Pick one primary obstacle profile
            const profileIdx = Math.floor(Math.random() * OBSTACLE_PROFILES.length);
            const profile = OBSTACLE_PROFILES[profileIdx];

            // Pick a color from that profile's matched list
            const colorIdx = Math.floor(Math.random() * profile.colors.length);
            const color = profile.colors[colorIdx];

            const confidence = Math.round((0.72 + Math.random() * 0.22) * 100) / 100;

            const result: DetectionResult = {
                label: profile.label,
                color,
                confidence,
                boundingBox: [
                    Math.round(Math.random() * 40),
                    Math.round(Math.random() * 40),
                    Math.round(60 + Math.random() * 40),
                    Math.round(60 + Math.random() * 40),
                ],
            };

            if (result.confidence < this.confidenceThreshold) {
                return [];
            }

            return [result];
        } else {
            // Real TFLite integration would happen here.
            // Use react-native-fast-tflite or Vision Camera frame processor plugin.
            // Color is extracted separately via ColorDetector on the bounding box region.
            console.log("Real TFLite: model not loaded, returning empty.");
            return [];
        }
    }
}

export default ObjectDetector;
