import { api } from '../lib/api';

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    image_url?: string;
    materials_url?: string;
    tasks_url?: string;
    certificate_url?: string;
    certificate_template?: string; // HTML Template
    is_registration_open: boolean;
    created_at: string;
    is_premium: boolean | number;
}

export interface EventParticipant {
    id: string;
    event_id: string;
    user_id: string;
    status: 'registered' | 'attended' | 'cancelled'; // Mapped from backend column
    // is_hadir & tugas_submitted might be legacy or part of status now
    is_hadir?: boolean;
    tugas_submitted?: boolean;
    task_url?: string;
    registered_at: string;
    events?: {
        title: string;
        date: string;
        location: string;
        certificate_url?: string;
        tasks_url?: string;
    };
}

export const eventService = {
    // Get all events
    async getEvents() {
        return await api.get<Event[]>('/events');
    },

    // Get single event
    async getEventById(id: string) {
        return await api.get<Event>(`/events/${id}`);
    },

    // Get upcoming events with my participation status
    async getUpcomingEvents() {
        return await api.get<any[]>('/events/upcoming');
    },

    // Get participation status for an event
    async getParticipation(id: string) {
        return await api.get<any>(`/events/${id}/participation`);
    },

    // Get my event history
    async getMyHistory() {
        return await api.get<EventParticipant[]>('/events/history');
    },

    // Join an event
    async joinEvent(eventId: string) {
        return await api.post(`/events/${eventId}/join`, {});
    },

    // Mark self attendance
    async markAttendance(eventId: string) {
        return await api.post(`/events/${eventId}/attendance`, {});
    }
};
