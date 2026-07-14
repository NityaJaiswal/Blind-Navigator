// Change this if your PC's IP address changes (run `ipconfig` to check)
const BASE_URL = "http://192.168.31.241:8000";

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API error ${response.status}: ${errorBody}`);
    }

    return response.json();
}

export { BASE_URL };