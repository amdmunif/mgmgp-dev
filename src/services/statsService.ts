import { api } from '../lib/api';

export interface DashboardStats {
    members: number;
    materials: number;
    events: number;
    premium: number;
    pendingMembers: number;
    pendingPremium: number;
}

export const statsService = {
    async getOverview() {
        return await api.get<DashboardStats>('/stats');
    }
};
