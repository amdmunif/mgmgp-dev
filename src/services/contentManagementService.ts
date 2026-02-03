import { api } from '../lib/api';
import type { NewsArticle, Event } from '../types';

export const contentManagementService = {
    // News
    async getAllNews() {
        return await api.get<NewsArticle[]>('/news');
    },
    async createNews(news: Omit<NewsArticle, 'id' | 'created_at' | 'author' | 'slug'>) {
        return await api.post<NewsArticle>('/news', news);
    },
    async deleteNews(id: string) {
        return await api.delete(`/news/${id}`);
    },

    // Events
    async getAllEvents() {
        return await api.get<Event[]>('/events');
    },
    async createEvent(event: Omit<Event, 'id' | 'created_at'>) {
        return await api.post<Event>('/events', event);
    },
    async deleteEvent(id: string) {
        return await api.delete(`/events/${id}`);
    }
};
