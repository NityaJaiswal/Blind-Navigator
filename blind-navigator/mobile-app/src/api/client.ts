import * as SecureStore from "expo-secure-store";

const DEFAULT_URL = "http://127.0.0.1:8000";

export async function getBaseUrl(): Promise<string> {
    // Force localhost through ADB reverse
    return DEFAULT_URL;
}

export async function updateBaseUrl(newUrl: string): Promise<void> {
    // Disabled temporarily for testing
    return;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
    const token = await SecureStore.getItemAsync("access_token");

    if (token) {
        return {
            Authorization: `Bearer ${token}`,
        };
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

    const url = `${baseUrl}${endpoint}`;
console.log("API URL:", url);

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