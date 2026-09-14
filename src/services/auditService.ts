import { api } from '../lib/api';

export interface AuditLog {
    id: string;
    user_id: string;
    user_name: string;
    action: string;
    target: string;
    created_at: string;
    user_display_name?: string;
}

export interface KkaLog {
    id: string;
    guru_id: string;
    guru_name?: string;
    table_name: string;
    action: string;
    description: string;
    created_at: string;
}

export const auditService = {
    async getAll() {
        return await api.get<AuditLog[]>('/logs');
    },
    async getKkaLogs() {
        return await api.get<KkaLog[]>('/logs/kka');
    }
};
