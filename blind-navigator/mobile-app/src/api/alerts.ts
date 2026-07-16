import { apiFetch } from "./client";

export async function logAlert(
    sessionId: string,
    scenario: string,
    distanceCm: number,
    actionTaken: string
) {
    return apiFetch(
        "/alerts",
        {
            method: "POST",
            body: JSON.stringify({
                session_id: sessionId,
                scenario,
                distance_cm: distanceCm,
                action_taken: actionTaken,
            }),
        },
        true
    );
}