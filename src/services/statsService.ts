import { api } from '../lib/api';

export interface DashboardStats {
    members: number;
    materials: number;
    events: number;
    premium: number;
    pendingMembers: number;
    pendingPremium: number;
}

export interface TeacherStats {
    employment: Array<{ status_kepegawaian: string; count: number }>;
    schoolTypes: {
        Negeri: number;
        Swasta: number;
    };
    engagement: {
        totalAttendance: number;
        uniqueActiveTeachers: number;
    };
}

export const statsService = {
    async getOverview() {
        return await api.get<DashboardStats>('/stats');
    },
    async getTeacherStats() {
        return await api.get<TeacherStats>('/stats/teachers');
    }
};
