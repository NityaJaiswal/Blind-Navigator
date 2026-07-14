import * as SecureStore from "expo-secure-store";

// Change this if your PC's IP address changes
const BASE_URL = "http://192.168.31.217:8000";

async function getAuthHeaders() {
    const token = await SecureStore.getItemAsync("access_token");

    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
}

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = true
) {
    const authHeaders = requiresAuth
        ? await getAuthHeaders()
        : {};

    const response = await fetch(
        `${BASE_URL}${endpoint}`,
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

export { BASE_URL };