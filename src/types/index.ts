export interface Profile {
    id: string;
    nama: string;
    role: 'Admin' | 'Pengurus' | 'Anggota';
    email: string;
    avatar_url?: string;
}

export interface NewsArticle {
    id: string;
    title: string;
    content: string; // HTML content or rich text
    author: {
        name: string;
        avatar_url?: string;
    };
    image_url: string;
    created_at: string;
    slug: string;
    category: string;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    image_url: string;
    is_registration_open: boolean;
    participants_count?: number;
}

export type MaterialType = 'cp' | 'tp' | 'rpp' | 'slide' | 'modul';

export interface LearningMaterial {
    id: string;
    title: string;
    type: MaterialType;
    mapel: string;
    kelas?: string;
    semester?: number;
    content?: string;
    file_url?: string;
    is_premium: boolean;
    created_at: string;
    author_id?: string;
}

export interface QuestionBank {
    id: string;
    title: string;
    mapel: string;
    category: 'Ulangan' | 'Latihan' | 'TTS' | 'Wordsearch';
    file_url?: string;
    game_data?: any;
    is_premium: boolean;
    created_at: string;
}

export interface Prompt {
    id: string;
    title: string;
    description: string;
    prompt_content: string;
    category: string;
    tags: string[];
    is_premium: boolean;
    created_at: string;
}

export interface Reference {
    id: string;
    title: string;
    type: 'Buku' | 'Simulator' | 'Game';
    link_url: string;
    cover_image?: string;
    description?: string;
    is_premium: boolean;
    created_at: string;
}



