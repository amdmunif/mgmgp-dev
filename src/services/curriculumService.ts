import { api } from '../lib/api';
import type { CPData, TPData } from '../types';

export const curriculumService = {
    // CP Methods
    async getCP(mapel: 'Informatika' | 'KKA') {
        const response = await api.get<CPData>(`/cp?mapel=${mapel}`);
        return response;
    },

    async updateCP(id: string, data: Partial<CPData>) {
        return api.put<CPData>(`/cp/${id}`, data);
    },

    async createCP(data: Omit<CPData, 'id'>) {
        return api.post<CPData>('/cp', data);
    },

    // TP Methods
    async getTPs(filters?: { mapel?: string; kelas?: string; semester?: string }) {
        const queryParams = new URLSearchParams();
        if (filters?.mapel) queryParams.append('mapel', filters.mapel);
        if (filters?.kelas) queryParams.append('kelas', filters.kelas);
        if (filters?.semester) queryParams.append('semester', filters.semester);

        return api.get<TPData[]>(`/tp?${queryParams.toString()}`);
    },

    async createTP(data: Omit<TPData, 'id'>) {
        return api.post<TPData>('/tp', data);
    },

    async updateTP(id: string, data: Partial<TPData>) {
        return api.put<TPData>(`/tp/${id}`, data);
    },

    async deleteTP(id: string) {
        return api.delete(`/tp/${id}`);
    }
};
