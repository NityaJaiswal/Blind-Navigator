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


import { getBaseUrl } from "./client";

export async function detectObjects(imageUri: string) {
    const baseUrl = await getBaseUrl();

    const formData = new FormData();

    formData.append("file", {
        uri: imageUri,
        name: "frame.jpg",
        type: "image/jpeg",
    } as any);

    // 10-second timeout to prevent hanging on unreachable backend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(`${baseUrl}/vision/detect`, {
            method: "POST",
            body: formData,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(await response.text());
        }

        return response.json();
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
            throw new Error("Detection request timed out (10s). Is the backend reachable?");
        }
        throw error;
    }
}