import { apiFetch } from "./client";

export async function logAlert(
    sessionId: string,
    scenario: string,
    actionTaken: string
) {
    return apiFetch(
        "/alerts",
        {
            method: "POST",
            body: JSON.stringify({
                session_id: sessionId,
                scenario,
                action_taken: actionTaken,
            }),
        },
        true
    );
}