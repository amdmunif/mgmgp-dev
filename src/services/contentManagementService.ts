import { supabase } from '../lib/supabase';
import type { NewsArticle, Event } from '../types';

export const contentManagementService = {
    // News
    async getAllNews() {
        const { data, error } = await supabase.from('news_articles').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data as NewsArticle[];
    },
    async createNews(news: Omit<NewsArticle, 'id' | 'created_at' | 'author' | 'slug'>) {
        // Simple slug generation
        const slug = news.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const { data, error } = await supabase.from('news_articles').insert({ ...news, slug }).select().single();
        if (error) throw error;
        return data as NewsArticle;
    },
    async deleteNews(id: string) {
        const { error } = await supabase.from('news_articles').delete().eq('id', id);
        if (error) throw error;
    },

    // Events
    async getAllEvents() {
        const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
        if (error) throw error;
        return data as Event[];
    },
    async createEvent(event: Omit<Event, 'id' | 'created_at'>) {
        const { data, error } = await supabase.from('events').insert(event).select().single();
        if (error) throw error;
        return data as Event;
    },
    async deleteEvent(id: string) {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
    }
};
