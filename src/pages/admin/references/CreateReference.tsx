import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Loader2, Book } from 'lucide-react';
import { referenceService } from '../../../services/resourcesService';

interface RefForm {
    title: string;
    description: string;
    type: 'Buku' | 'Simulator' | 'Game';
    link_url: string;
    is_premium: boolean;
}

export function CreateReference() {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm<RefForm>({
        defaultValues: {
            is_premium: true
        }
    });

    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (data: RefForm) => {
        setSubmitting(true);
        try {
            await referenceService.create(data);
            navigate('/admin/references');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan referensi');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                        <Book className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Tambah Referensi Baru</h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Referensi</label>
                        <input
                            {...register('title', { required: 'Judul wajib diisi' })}
                            className="w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Contoh: E-Book Informatika Kelas 7"
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                        <select
                            {...register('type', { required: 'Tipe wajib dipilih' })}
                            className="w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="">Pilih Tipe</option>
                            <option value="Buku">Buku Digital (E-Book)</option>
                            <option value="Simulator">Simulator / web interaktif</option>
                            <option value="Game">Game Edukasi</option>
                        </select>
                        {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link URL / Download</label>
                        <input
                            {...register('link_url', { required: 'Link wajib diisi' })}
                            className="w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="https://..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Masukkan link dokumen (GDocs/Drive) atau link website.</p>
                        {errors.link_url && <p className="text-red-500 text-xs mt-1">{errors.link_url.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat</label>
                        <textarea
                            {...register('description')}
                            className="w-full rounded-lg border border-gray-300 py-2.5 px-3 h-24 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Jelaskan tentang referensi ini..."
                        />
                    </div>



                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>Batal</Button>
                        <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : 'Simpan Referensi'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
