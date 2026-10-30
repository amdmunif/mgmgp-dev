import { api } from '../lib/api';

export interface InteractiveMediaItem {
    id: string;
    title: string;
    description?: string;
    mapel: string;
    kelas: string;
    semester?: string;
    category: string;
    file_url: string;
    file_name?: string;
    file_size?: number;
    author_id?: string;
    author_name?: string;
    creator_name?: string;
    views_count?: number;
    created_at: string;
    updated_at?: string;
}

export const interactiveMediaService = {
    async getAll() {
        return api.get<InteractiveMediaItem[]>('/interactive-media');
    },

    async getById(id: string) {
        return api.get<InteractiveMediaItem>(`/interactive-media/${id}`);
    },

    async create(data: Partial<InteractiveMediaItem>) {
        return api.post<{ message: string; id: string }>('/interactive-media', data);
    },

    async update(id: string, data: Partial<InteractiveMediaItem>) {
        return api.put<{ message: string }>(`/interactive-media/${id}`, data);
    },

    async delete(id: string) {
        return api.delete<{ message: string }>(`/interactive-media/${id}`);
    },

    async uploadHtmlFile(file: File) {
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

