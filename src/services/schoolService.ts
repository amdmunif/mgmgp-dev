import { api } from '../lib/api';
import { type SchoolItem, SCHOOLS_DATA, updateSchoolsCache } from '../data/schoolsData';

export interface AddSchoolPayload {
    nama: string;
    kecamatan: string;
    npsn?: string;
    is_verified?: number;
}

export const schoolService = {
    // Get all schools from backend master table
    async getSchools(): Promise<SchoolItem[]> {
        try {
            const data = await api.get<SchoolItem[]>('/schools');
            if (Array.isArray(data) && data.length > 0) {
                updateSchoolsCache(data);
                return data;
            }
            return SCHOOLS_DATA;
        } catch (error) {
            console.warn('Failed to fetch schools from API, falling back to static dataset:', error);
            return SCHOOLS_DATA;
        }
    },

    // Add a new school to master_schools database table
    async addSchool(payload: AddSchoolPayload): Promise<{ message: string; school: SchoolItem }> {
        const res = await api.post<{ message: string; school: SchoolItem }>('/schools', payload);
        return res;
    },

    // Update a school in master_schools database table
    async updateSchool(id: number | string, payload: AddSchoolPayload): Promise<{ message: string; school: SchoolItem }> {
        const res = await api.put<{ message: string; school: SchoolItem }>(`/schools/${id}`, payload);
        return res;
    },

    // Delete a school from master_schools database table
    async deleteSchool(id: number | string): Promise<{ message: string }> {
        return await api.delete<{ message: string }>(`/schools/${id}`);
    }
};
