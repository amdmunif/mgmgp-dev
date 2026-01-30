import { api } from '../lib/api';

export interface AppSettings {
    id: number;
    site_title: string;
    site_description?: string;
    logo_url?: string;
    email?: string;
    phone?: string;
    address?: string;
    bank_name?: string;
    bank_number?: string;
    bank_holder?: string;
    premium_price?: number;
}

export const settingsService = {
    async getSettings() {
        const response = await api.get<AppSettings>('/settings');
        return response;
    },

    async updateSettings(updates: Partial<AppSettings>) {
        const response = await api.post<AppSettings>('/settings', updates);
        return response;
    },

    async uploadLogo(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        // Custom upload call since api wrapper handles JSON by default
        // We need to bypass content-type header for FormData
        // Can extend api wrapper or use raw fetch for upload

        // Using existing api helper, if it supports FormData:
        // Checking src/lib/api.ts... It uses JSON.stringify.
        // Let's use raw fetch but use the baseUrl from somewhere or duplicate logic?
        // Let's assume api client needs enhancement for FormData. 
        // For now, I'll use standard fetch with the same base URL logic.

        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('access_token');

        const response = await fetch(`${API_BASE_URL}/settings/logo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return data.url;
    }
};
