import { api } from '../lib/api';

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    total_days?: number;
    location: string;
    image_url?: string;
    materials_url?: string;
    tasks_url?: string;
    certificate_url?: string;
    certificate_template?: string; // HTML Template
    is_registration_open: boolean | number;
    registration_deadline?: string;
    created_at: string;
    is_premium: boolean | number;
    is_paid?: boolean | number;
    price?: number;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_holder?: string;
    quota?: number;
    participants_count?: number;
    has_lms?: boolean | number;
}

export interface EventParticipant {
    id: string;
    event_id: string;
    user_id: string;
    status: 'registered' | 'attended' | 'cancelled'; // Mapped from backend column
    // is_hadir & tugas_submitted might be legacy or part of status now
    is_hadir?: boolean;
    is_passed?: number | boolean;
    tugas_submitted?: boolean;
    task_url?: string;
    payment_status?: 'free' | 'pending' | 'waiting_confirmation' | 'confirmed' | 'rejected';
    payment_proof_url?: string;
    payment_date?: string;
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
    },

    // Upload payment proof
    async uploadPaymentProof(eventId: string, proofUrl: string) {
        return await api.post(`/events/${eventId}/upload-payment`, { proof_url: proofUrl });
    }
};
