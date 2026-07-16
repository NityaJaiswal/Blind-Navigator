import { apiFetch } from "./client";

export async function logDetection(
    sessionId: string,
    label: string,
    confidence: number,
    colorDetected: string
) {
    return apiFetch(
        "/detections",
        {
            method: "POST",
            body: JSON.stringify({
                session_id: sessionId,
                label,
                confidence,
                color_detected: colorDetected,
            }),
        },
        true
    );
}