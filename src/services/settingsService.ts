import { api } from '../lib/api';

export interface AppSettings {
    id: number;
    // App Settings
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

    // Site Content
    home_hero_title?: string;
    home_hero_subtitle?: string;
    home_hero_image?: string;
    profile_visi?: string;
    profile_misi?: string;
    profile_sejarah?: string;
    profile_struktur?: string;
    contact_address?: string; // Duplicate of address, but specific to contact page if needed
    contact_phone?: string;
    contact_email?: string;
    contact_map_url?: string;
    app_logo?: string; // Distinct from logo_url? often same.
    kop_surat?: string;
    ketua_nama?: string;
    ketua_nip?: string;
    ketua_signature_url?: string;
    sekretaris_nama?: string;
    sekretaris_nip?: string;
    sekretaris_signature_url?: string;
    mkks_nama?: string;
    mkks_nip?: string;
    mkks_signature_url?: string;
    premium_rules?: string;
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
        // ... (existing upload logic) ...
        const formData = new FormData();
        formData.append('file', file);
        // ...
        // Simplified for brevity in replacement, keeping existing logic
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/settings/logo`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return data.url;
    },

    // Bank Account Management
    async getBankAccounts(activeOnly = false) {
        return await api.get<BankAccount[]>(activeOnly ? '/bank-accounts/active' : '/bank-accounts');
    },

    async createBankAccount(data: Partial<BankAccount>) {
        return await api.post('/bank-accounts', data);
    },

    async updateBankAccount(id: string, data: Partial<BankAccount>) {
        return await api.put(`/bank-accounts/${id}`, data);
    },

    async deleteBankAccount(id: string) {
        return await api.delete(`/bank-accounts/${id}`);
    }
};

export interface BankAccount {
    id: string;
    bank_name: string;
    account_number: string;
    account_holder: string;
    is_active: boolean;
    created_at?: string;
}
