import { api } from '../lib/api';

export interface SharedFileItem {
    id: string;
    title: string;
    description?: string;
    category: string;
    mapel: string;
    kelas: string;
    file_url: string;
    file_name?: string;
    file_type: 'pdf' | 'office' | 'html' | 'archive' | 'image' | 'other' | string;
    file_ext?: string;
    file_size?: number;
    user_id: string;
    uploader_name?: string;
    uploader_school?: string;
    uploader_role?: string;
    downloads_count?: number;
    created_at: string;
    updated_at?: string;
}

export const sharedFileService = {
    async getAll() {
        return api.get<SharedFileItem[]>('/shared-files');
    },

    async create(data: Partial<SharedFileItem>) {
        return api.post<{ message: string; id: string }>('/shared-files', data);
    },

    async update(id: string, data: Partial<SharedFileItem>) {
        return api.put<{ message: string }>(`/shared-files/${id}`, data);
    },

    async delete(id: string) {
        return api.delete<{ message: string }>(`/shared-files/${id}`);
    },

    async recordDownload(id: string) {
        try {
            await api.post(`/shared-files/${id}/download`, {});
        } catch {
            // Non-blocking
        }
    },

    async uploadFile(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<{
            url: string;
            original_name?: string;
            size?: number;
            ext?: string;
        }>('/upload', formData);
    }
};

