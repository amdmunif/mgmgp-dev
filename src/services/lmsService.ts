import type { LmsTopic, LmsMaterial, LmsQuiz } from '../types';

export const lmsService = {
    // Topik
    getTopicsByEvent: async (_eventId: string): Promise<LmsTopic[]> => {
        // Mock data
        return [
            { id: 't1', event_id: _eventId, title: 'Pendahuluan', order_num: 1 },
            { id: 't2', event_id: _eventId, title: 'Materi Utama', order_num: 2 }
        ];
    },

    saveTopic: async (topic: Partial<LmsTopic>): Promise<any> => {
        return { success: true, data: { ...topic, id: topic.id || 'new-t-id' } };
    },

    deleteTopic: async (_id: string): Promise<any> => {
        return { success: true };
    },

    // Materi
    getMaterialsByTopic: async (_topicId: string): Promise<LmsMaterial[]> => {
        // Mock data
        if (_topicId === 't1') {
            return [
                { id: 'm1', topic_id: _topicId, title: 'Video Pengantar', type: 'video', order_num: 1 },
                { id: 'm2', topic_id: _topicId, title: 'Pretest', type: 'quiz', order_num: 2 }
            ];
        }
        return [
            { id: 'm3', topic_id: topicId, title: 'Modul PDF', type: 'pdf', order_num: 1 }
        ];
    },

    saveMaterial: async (material: Partial<LmsMaterial>): Promise<any> => {
        return { success: true, data: { ...material, id: material.id || 'new-m-id' } };
    },

    deleteMaterial: async (id: string): Promise<any> => {
        return { success: true };
    },

    // Kuis
    getQuizByMaterialId: async (materialId: string): Promise<LmsQuiz | null> => {
        if (materialId === 'm2') {
            return {
                id: 'q1',
                topic_id: 't1',
                title: 'Pretest',
                duration_minutes: 30,
                passing_score: 70,
                max_attempts: 1,
                order_num: 2
            };
        }
        return null;
    }
};
