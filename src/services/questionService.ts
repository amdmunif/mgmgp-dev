import { supabase } from '../lib/supabase';
import type { QuestionBank } from '../types';

export const questionService = {
    async getAll() {
        const { data, error } = await supabase
            .from('question_banks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as QuestionBank[];
    },

    async create(question: Omit<QuestionBank, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('question_banks')
            .insert(question)
            .select()
            .single();

        if (error) throw error;
        return data as QuestionBank;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('question_banks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
