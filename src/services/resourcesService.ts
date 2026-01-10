import { supabase } from '../lib/supabase';
import type { Prompt, Reference } from '../types';

export const promptService = {
    async getAll() {
        const { data, error } = await supabase.from('prompt_library').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data as Prompt[];
    }
};

export const referenceService = {
    async getAll() {
        const { data, error } = await supabase.from('learning_references').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data as Reference[];
    }
};
