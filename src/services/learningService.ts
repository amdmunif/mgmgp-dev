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

    async getById(_id: string) {
        // Not implemented in backend yet
        throw new Error("GetById not implemented in PHP yet");
    },

    async create(material: Omit<LearningMaterial, 'id' | 'created_at'>) {
        return api.post<LearningMaterial>('/learning', material);
    },

    async update(_id: string, _updates: Partial<LearningMaterial>) {
        // Not implemented
        throw new Error("Update not implemented in PHP yet");
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
