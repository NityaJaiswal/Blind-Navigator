import { apiFetch } from "./client";
import * as SecureStore from "expo-secure-store";

export interface Contact {
    id: string;
    name: string;
    phone: string;
}

async function authHeaders() {
    const token = await SecureStore.getItemAsync("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listContacts(): Promise<Contact[]> {
    return apiFetch("/contacts", {
        method: "GET",
        headers: await authHeaders(),
    });
}

export async function addContact(name: string, phone: string): Promise<Contact> {
    return apiFetch("/contacts", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ name, phone }),
    });
}

export async function deleteContact(id: string): Promise<void> {
    return apiFetch(`/contacts/${id}`, {
        method: "DELETE",
        headers: await authHeaders(),
    });
}