import { z } from 'zod';

export const registerSchema = z.object({
    // Identitas Diri
    nama: z.string().min(3, 'Nama lengkap harus diisi (min 3 karakter)'),
    gelar: z.string().optional(),
    no_hp: z.string().min(10, 'Nomor HP tidak valid').regex(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, 'Format nomor HP tidak valid (contoh: 081234567890)'),
    ukuran_baju: z.enum(['S', 'M', 'L', 'XL', 'XXL', 'XXXL']),

    // Data Profesi
    asal_sekolah: z.string().min(3, 'Asal sekolah harus diisi'),
    status_kepegawaian: z.enum(['PNS', 'PPPK', 'GTY', 'GTT', 'Honorer', 'Lainnya']),
    pendidikan_terakhir: z.enum(['D3', 'S1', 'S2', 'S3']),
    jurusan: z.string().min(2, 'Jurusan harus diisi'),

    // Teaching Info
    mapel_diampu: z.array(z.string()).min(1, 'Pilih minimal satu mata pelajaran'),
    mapel_lainnya: z.string().optional(),
    kelas_mengajar: z.array(z.string()).min(1, 'Pilih minimal satu jenjang kelas'),

    // Akun
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),

    // File
    foto_profil: z.any()
        .optional()
        .refine((files) => !files || files.length === 0 || files[0].size <= 2000000, "Ukuran maksimal 2MB")
        .refine((files) => !files || files.length === 0 || ['image/jpeg', 'image/png', 'image/jpg'].includes(files[0].type), "Format harus JPG/PNG"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
