import { apiFetch } from "./client";

export async function logDetection(
    sessionId: string,
    label: string,
    confidence: number = 0.9
) {
    return apiFetch(
        "/detections",
        {
            method: "POST",
            body: JSON.stringify({
                session_id: sessionId,
                label,
                confidence,
            }),
        },
        true
    );
}