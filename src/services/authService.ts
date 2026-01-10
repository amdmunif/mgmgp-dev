import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export const authService = {
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Optionally fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return { user, profile: profile as Profile | null };
    },

    async login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    async register(email: string, password: string, userData: any) {
        // Prepare metadata for the Trigger
        const metadata = {
            nama: userData.nama,
            asal_sekolah: userData.asal_sekolah,
            no_hp: userData.no_hp,
            ukuran_baju: userData.ukuran_baju,
            status_kepegawaian: userData.status_kepegawaian,
            pendidikan_terakhir: userData.pendidikan_terakhir,
            jurusan: userData.jurusan,
            mapel_diampu: userData.mapel_diampu,
            kelas_mengajar: userData.kelas_mengajar,
            // We don't send foto_profile here because it needs file upload first
        };

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });

        if (error) throw error;

        return data;
    },

    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
        });
        if (error) throw error;
    },

    onAuthStateChange(callback: (user: any) => void) {
        return supabase.auth.onAuthStateChange((_event, session) => {
            callback(session?.user || null);
        });
    }
};
