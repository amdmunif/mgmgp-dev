export interface Profile {
    id: string;
    nama: string;
    role: 'Admin' | 'Pengurus' | 'Anggota';
    email: string;
    avatar_url?: string;
    foto_profile?: string; // Standardized field from DB
    premium_until?: string | null;
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
    code?: string; // New field for TP Code
    mapel: string;
    kelas?: string;
    semester?: number;
    content?: string;
    file_url?: string;
    link_url?: string;
    is_premium: boolean;
    created_at: string;
    author_id?: string;
}

export interface QuestionOption {
    id: string;
    text: string;
    is_correct: boolean;
}

export interface Question {
    id: string;
    type: 'single_choice' | 'multiple_choice' | 'true_false' | 'essay';
    content: string; // Using content instead of text to match DB
    options?: QuestionOption[];
    points: number;
    tp_id?: string;
    tp_code?: string;
    mapel: string;
    kelas: string;
    level: string;
}

export interface QuestionBank {
    id: string;
    title: string;
    mapel: string;
    category: 'Ulangan' | 'Latihan' | 'TTS' | 'Wordsearch';
    file_url?: string;
    game_data?: {
        questions: Question[];
    } | null;
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
    example_result?: string;
    example_type?: 'text' | 'image' | 'link';
    is_premium: boolean;
    created_at: string;
}

export interface Game {
    id: string;
    title: string;
    description: string;
    link_url: string;
    image_url?: string;
    plays_count: number;
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

export interface SiteSettings {
    site_title: string;
    site_description: string;
    logo_url: string;
    email: string;
    phone: string;
    address: string;
    profile_visi: string;
    profile_misi: string; // JSON string or array
    profile_sejarah: string;
    profile_struktur: string; // JSON string or array
    home_hero_title?: string;
    home_hero_subtitle?: string;
    home_hero_image?: string;
}

export interface CPData {
    id: string;
    mapel: 'Informatika' | 'KKA';
    content: string;
    materi?: string;
    updated_by?: string;
    updated_at?: string;
}

export interface TPData {
    id: string;
    mapel: 'Informatika' | 'KKA';
    kelas: '7' | '8' | '9';
    semester: 'Ganjil' | 'Genap';
    code?: string; // TP Code e.g. "7.1.1"
    materi: string; // Scope/Topic
    tujuan: string;
    created_by?: string;
    created_at?: string;
}
