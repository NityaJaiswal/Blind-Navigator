/**
 * ColorDetector — extracts dominant color from a bounding box region.
 *
 * Currently returns "unknown" — real pixel-sampling implementation is a
 * future enhancement (Phase D). The class shell is preserved so call sites
 * don't need to change when the real implementation is added.
 */
class ColorDetector {
    private static instance: ColorDetector;

    private constructor() {}

    public static getInstance(): ColorDetector {
        if (!ColorDetector.instance) {
            ColorDetector.instance = new ColorDetector();
        }
        return ColorDetector.instance;
    }

    /**
     * Determines dominant color of a bounding box region in the camera frame.
     * TODO: Implement real pixel sampling (canvas context or native buffers).
     */
    public async detectDominantColor(
        frameData?: any,
        boundingBox?: [number, number, number, number]
    ): Promise<string> {
        return "unknown";
    }
}

export default ColorDetector;
