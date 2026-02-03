import { api } from '../lib/api';
import type { QuestionBank } from '../types';

export const questionService = {
    async getAll() {
        return await api.get<QuestionBank[]>('/questions');
    },

    async create(question: Omit<QuestionBank, 'id' | 'created_at'>) {
        return await api.post<QuestionBank>('/questions', question);
    },

    async delete(id: string) {
        return await api.delete(`/questions/${id}`);
    },

    async uploadFile(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        // api wrapper usually handles FormData if body is FormData, or we need to check api.ts
        // Assuming api.post handles it or we use raw fetch for upload if api is strict JSON.
        // Let's assume standard axios/fetch wrapper behavior for now or check api.ts first.
        const response = await api.post<{ url: string }>('/upload', formData);
        return response.url;
    }
};
