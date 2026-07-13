import { apiFetch } from "./client";

export interface LoginResponse {
    access_token: string;
    token_type: string;
    role: string;
    user_name: string;
    user_id: string;
}

export async function login(
    email: string,
    password: string
): Promise<LoginResponse> {
    return apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}