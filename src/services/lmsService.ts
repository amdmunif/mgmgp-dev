import { api } from '../lib/api';
import type { LmsTopic, LmsMaterial } from '../types';

export const lmsService = {
    // Topik
    getTopicsByEvent: async (eventId: string): Promise<LmsTopic[]> => {
        const response: any = await api.get(`/lms/topics/${eventId}`);
        return response as LmsTopic[];
    },

    saveTopic: async (topic: Partial<LmsTopic>): Promise<any> => {
        if (topic.id) {
            return await api.put(`/lms/topics/${topic.id}`, topic);
        } else {
            return await api.post('/lms/topics', topic);
        }
    },

    deleteTopic: async (id: string): Promise<any> => {
        return await api.delete(`/lms/topics/${id}`);
    },

    // Materi
    getMaterialsByTopic: async (topicId: string): Promise<LmsMaterial[]> => {
        const response: any = await api.get(`/lms/materials/${topicId}`);
        return response as LmsMaterial[];
    },

    saveMaterial: async (material: Partial<LmsMaterial>): Promise<any> => {
        if (material.id) {
            return await api.put(`/lms/materials/${material.id}`, material);
        } else {
            return await api.post('/lms/materials', material);
        }
    },

    deleteMaterial: async (id: string): Promise<any> => {
        return await api.delete(`/lms/materials/${id}`);
    },

    // Kuis
    getQuizByMaterialId: async (materialId: string): Promise<any> => {
        try {
            const response: any = await api.get(`/lms/quizzes/${materialId}`);
            return response;
        } catch (error) {
            console.error('Error fetching quiz:', error);
            return null;
        }
    },
    
    saveQuiz: async (quizData: any): Promise<any> => {
        return await api.post('/lms/quizzes', quizData);
    }
};
