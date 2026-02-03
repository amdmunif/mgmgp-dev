import { api } from '../lib/api';

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
        try {
            // Upload proof via PHP Upload (reusing settingsService upload or similar)
            // Using dynamic import to avoid circular dependency if any, or just cleaner.
            const { settingsService } = await import('./settingsService');
            const proofUrl = await settingsService.uploadLogo(file);

            if (!proofUrl) throw new Error("Gagal mendapatkan URL bukti pembayaran");

            return await api.post('/premium/create', {
                proof_url: proofUrl,
                ...bankInfo
            });
        } catch (e: any) {
            console.error("Submit request failed", e);
            throw new Error(e.message || "Gagal mengirim request upgrade");
        }
    },

    // Member: Check their latest request status
    async getMyLatestRequest() {
        return await api.get<PremiumRequest | null>('/premium/my-latest');
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

    // Admin: Get active subscribers
    async getActiveSubscribers() {
        return await api.get<{ id: string; nama: string; email: string; premium_until: string; }[]>('/premium/active');
    },

    // Admin: Extend subscription
    async extendSubscription(userId: string) {
        return await api.post('/premium/extend', { user_id: userId });
    },

    // Admin: Revoke subscription
    async revokeSubscription(userId: string) {
        return await api.post('/premium/revoke', { user_id: userId });
    }
};
