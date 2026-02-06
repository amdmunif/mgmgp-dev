import { api } from '../lib/api';

// New Individual Question
export interface Question {
    id: string;
    content: string;
    type: 'single_choice' | 'multiple_choice' | 'true_false' | 'match' | 'essay' | 'short_answer';
    options: any[]; // JSON
    answer_key: string;
    explanation?: string;
    level: 'Mudah' | 'Sedang' | 'Sukar';
    mapel: string;
    kelas: string;
    creator_name?: string;
    status: 'draft' | 'pending' | 'verified' | 'rejected';
    created_at: string;
}

// Legacy Question Bank (Files/Games)
export interface QuestionBank {
    id: string;
    title: string;
    mapel: string;
    category: 'Latihan' | 'Ujian' | 'TTS' | 'Wordsearch';
    file_url?: string;
    game_data?: any;
    is_premium: boolean;
    created_at: string;
    creator_name?: string;
    status?: string;
}

export const questionService = {
    // --- Repository (New) ---
    async getAll(filters?: { mapel?: string; kelas?: string; level?: string; search?: string }) {
        const params = new URLSearchParams();
        if (filters?.mapel && filters.mapel !== 'All') params.append('mapel', filters.mapel);
        if (filters?.kelas && filters.kelas !== 'All') params.append('kelas', filters.kelas);
        if (filters?.level && filters.level !== 'All') params.append('level', filters.level);
        if (filters?.search) params.append('search', filters.search);

        return api.get<Question[]>('/questions?' + params.toString());
    },

    async getById(id: string) {
        return api.get<Question>(`/questions/${id}`);
    },

    async create(data: Partial<Question>) {
        return api.post('/questions', data);
    },

    async update(id: string, data: Partial<Question>) {
        return api.put(`/questions/${id}`, data);
    },

    async delete(id: string) {
        return api.delete(`/questions/${id}`);
    },

    // --- Legacy (Files & Games) ---
    async getBanks() {
        return api.get<QuestionBank[]>('/question-banks');
    },

    async createBank(data: Partial<QuestionBank>) {
        return api.post('/question-banks', data);
    },

    async deleteBank(id: string) {
        return api.delete(`/question-banks/${id}`);
    },

    async uploadFile(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post<{ url: string }>('/upload', formData); // Should return { url: ... }
        return res.url;
    }
};
