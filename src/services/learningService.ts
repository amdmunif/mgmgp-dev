import { supabase } from '../lib/supabase';
import type { LearningMaterial, MaterialType } from '../types';

export const learningService = {
    async getAll(type?: MaterialType) {
        let query = supabase
            .from('learning_materials')
            .select('*')
            .order('created_at', { ascending: false });

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as LearningMaterial[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('learning_materials')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as LearningMaterial;
    },

    async create(material: Omit<LearningMaterial, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('learning_materials')
            .insert(material)
            .select()
            .single();

        if (error) throw error;
        return data as LearningMaterial;
    },

    async update(id: string, updates: Partial<LearningMaterial>) {
        const { data, error } = await supabase
            .from('learning_materials')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as LearningMaterial;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('learning_materials')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async uploadDocument(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        return publicUrl;
    }
};
