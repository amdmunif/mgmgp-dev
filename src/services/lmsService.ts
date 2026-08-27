import { api } from '../lib/api';
import type { LmsTopic, LmsMaterial, LmsQuiz } from '../types';

export const lmsService = {
    // Topik
    getTopicsByEvent: async (eventId: string): Promise<LmsTopic[]> => {
        const response = await api.get(`/lms/topics/${eventId}`);
        return response.data;
    },

    saveTopic: async (topic: Partial<LmsTopic>): Promise<any> => {
        if (topic.id) {
            const response = await api.put(`/lms/topics/${topic.id}`, topic);
            return response;
        } else {
            const response = await api.post('/lms/topics', topic);
            return response;
        }
    },

    deleteTopic: async (id: string): Promise<any> => {
        const response = await api.delete(`/lms/topics/${id}`);
        return response;
    },

    // Materi
    getMaterialsByTopic: async (topicId: string): Promise<LmsMaterial[]> => {
        const response = await api.get(`/lms/materials/${topicId}`);
        return response.data;
    },

    saveMaterial: async (material: Partial<LmsMaterial>): Promise<any> => {
        if (material.id) {
            const response = await api.put(`/lms/materials/${material.id}`, material);
            return response;
        } else {
            const response = await api.post('/lms/materials', material);
            return response;
        }
    },

    deleteMaterial: async (id: string): Promise<any> => {
        const response = await api.delete(`/lms/materials/${id}`);
        return response;
    },

    // Kuis
    getQuizByMaterialId: async (materialId: string): Promise<LmsQuiz | null> => {
        try {
            const response = await api.get(`/lms/quizzes/${materialId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching quiz:', error);
            return null;
        }
    },
    
    saveQuiz: async (quizData: Partial<LmsQuiz>): Promise<any> => {
        const response = await api.post('/lms/quizzes', quizData);
        return response;
    }
};
