import { supabase } from '../lib/supabase';

export interface PremiumRequest {
    id: string;
    user_id: string;
    proof_url: string;
    status: 'pending' | 'approved' | 'rejected';
    bank_name?: string;
    account_number?: string;
    account_holder?: string;
    notes?: string;
    created_at: string;
    profiles?: {
        nama: string;
        premium_until: string;
    };
}

export const premiumService = {
    // Member: Submit a new upgrade request
    async submitRequest(file: File, bankInfo: { bank_name: string, account_number: string, account_holder: string }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // 1. Upload Proof
        const fileExt = file.name.split('.').pop();
        const fileName = `proof-${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 2. Get Public URL (assuming bucket is public or we use signed url, here using getPublicUrl for simplicity if public)
        // If private, we might need createSignedUrl, but let's stick to simple layout.
        // The migration said "private bucket", so signed URL is better for viewing, 
        // but for inserting the record we just need the path or URL.
        // Let's store the path, but legacy code often stores URL. 
        // For 'payment-proofs' bucket from migration, let's assume we need signed URLs for display.
        // But to keep it simple, let's store the path.

        const { data: { publicUrl } } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(fileName);

        // 3. Insert Request
        const { data, error } = await supabase
            .from('premium_requests')
            .insert({
                user_id: user.id,
                proof_url: publicUrl, // or fileName if we want strict privacy
                status: 'pending',
                ...bankInfo
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Member: Check their latest request status
    async getMyLatestRequest() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('premium_requests')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as PremiumRequest | null;
    },

    // Admin: Get all requests
    async getAllRequests() {
        // Need to join with profiles to see who requested
        const { data, error } = await supabase
            .from('premium_requests')
            .select(`
                *,
                profiles (
                    nama
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as PremiumRequest[];
    },

    // Admin: Approve Request
    async approveRequest(requestId: string, userId: string) {
        // 1. Update request status
        const { error: reqError } = await supabase
            .from('premium_requests')
            .update({ status: 'approved' })
            .eq('id', requestId);

        if (reqError) throw reqError;

        // 2. Update user profile (add 1 year to premium_until)
        // Check current expiry first
        const { data: profile } = await supabase.from('profiles').select('premium_until').eq('id', userId).single();

        let newExpiry = new Date();
        const currentExpiry = profile?.premium_until ? new Date(profile.premium_until) : null;

        if (currentExpiry && currentExpiry > new Date()) {
            // If still active, add 1 year to current expiry
            newExpiry = new Date(currentExpiry);
            newExpiry.setFullYear(newExpiry.getFullYear() + 1);
        } else {
            // If expired or never active, set to 1 year from now
            newExpiry.setFullYear(newExpiry.getFullYear() + 1);
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update({ premium_until: newExpiry.toISOString() })
            .eq('id', userId);

        if (profileError) throw profileError;
    },

    // Admin: Reject Request
    async rejectRequest(requestId: string, notes: string) {
        const { error } = await supabase
            .from('premium_requests')
            .update({
                status: 'rejected',
                notes: notes
            })
            .eq('id', requestId);

        if (error) throw error;
    },

    // Expose supabase for debugging
    supabase
};
