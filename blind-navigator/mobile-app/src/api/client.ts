import * as SecureStore from "expo-secure-store";

let cachedBaseUrl: string | null = null;
const DEFAULT_URL = "http://192.168.0.108:8000";

export async function getBaseUrl(): Promise<string> {
    if (cachedBaseUrl) return cachedBaseUrl;
    try {
        const stored = await SecureStore.getItemAsync("backend_url");
        if (stored) {
            cachedBaseUrl = stored;
            return stored;
        }
    } catch (e) {}
    return DEFAULT_URL;
}

export async function updateBaseUrl(newUrl: string): Promise<void> {
    cachedBaseUrl = newUrl;
    await SecureStore.setItemAsync("backend_url", newUrl);
}

async function getAuthHeaders(): Promise<Record<string, string>> {
    const token = await SecureStore.getItemAsync("access_token");
    if (token) {
        return { Authorization: `Bearer ${token}` };
    }
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
    const response = await fetch(
        `${baseUrl}${endpoint}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...authHeaders,
                ...(options.headers || {}),
            },
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();

        throw new Error(
            `API error ${response.status}: ${errorBody}`
        );
    }

    return response.json();
}