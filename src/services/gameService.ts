import { api } from '../lib/api';
import type { Game } from '../types';

export const gameService = {
    async getAll() {
        return api.get<Game[]>('/games');
    },

    async getById(_id: string) {
        // Not implemented in backend yet, for now return getAll and filter? 
        // Or implement specific endpoint. Simplest is to assume this is rarely used or implement later.
        // Let's implement minimal GET
        // return api.get<Game>(`/games/${id}`);
        throw new Error("Get By ID not implemented in PHP yet");
    },

    async create(game: Omit<Game, 'id' | 'created_at' | 'plays_count'>) {
        return api.post<Game>('/games', game);
    },

    async update(_id: string, _updates: Partial<Game>) {
        // Not implemented in backend
        throw new Error("Update not implemented in PHP yet");
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
