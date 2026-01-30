import { api } from '../lib/api';
// import type { Profile } from '../types';

export const authService = {
    async getCurrentUser() {
        const token = localStorage.getItem('access_token');
        if (!token) return null;

        // Improve: Call API to validate token or get fresh profile
        // For now, return what we have in storage or basic object
        try {
            // Decoded JWT payload logic could go here or a specific /auth/me endpoint
            // For now, let's assume valid session if token exists, and profile will be loaded by components
            // To be robust, let's add a simple User check:
            const userStr = localStorage.getItem('user_data');
            if (userStr) return { user: JSON.parse(userStr), profile: JSON.parse(userStr) };

            return { user: { email: 'user@example.com' }, profile: null };
        } catch (e) {
            return null;
        }
    },

    async login(email: string, password: string) {
        const response = await api.post<any>('/auth/login', { email, password });
        if (response.session?.access_token) {
            localStorage.setItem('access_token', response.session.access_token);
            localStorage.setItem('user_data', JSON.stringify({ ...response.user, ...response.profile })); // Save basic user info
        }
        return response;
    },

    async register(email: string, password: string, userData: any) {
        const response = await api.post<any>('/auth/register', {
            email,
            password,
            nama: userData.nama,
            data: userData // Pass other fields as misc data
        });
        if (response.session?.access_token) {
            localStorage.setItem('access_token', response.session.access_token);
            localStorage.setItem('user_data', JSON.stringify(response.user));
        }
        return response;
    },

    async logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
    },

    async resetPassword(_email: string) {
        // TODO: Implement PHP endpoint for reset password
        alert('Fitur Reset Password belum tersedia di server baru.');
    },

    onAuthStateChange(callback: (user: any) => void) {
        // Mocking Supabase subscription
        // In custom auth, we usually check token existence on load
        const token = localStorage.getItem('access_token');
        if (token) {
            const userStr = localStorage.getItem('user_data');
            callback(userStr ? JSON.parse(userStr) : { email: 'active' });
        } else {
            callback(null);
        }

        // Return dummy unsubscribe
        return { data: { subscription: { unsubscribe: () => { } } } };
    }
};
