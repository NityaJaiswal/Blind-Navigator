import * as Speech from "expo-speech";

class TtsEngine {
    private static instance: TtsEngine;
    private speechRate: number = 1.0;
    private selectedVoice: string | null = null;

    private constructor() {}

    public static getInstance(): TtsEngine {
        if (!TtsEngine.instance) {
            TtsEngine.instance = new TtsEngine();
        }
        return TtsEngine.instance;
    }

    public setSpeechRate(rate: number) {
        // Expo Speech rate normally ranges from 0.5 to 2.0
        this.speechRate = Math.max(0.5, Math.min(2.0, rate));
    }

    public getSpeechRate(): number {
        return this.speechRate;
    }

    public setSelectedVoice(voiceId: string | null) {
        this.selectedVoice = voiceId;
    }

    public getSelectedVoice(): string | null {
        return this.selectedVoice;
    }

    /**
     * Speaks the given text, interrupting any active speech.
     */
    public async speak(text: string): Promise<void> {
        try {
            await this.stop();
            
            const options: Speech.SpeechOptions = {
                rate: this.speechRate,
            };

            if (this.selectedVoice) {
                options.voice = this.selectedVoice;
            }

            Speech.speak(text, options);
        } catch (error) {
            console.error("TTS failed to speak:", error);
        }
    }

    /**
     * Instantly stops any ongoing speech.
     */
    public async stop(): Promise<void> {
        try {
            await Speech.stop();
        } catch (error) {
            console.error("TTS failed to stop:", error);
        }
    }

    /**
     * Returns list of speech voices supported by the device.
     */
    public async getAvailableVoices(): Promise<Speech.Voice[]> {
        try {
            return await Speech.getAvailableVoicesAsync();
        } catch (error) {
            console.error("TTS failed to fetch voices:", error);
            return [];
        }
    }
}

export default TtsEngine;
