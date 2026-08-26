import { api } from '../lib/api';

export interface MemberProject {
    id: string;
    user_id: string;
    user_name?: string;
    title: string;
    description: string;
    link_url: string;
    image_url: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

export const projectService = {
    getPublic: async () => {
        return api.get<MemberProject[]>('/projects/public');
    },

    getAll: async () => {
        return api.get<MemberProject[]>('/projects/all');
    },

    getMyProjects: async () => {
        return api.get<MemberProject[]>('/projects/my');
    },

    create: async (data: Partial<MemberProject>) => {
        return api.post<any>('/projects', data);
    },

    update: async (id: string, data: Partial<MemberProject>) => {
        return api.put<any>(`/projects/${id}`, data);
    },

    delete: async (id: string) => {
        return api.delete<any>(`/projects/${id}`);
    },

    updateStatus: async (id: string, status: 'pending' | 'approved' | 'rejected') => {
        return api.put<any>(`/projects/${id}`, { status });
    }
};
