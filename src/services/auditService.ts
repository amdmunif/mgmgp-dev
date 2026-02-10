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

export const auditService = {
    async getAll() {
        return await api.get<AuditLog[]>('/logs');
    }
};
