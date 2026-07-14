import { apiFetch } from "./client";
import * as SecureStore from "expo-secure-store";

async function authHeaders() {
    const token = await SecureStore.getItemAsync("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listDetections(limit: number = 50) {
    return apiFetch(`/detections?limit=${limit}`, {
        method: "GET",
        headers: await authHeaders(),
    });
}

export async function listAlerts(limit: number = 50) {
    return apiFetch(`/alerts?limit=${limit}`, {
        method: "GET",
        headers: await authHeaders(),
    });
}