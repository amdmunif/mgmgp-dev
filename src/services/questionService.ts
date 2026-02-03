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
    }
};
