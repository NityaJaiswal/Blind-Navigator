const REALISTIC_COLORS = [
    "red",
    "blue",
    "brown",
    "yellow",
    "green",
    "white",
    "black",
    "gray",
    "silver",
];

class ColorDetector {
    private static instance: ColorDetector;
    private isSimulator: boolean = true;

    private constructor() {}

    public static getInstance(): ColorDetector {
        if (!ColorDetector.instance) {
            ColorDetector.instance = new ColorDetector();
        }
        return ColorDetector.instance;
    }

    public setSimulatorMode(enabled: boolean) {
        this.isSimulator = enabled;
    }

    /**
     * Determines dominant color of a bounding box region in the camera frame.
     * In simulation mode, randomly picks from REALISTIC_COLORS.
     */
    public async detectDominantColor(frameData?: any, boundingBox?: [number, number, number, number]): Promise<string> {
        if (this.isSimulator) {
            // Simulate brief color sampling latency (10-50ms)
            const latency = Math.floor(Math.random() * 40) + 10;
            await new Promise((resolve) => setTimeout(resolve, latency));

            const randomIdx = Math.floor(Math.random() * REALISTIC_COLORS.length);
            return REALISTIC_COLORS[randomIdx];
        } else {
            // Real image pixel sampling logic would go here:
            // e.g. using canvas context in web-fallback, or native buffers on phone.
            return "unknown color";
        }
    }
}

export default ColorDetector;
