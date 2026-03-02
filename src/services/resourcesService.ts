import { api } from '../lib/api';
import type { Prompt, Reference } from '../types';

export const promptService = {
    async getAll() {
        return api.get<Prompt[]>('/prompts');
    },

    async getById(id: string) {
        return api.get<Prompt>(`/prompts/${id}`);
    },

    async create(prompt: Omit<Prompt, 'id' | 'created_at'>) {
        return api.post<Prompt>('/prompts', prompt);
    },

    async update(id: string, updates: Partial<Prompt>) {
        return api.put<Prompt>(`/prompts/${id}`, updates);
    },

    async delete(id: string) {
        return api.delete(`/prompts/${id}`);
    }
};

export const referenceService = {
    async getAll() {
        return api.get<Reference[]>('/references');
    },

    async getById(id: string) {
        return api.get<Reference>(`/references/${id}`);
    },

    async create(ref: Omit<Reference, 'id' | 'created_at'>) {
        return api.post<Reference>('/references', ref);
    },

    async update(id: string, updates: Partial<Reference>) {
        return api.put<Reference>(`/references/${id}`, updates);
    },

    async delete(id: string) {
        return api.delete(`/references/${id}`);
    }
};
