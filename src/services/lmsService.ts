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

    reorderTopics: async (items: { id: string, order_num: number }[]): Promise<any> => {
        return await api.post('/lms/topics/reorder', items);
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

    reorderMaterials: async (items: { id: string, order_num: number }[]): Promise<any> => {
        return await api.post('/lms/materials/reorder', items);
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
    },

    submitQuizAttempt: async (quizId: string, answers: Record<string, string>): Promise<any> => {
        return await api.post('/lms/quizzes/submit', { quiz_id: quizId, answers });
    },

    getQuizAttempts: async (quizId: string): Promise<any[]> => {
        const response: any = await api.get(`/lms/quizzes/my-attempts/${quizId}`);
        return response as any[];
    },

    getAllQuizAttempts: async (quizId: string): Promise<any[]> => {
        const response: any = await api.get(`/lms/quizzes/all-attempts/${quizId}`);
        return response as any[];
    },

    // Penugasan
    submitAssignment: async (assignmentId: string, contentUrl: string, textContent: string): Promise<any> => {
        return await api.post('/lms/assignments/submit', {
            assignment_id: assignmentId,
            content_url: contentUrl,
            text_content: textContent
        });
    },

    getAssignmentSubmission: async (assignmentId: string): Promise<any> => {
        try {
            const response: any = await api.get(`/lms/assignments/my-submission/${assignmentId}`);
            return response;
        } catch (error) {
            return null;
        }
    },

    getAllAssignmentSubmissions: async (assignmentId: string): Promise<any[]> => {
        try {
            const response: any = await api.get(`/lms/assignments/all-submissions/${assignmentId}`);
            return response as any[];
        } catch (error) {
            return [];
        }
    },

    gradeAssignment: async (submissionId: string, score: number | null, feedback: string): Promise<any> => {
        return await api.post('/lms/assignments/grade', {
            submission_id: submissionId,
            score,
            feedback
        });
    },

    // Progress endpoints
    getProgressSummary: async (): Promise<Record<string, number>> => {
        return await api.get('/lms/progress/summary');
    },

    getEventProgress: async (eventId: string): Promise<string[]> => {
        return await api.get(`/lms/progress/event/${eventId}`);
    },

    markProgress: async (eventId: string, itemType: string, itemId: string): Promise<any> => {
        return await api.post('/lms/progress/mark', {
            event_id: eventId,
            item_type: itemType,
            item_id: itemId
        });
    },

    getEventGradebook: async (eventId: string): Promise<any> => {
        return await api.get(`/lms/gradebook/event/${eventId}`);
    }
};
