import { api } from '../lib/api';

export interface Letter {
    id: string;
    template_id: string;
    letter_number: string;
    letter_date: string;
    subject: string;
    recipient: string;
    author_id: string;
    content: string; // HTML content
    form_data: any; // Original form data
    created_at: string;
}

export const letterService = {
    async getAll() {
        return await api.get<Letter[]>('/letters');
    },

    async getById(id: string) {
        return await api.get<Letter>(`/letters/${id}`);
    },

    async create(letter: Omit<Letter, 'id' | 'created_at'>) {
        return await api.post('/letters', letter);
    },

    async update(id: string, letter: Partial<Letter>) {
        return await api.put(`/letters/${id}`, letter);
    },

    async delete(id: string) {
        return await api.delete(`/letters/${id}`);
    }
};
