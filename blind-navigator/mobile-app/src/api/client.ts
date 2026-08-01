import * as SecureStore from "expo-secure-store";

const DEFAULT_URL = "http://192.168.29.149:8000";

export async function getBaseUrl(): Promise<string> {
    try {
        const url = await SecureStore.getItemAsync("backend_url");
        return url || DEFAULT_URL;
    } catch (e) {
        return DEFAULT_URL;
    }
}

export async function updateBaseUrl(newUrl: string): Promise<void> {
    await SecureStore.setItemAsync("backend_url", newUrl);
}

async function getAuthHeaders(): Promise<Record<string, string>> {
    const token = await SecureStore.getItemAsync("access_token");

    console.log("TOKEN =", token);

    if (token) {
        return {
            Authorization: `Bearer ${token}`,
        };
    }

    console.log("No access token found!");

    return {};
}

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = true
) {
    const authHeaders = requiresAuth
        ? await getAuthHeaders()
        : {};

    const baseUrl = await getBaseUrl();

    const url = `${baseUrl}${endpoint}`;
    console.log("DEFAULT_URL =", DEFAULT_URL);
    console.log("BASE_URL =", baseUrl);
    console.log("API URL =", url);

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...authHeaders,
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();

        throw new Error(`API error ${response.status}: ${errorBody}`);
    }

    return response.json();
}