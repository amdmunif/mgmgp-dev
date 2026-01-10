export interface TemplateField {
    name: string;
    label: string;
    type: 'text' | 'date' | 'textarea' | 'number' | 'email';
    placeholder?: string;
    value?: string;
    options?: string[];
}

export interface LetterTemplate {
    id: string;
    name: string;
    description: string;
    fields: TemplateField[];
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
    {
        id: 'undangan-rapat',
        name: 'Undangan Rapat Pengurus',
        description: 'Surat undangan resmi untuk rapat koordinasi pengurus MGMP.',
        fields: [
            { name: 'no_surat', label: 'Nomor Surat', type: 'text', placeholder: '005/MGMP-INF/V/2024' },
            { name: 'lampiran', label: 'Lampiran', type: 'text', placeholder: '-' },
            { name: 'perihal', label: 'Perihal', type: 'text', placeholder: 'Undangan Rapat Koordinasi' },
            { name: 'tanggal_surat', label: 'Tanggal Surat', type: 'date' },
            { name: 'kepada', label: 'Kepada Yth', type: 'text', placeholder: 'Bapak/Ibu Pengurus' },
            { name: 'hari', label: 'Hari/Tanggal Acara', type: 'text', placeholder: 'Senin, 20 Mei 2024' },
            { name: 'waktu', label: 'Waktu', type: 'text', placeholder: '13.00 WIB - Selesai' },
            { name: 'tempat', label: 'Tempat', type: 'text', placeholder: 'RM. Sari Rasa Wonosobo' },
            { name: 'agenda', label: 'Agenda Rapat', type: 'textarea', placeholder: '1. Pembubaran Panitia\n2. Persiapan Workshop' },
        ]
    },
    {
        id: 'permohonan-narasumber',
        name: 'Permohonan Narasumber',
        description: 'Surat permohonan narasumber ke instansi atau perorangan.',
        fields: [
            { name: 'no_surat', label: 'Nomor Surat', type: 'text' },
            { name: 'perihal', label: 'Perihal', type: 'text', value: 'Permohonan Narasumber' },
            { name: 'tanggal_surat', label: 'Tanggal Surat', type: 'date' },
            { name: 'kepada', label: 'Kepada Yth', type: 'text' },
            { name: 'nama_kegiatan', label: 'Nama Kegiatan', type: 'text' },
            { name: 'hari', label: 'Hari/Tanggal', type: 'text' },
            { name: 'waktu', label: 'Waktu', type: 'text' },
            { name: 'tempat', label: 'Tempat', type: 'text' },
            { name: 'materi', label: 'Materi', type: 'text' },
        ]
    },
    {
        id: 'tugas',
        name: 'Surat Tugas',
        description: 'Surat penugasan anggota untuk mengikuti kegiatan.',
        fields: [
            { name: 'no_surat', label: 'Nomor Surat', type: 'text' },
            { name: 'tanggal_surat', label: 'Tanggal Surat', type: 'date' },
            { name: 'nama_tugas', label: 'Menugaskan Kepada', type: 'textarea', placeholder: 'Nama, NIP, Jabatan' },
            { name: 'tujuan_tugas', label: 'Untuk Mengikuti', type: 'textarea' },
        ]
    }
];
