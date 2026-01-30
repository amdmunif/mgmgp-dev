import { supabase } from '../lib/supabase';
import type { Event } from '../types';

export interface EventParticipation {
    id: string;
    event_id: string;
    user_id: string;
    status: 'registered' | 'attended' | 'cancelled';
    registered_at: string;
    events?: Event;
}

export const eventService = {
    // Get upcoming events with my participation status
    async getUpcomingEvents() {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Get all upcoming events
        const { data: events, error } = await supabase
            .from('events')
            .select('*')
            .gte('date', new Date().toISOString())
            .order('date', { ascending: true });

        if (error) throw error;

        // 2. Get my participations to map status
        let myParticipations: Record<string, string> = {};
        if (user) {
            const { data: parts } = await supabase
                .from('event_participants')
                .select('event_id, status')
                .eq('user_id', user.id);

            if (parts) {
                parts.forEach(p => {
                    myParticipations[p.event_id] = p.status;
                });
            }
        }

        return events?.map(event => ({
            ...event,
            participation_status: myParticipations[event.id] || null
        }));
    },

    // Get my event history (past or registered)
    async getMyHistory() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('event_participants')
            .select(`
                *,
                events (*)
            `)
            .eq('user_id', user.id)
            .order('registered_at', { ascending: false });

        if (error) throw error;
        return data as EventParticipation[];
    },

    async register(eventId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not logged in");

        const { data, error } = await supabase
            .from('event_participants')
            .insert({
                event_id: eventId,
                user_id: user.id,
                status: 'registered'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async cancel(eventId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not logged in");

        // We can either delete the row or set status to cancelled. 
        // Let's delete for simplicity as per migration "Users update own participation"? 
        // Actually migration allowed UPDATE. Let's delete row if we want "Cancel" to mean "Unregister".
        // But for history it's better to keep it?
        // Let's trying deleting first. If policy fails, we check generic "delete".
        // Wait, I only added UPDATE policy for user. I didn't add DELETE policy for user.
        // I added: CREATE POLICY "Users update own participation" ...
        // So I should UPDATE status to 'cancelled'.

        const { error } = await supabase
            .from('event_participants')
            .update({ status: 'cancelled' })
            .eq('event_id', eventId)
            .eq('user_id', user.id);

        if (error) throw error;
    }
};
