import { api } from '../lib/api';
import type { Prompt, Reference } from '../types';

export const promptService = {
    async getAll() {
        return api.get<Prompt[]>('/prompts');
    },

    async create(prompt: Omit<Prompt, 'id' | 'created_at'>) {
        return api.post<Prompt>('/prompts', prompt);
    },

    async delete(id: string) {
        return api.delete(`/prompts/${id}`);
    }
};

export const referenceService = {
    async getAll() {
        return api.get<Reference[]>('/references');
    },

    async create(ref: Omit<Reference, 'id' | 'created_at'>) {
        return api.post<Reference>('/references', ref);
    },

    async delete(id: string) {
        return api.delete(`/references/${id}`);
    }
};
