import { api } from '../lib/api';

export interface ContributorStatus {
    status: 'none' | 'pending' | 'approved' | 'rejected';
    role: string;
    question_count: number;
    application?: {
        applied_at: string;
        notes?: string;
    };
}

export interface ContributorApplication {
    id: number;
    user_id: string;
    status: 'pending' | 'approved' | 'rejected';
    applied_at: string;
    notes?: string;
    nama: string;
    email: string;
    question_count: number;
}

export const contributorService = {
    async getStatus() {
        return api.get<ContributorStatus>('/contributor/status');
    },

    async apply() {
        return api.post('/contributor/apply', {});
    },

    // Admin
    async getAllApplications() {
        return api.get<ContributorApplication[]>('/contributor/applications');
    },

    async verify(id: number, status: 'approved' | 'rejected', notes: string = '') {
        return api.post('/contributor/verify', { id, status, notes });
    }
};
