import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import { learningService } from '../../../services/learningService';
import type { MaterialType } from '../../../types';

interface MaterialForm {
    title: string;
    type: MaterialType;
    mapel: string;
    kelas: string;
    semester: number;
    content: string;
    is_premium: boolean;
}

export function CreateMaterial() {
    const navigate = useNavigate();
    const { register, handleSubmit, watch, formState: { errors } } = useForm<MaterialForm>({
        defaultValues: {
            type: 'cp',
            mapel: 'Informatika',
            semester: 1,
            is_premium: true
        }
    });

    const [submitting, setSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const selectedType = watch('type');

    const onSubmit = async (data: MaterialForm) => {
        setSubmitting(true);
        try {
            let fileUrl = undefined;
            if (file) {
                fileUrl = await learningService.uploadDocument(file);
            }

            await learningService.create({
                ...data,
                file_url: fileUrl,
                // Clean up fields based on type if needed, but keeping them is fine
            });

            navigate('/admin/learning');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan materi');
        } finally {
            setSubmitting(false);
        }
    };

    const isDocumentType = ['rpp', 'slide', 'modul'].includes(selectedType);

    return (
        <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Tambah Perangkat Ajar Baru</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Materi</label>
                            <input
                                {...register('title', { required: 'Judul wajib diisi' })}
                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Contoh: Modul Ajar Algoritma"
                            />
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Materi</label>
                            <select
                                {...register('type')}
                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="cp">Capaian Pembelajaran (CP)</option>
                                <option value="tp">Tujuan Pembelajaran (TP)</option>
                                <option value="rpp">Modul Ajar</option>
                                <option value="slide">Slide Presentasi</option>
                                <option value="modul">Bahan Bacaan / E-Book</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                            <select
                                {...register('mapel')}
                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="Informatika">Informatika</option>
                                <option value="KKA">KKA</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                            <select
                                {...register('kelas')}
                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">- Pilih Kelas -</option>
                                <option value="7">Kelas 7</option>
                                <option value="8">Kelas 8</option>
                                <option value="9">Kelas 9</option>
                            </select>
                        </div>
                    </div>

                    {!isDocumentType ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Konten / Deskripsi</label>
                            <textarea
                                {...register('content', { required: isDocumentType ? false : 'Konten wajib diisi untuk CP/TP' })}
                                className="w-full rounded-md border border-gray-300 py-2 px-3 h-40 focus:ring-2 focus:ring-primary-500"
                                placeholder="Tuliskan isi Capaian Pembelajaran atau Tujuan Pembelajaran di sini..."
                            ></textarea>
                            {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload File (PDF/PPTX)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <input
                                    type="file"
                                    accept=".pdf,.ppt,.pptx,.doc,.docx"
                                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                />
                                <p className="text-xs text-gray-400 mt-2">Max Size: 10MB</p>
                            </div>
                        </div>
                    )}

// Premium checkbox removed, assumed premium by default

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>Batal</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : 'Simpan Materi'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
