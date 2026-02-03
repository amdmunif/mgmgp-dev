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
            .update({ status: 'cancelled' })
        .eq('event_id', eventId)
        .eq('user_id', user.id);

    if(error) throw error;
}
};
