import { supabase } from '../lib/supabase';

export interface AppSettings {
    id: number;
    site_title: string;
    site_description?: string;
    logo_url?: string;
    email?: string;
    phone?: string;
    address?: string;
    bank_name?: string;
    bank_number?: string;
    bank_holder?: string;
    premium_price?: number;
}

export const settingsService = {
    async getSettings() {
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) throw error;
        return data as AppSettings;
    },

    async updateSettings(updates: Partial<AppSettings>) {
        const { data, error } = await supabase
            .from('app_settings')
            .update(updates)
            .eq('id', 1)
            .select()
            .single();

        if (error) throw error;
        return data as AppSettings;
    },

    async uploadLogo(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('site-assets')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('site-assets')
            .getPublicUrl(filePath);

        return publicUrl;
    }
};
