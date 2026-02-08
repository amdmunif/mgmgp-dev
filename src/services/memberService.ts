import { api } from '../lib/api';

export interface Profile {
    id: string;
    nama: string;
    email: string;
    role: string;
    subscription_status?: string;
    premium_until?: string;
    created_at?: string;
    is_active?: number | boolean; // 1 or 0 usually from PHP
    foto_profile?: string;
}

export const memberService = {
    // Get all members
    async getAll() {
        return await api.get<Profile[]>('/members');
    },

    // Update member role (Wrapper for backward compatibility)
    async updateRole(id: string, role: string) {
        return this.update(id, { role });
    },

    // Update entire profile
    async update(id: string, data: Partial<Profile> & { email?: string }) {
        return await api.put<{ message: string }>(`/members/${id}`, data);
    },

    // Delete member
    async delete(id: string) {
        return await api.delete(`/members/${id}`);
    }
};
