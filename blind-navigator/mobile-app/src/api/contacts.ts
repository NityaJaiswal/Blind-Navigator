import { apiFetch } from "./client";

export interface Contact {
    id: string;
    name: string;
    phone: string;
}

export async function listContacts(): Promise<Contact[]> {
    return apiFetch("/contacts", { method: "GET" }, true);
}

export async function addContact(name: string, phone: string): Promise<Contact> {
    return apiFetch("/contacts", {
        method: "POST",
        body: JSON.stringify({ name, phone }),
    }, true);
}

export async function deleteContact(id: string): Promise<void> {
    return apiFetch(`/contacts/${id}`, { method: "DELETE" }, true);
}