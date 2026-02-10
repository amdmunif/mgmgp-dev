import { api } from '../lib/api';
import type { LearningMaterial, MaterialType } from '../types';

export const learningService = {
    async getAll(type?: MaterialType) {
        const data = await api.get<LearningMaterial[]>('/learning');
        if (type) {
            return data.filter(item => item.type === type);
        }
        return data;
    },

    async getById(id: string) {
        return api.get<LearningMaterial>(`/learning/${id}`);
    },

    async create(material: Omit<LearningMaterial, 'id' | 'created_at'>) {
        return api.post<LearningMaterial>('/learning', material);
    },

    async update(id: string, updates: Partial<LearningMaterial>) {
        return api.put<LearningMaterial>(`/learning/${id}`, updates);
    },

    async delete(id: string) {
        return api.delete(`/learning/${id}`);
    },

    async uploadDocument(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<{ url: string }>('/upload', formData);
        return response.url;
    }
};
