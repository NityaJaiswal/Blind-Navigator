/**
 * ObjectDetector — on-device object detection stub.
 *
 * Detection is now handled server-side via POST /vision/detect (YOLO).
 * This class is preserved as a stub for future on-device TFLite detection
 * (Phase D: offline AI). The DetectionResult interface is still used
 * throughout the app to represent detection results regardless of source.
 */

export interface DetectionResult {
    label: string;
    confidence: number;
    color: string;
    boundingBox?: [number, number, number, number];
}

class ObjectDetector {
    private static instance: ObjectDetector;
    private confidenceThreshold: number = 0.5;

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

    /**
     * On-device object detection — future TFLite integration point.
     * Currently unused; all detection goes through the backend YOLO API.
     */
    public async detectObjects(frameData?: any): Promise<DetectionResult[]> {
        // TODO: Integrate react-native-fast-tflite for offline detection.
        console.log("ObjectDetector: On-device detection not yet implemented. Use backend API.");
        return [];
    }
}

export default ObjectDetector;
