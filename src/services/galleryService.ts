import { api } from '../lib/api';

export interface GalleryImage {
    id: string;
    image_url: string;
    caption: string;
    event_id?: string;
    created_at: string;
}

export const galleryService = {
    getAll: async () => {
        const response = await api.get<GalleryImage[]>('/gallery');
        return response;
    }
};
