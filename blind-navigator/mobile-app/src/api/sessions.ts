import * as SecureStore from "expo-secure-store";
import { apiFetch } from "./client";

export interface SessionResponse {
    _id: string;
    user_id: string;
    device_id: string;
    start_time: string;
    end_time: string | null;
    is_active: boolean;
}

export async function startSession() {
    const userId = await SecureStore.getItemAsync("user_id");

    if (!userId) {
        throw new Error("No logged-in user found.");
    }

    const session = await apiFetch(
        "/sessions/start",
        {
            method: "POST",
            body: JSON.stringify({
                user_id: userId,
                device_id: "ANDROID_PHONE_001",
            }),
        }
    );

    return session as SessionResponse;
}

export async function endSession(sessionId: string) {
    return apiFetch(
        `/sessions/${sessionId}/end`,
        {
            method: "POST",
        }
    );
}