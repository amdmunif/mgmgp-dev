import { api } from '../lib/api';
import type { Game } from '../types';

export const gameService = {
    async getAll() {
        return api.get<Game[]>('/games');
    },

    async getById(id: string) {
        return api.get<Game>(`/games/${id}`);
    },

    async create(game: Omit<Game, 'id' | 'created_at' | 'plays_count'>) {
        return api.post<Game>('/games', game);
    },

    async update(id: string, updates: Partial<Game>) {
        return api.put<Game>(`/games/${id}`, updates);
    },

    async delete(id: string) {
        return api.delete(`/games/${id}`);
    },

    async uploadImage(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<{ url: string }>('/upload', formData);
        return response.url;
    }
};
