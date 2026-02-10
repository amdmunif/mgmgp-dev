import { api } from '../lib/api';

export interface ContactMessage {
    id?: number;
    name: string;
    email: string;
    message: string;
    created_at?: string;
}

export const contactService = {
    getAll: async () => {
        return await api.get<ContactMessage[]>('/contact');
    },
    send: async (data: ContactMessage) => {
        return await api.post<any>('/contact', data);
    },
    delete: async (id: number) => {
        return await api.delete<any>(`/contact/${id}`);
    }
};
