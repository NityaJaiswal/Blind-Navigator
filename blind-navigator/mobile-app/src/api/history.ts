import { apiFetch } from "./client";

export async function listDetections(limit: number = 50) {
    return apiFetch(`/detections?limit=${limit}`, { method: "GET" }, true);
}

export async function listAlerts(limit: number = 50) {
    return apiFetch(`/alerts?limit=${limit}`, { method: "GET" }, true);
}