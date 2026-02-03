import { api } from '../lib/api';
import { settingsService } from './settingsService';

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
}

export interface EventParticipant {
    event_id: string;
    user_id: string;
    is_hadir: boolean;
    tugas_submitted: boolean;
    task_url?: string;
    registered_at: string;
}

export const eventService = {
    // Get all events
    async getEvents() {
        return await api.get<Event[]>('/events');
    },

    // Get upcoming events with my participation status
    async getUpcomingEvents() {
        return await api.get<any[]>('/events/upcoming');
    },

    // Get my event history
    async getMyHistory() {
        return await api.get<EventParticipant[]>('/events/history');
    },

    // Join an event
    async joinEvent(eventId: string) {
        return await api.post(`/events/${eventId}/join`, {});
    },

    // Cancel event participation
    async cancelParticipation(eventId: string) {
        const user = await settingsService.getUser();
        if (!user) throw new Error('User not logged in');

        const { error } = await api.from('event_participants')
            .update({ status: 'cancelled' })
            .eq('event_id', eventId)
            .eq('user_id', user.id);

        if (error) throw error;
    }
};
```
