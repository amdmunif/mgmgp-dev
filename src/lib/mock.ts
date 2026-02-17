import { type NewsArticle, type Event } from '../types';

export const MOCK_NEWS: NewsArticle[] = [
    {
        id: '1',
        title: 'Workshop Implementasi Kurikulum Merdeka 2024',
        content: 'MGMP Informatika menyelenggarakan workshop intensif selama 3 hari...',
        author: { name: 'Admin MGMP' },
        image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070',
        created_at: '2024-03-15T08:00:00Z',
        slug: 'workshop-ikm-2024',
        category: 'Workshop'
    },
    {
        id: '2',
        title: 'Lomba Coding Tingkat SMP se-Kabupaten',
        content: 'Persiapkan siswa-siswi terbaikmu untuk mengikuti kompetisi coding tahunan...',
        author: { name: 'Divisi Lomba' },
        image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070',
        created_at: '2024-04-02T10:30:00Z',
        slug: 'lomba-coding-smp',
        category: 'Kompetisi'
    },
    {
        id: '3',
        title: 'Rapat Koordinasi Persiapan Ujian Sekolah',
        content: 'Menindaklanjuti edaran dinas, kami mengundang seluruh pengurus...',
        author: { name: 'Sekretaris' },
        image_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070',
        created_at: '2024-04-10T13:00:00Z',
        slug: 'rakor-ujian-sekolah',
        category: 'Internal'
    }
];

export const MOCK_EVENTS: Event[] = [
    {
        id: '1',
        title: 'Workshop Kurikulum Merdeka',
        description: 'Bedah tuntas implementasi Kurikulum Merdeka pada mata pelajaran Informatika.',
        date: '2024-03-15 08:00:00',
        location: 'Aula SMAN 1 Kota',
        image_url: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2000&auto=format&fit=crop',
        is_registration_open: true,
        is_premium: false
    },
    {
        id: '2',
        title: 'Pelatihan Python Basics',
        description: 'Pengenalan dasar pemrograman Python untuk guru.',
        date: '2024-04-10 09:00:00',
        location: 'Lab Komputer SMAN 3',
        image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2000&auto=format&fit=crop',
        is_registration_open: false,
        is_premium: true
    }
];

export const MOCK_GALLERY = [
    {
        id: 'g1',
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070',
        caption: 'Peserta Workshop IKM 2024 antusias mengikuti materi',
        eventId: '1'
    },
    {
        id: 'g2',
        imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070',
        caption: 'Sesi tanya jawab dengan narasumber',
        eventId: '1'
    },
    {
        id: 'g3',
        imageUrl: 'https://images.unsplash.com/photo-1577896333050-79830d30cff0?q=80&w=2070',
        caption: 'Foto bersama panitia Lomba Coding',
        eventId: '2'
    },
    {
        id: 'g4',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070',
        caption: 'Suasana ujian praktik coding',
        eventId: '2'
    }
];

export const MOCK_PROFILE = {
    visi: "Terwujudnya MGMP Informatika Kabupaten Wonosobo sebagai wadah profesionalisme guru yang inovatif, kolaboratif, dan berprestasi dalam mewujudkan pendidikan berkualitas.",
    misi: [
        "Meningkatkan kompetensi profesional guru Informatika melalui berbagai pelatihan dan workshop.",
        "Memfasilitasi pertukaran pengalaman dan praktik baik dalam pembelajaran Informatika.",
        "Mengembangkan perangkat pembelajaran yang adaptif terhadap perkembangan teknologi.",
        "Membangun jejaring kerjasama dengan berbagai pihak untuk kemajuan pendidikan."
    ],
    sejarah: "MGMP Informatika Kabupaten Wonosobo didirikan pada tahun 2010 sebagai respon terhadap kebutuhan wadah komunikasi guru TIK saat itu. Seiring perubahan kurikulum menjadi Informatika, organisasi ini terus bertransformasi...",
    struktur: [
        { jabatan: "Ketua", nama: "Budi Santoso, S.Kom", nip: "19800101 200501 1 001", image: "https://randomuser.me/api/portraits/men/1.jpg" },
        { jabatan: "Sekretaris", nama: "Siti Aminah, S.Pd", nip: "19820505 200604 2 005", image: "https://randomuser.me/api/portraits/women/2.jpg" },
        { jabatan: "Bendahara", nama: "Dewi Lestari, S.Kom", nip: "19850303 200801 2 009", image: "https://randomuser.me/api/portraits/women/3.jpg" },
    ]
};

export const MOCK_LEARNING = {
    cp: [
        { id: 'cp1', mapel: 'Informatika', title: 'Capaian Pembelajaran Fase D', content: 'Pada akhir fase D, peserta didik mampu memahami dampak dan menerapkan etika sebagai warga digital, memahami komponen, fungsi, cara kerja, dan kodifikasi data sebuah komputer...' },
        { id: 'cp2', mapel: 'Informatika', title: 'Capaian Pembelajaran Fase E', content: 'Pada akhir fase E, peserta didik mampu menerapkan strategi algoritmik standar pada kehidupan sehari-hari maupun implementasinya dalam sistem komputer...' },
    ],
    tp: [
        { id: 'tp1', mapel: 'Informatika', kelas: '7', semester: '1', materi: 'Berpikir Komputasional', tujuan: 'Peserta didik mampu menerapkan berpikir komputasional untuk menyelesaikan persoalan secara logis.' },
        { id: 'tp2', mapel: 'Informatika', kelas: '7', semester: '1', materi: 'TIK', tujuan: 'Peserta didik mampu memanfaatkan aplikasi surel untuk menunjang pekerjaan.' },
        { id: 'tp3', mapel: 'Informatika', kelas: '8', semester: '1', materi: 'Jaringan Komputer', tujuan: 'Peserta didik mampu memahami cara kerja internet dan jaringan lokal.' },
    ]
};
