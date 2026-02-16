import { api } from '../lib/api';
import type { NewsArticle, Event } from '../types';

export const contentManagementService = {
    // News
    async getAllNews() {
        return await api.get<NewsArticle[]>('/news');
    },
    async getNewsById(id: string) {
        return await api.get<NewsArticle>(`/news/${id}`);
    },
    async createNews(news: Omit<NewsArticle, 'id' | 'created_at' | 'author' | 'slug'>) {
        return await api.post<NewsArticle>('/news', news);
    },
    async updateNews(id: string, news: Partial<NewsArticle>) {
        return await api.put<NewsArticle>(`/news/${id}`, news);
    },
    async deleteNews(id: string) {
        return await api.delete(`/news/${id}`);
    },

    // Events
    async getAllEvents() {
        return await api.get<Event[]>('/events');
    },
    async getEventById(id: string) {
        return await api.get<Event>(`/events/${id}`);
    },
    async createEvent(event: Omit<Event, 'id' | 'created_at'>) {
        return await api.post<Event>('/events', event);
    },
    async updateEvent(id: string, event: Partial<Event>) {
        return await api.put<Event>(`/events/${id}`, event);
    },
    async deleteEvent(id: string) {
        return await api.delete(`/events/${id}`);
    },
    async getEventParticipants(eventId: string) {
        return await api.get<any[]>(`/events/${eventId}/participants`);
    },
    async updateParticipantStatus(eventId: string, userId: string, status: string) {
        return await api.put(`/events/${eventId}/participants/${userId}`, { status });
    },

    async updateParticipantsBulk(eventId: string, userIds: string[], status: string) {
        return await api.post(`/events/${eventId}/participants/bulk`, { user_ids: userIds, status });
    }
};
