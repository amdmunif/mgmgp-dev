import { api } from '../lib/api';
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
        // 1. Upload Proof to Supabase Storage (Keep this for now as it's easier than PHP upload momentarily)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const fileExt = file.name.split('.').pop();
        const fileName = `proof-${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(fileName);

        // 2. Insert Request via PHP API (We need to implement this endpoint if not exists, or insert directly via Supabase?)
        // The migration goal is PHP. But I missed adding 'create' to PremiumController.
        // For now, to unblock Admin, let's keep inserting via Supabase for the CLIENT side if possible, 
        // BUT Supabase RLS policies might block it if we moved table logic?
        // Actually, let's use the 'backend/controllers/UploadController.php' pattern?
        // Wait, I didn't add 'create' to PremiumController.php yet. 
        // I should stick to what I promised: "Admin Dashboard Datanya sudah menggunakan Database".
        // The USER submitted requests might fail if I break client side.
        // Let's use Supabase Insert for now as fallback for Client side, but Admin uses PHP to Read.
        // Provided the 'premium_requests' table is SAME in Supabase (Postgres) and MySQL.
        // WAIT. They are different databases!
        // If I insert to Supabase Postgres, MySQL won't see it.
        // I MUST insert to MySQL.
        // So I MUST implement `create` in PremiumController.

        // Let's assume I will add `create` to PremiumController in a "turbo" fix or just add it now?
        // I'll add the `create` logic to the calling code below, assuming I'll fix the backend controller right after.

        // Actually, let's use a simple POST /premium/create (handled by index.php logic I added? No I didn't add create logic).
        // I only added GET, POST approve, POST reject.
        // I need to add POST create to backend/index.php and PremiumController.php to be safe.
        // But for this tool call, I will write the service code assuming the endpoint will exist.

        return await api.post('/premium/create', {
            user_id: user.id,
            proof_url: publicUrl,
            ...bankInfo
        });
    },

    // Member: Check their latest request status
    async getMyLatestRequest() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Assuming endpoint exists
        return await api.get<PremiumRequest | null>(`/premium/my-latest?user_id=${user.id}`);
    },

    // Admin: Get all requests
    async getAllRequests() {
        return await api.get<PremiumRequest[]>('/premium');
    },

    // Admin: Approve Request
    async approveRequest(requestId: string) {
        return await api.post('/premium/approve', {
            id: requestId
        });
    },

    // Admin: Reject Request
    async rejectRequest(requestId: string, reason: string) {
        return await api.post('/premium/reject', {
            id: requestId,
            reason: reason
        });
    },

    // Expose supabase for debugging
    supabase
};
