import { supabase } from '../lib/supabase';

export interface LetterData {
    template_id: string;
    letter_number: string;
    letter_date: string;
    subject: string;
    recipient: string;
    author_id: string;
    content: string; // JSON string or HTML
    form_data: any;
}

export const letterService = {
    async getLetters(userId: string) {
        const { data, error } = await supabase
            .from('letters')
            .select('*')
            .eq('author_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async createLetter(letterData: LetterData) {
        const { error } = await supabase
            .from('letters')
            .insert(letterData);

        if (error) throw error;
    },

    async deleteLetter(id: string) {
        const { error } = await supabase
            .from('letters')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
