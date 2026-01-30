import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Loader2, Terminal } from 'lucide-react';
import { promptService } from '../../../services/resourcesService';

interface PromptForm {
    title: string;
    description: string;
    prompt_content: string;
    category: string;
    example_result: string;
    is_premium: boolean;
}

export function CreatePrompt() {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm<PromptForm>({
        defaultValues: {
            is_premium: true
        }
    });

    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (data: PromptForm) => {
        setSubmitting(true);
        try {
            await promptService.create({
                ...data,
                tags: [] // Default empty tags for now
            });
            navigate('/admin/prompts');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan prompt');
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
                    <div className="p-3 bg-gray-100 rounded-xl text-gray-600">
                        <Terminal className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Tambah Prompt Baru</h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Prompt</label>
                        <input
                            {...register('title', { required: 'Judul wajib diisi' })}
                            className="w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="Contoh: Membuat RPP Berdiferensiasi"
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select
                            {...register('category', { required: 'Kategori wajib dipilih' })}
                            className="w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                            <option value="">Pilih Kategori</option>
                            <option value="Teaching">Teaching / Pendidikan</option>
                            <option value="Coding">Coding / Pemrograman</option>
                            <option value="Writing">Writing / Penulisan</option>
                            <option value="Productivity">Productivity / Produktivitas</option>
                        </select>
                        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat</label>
                        <input
                            {...register('description', { required: 'Deskripsi wajib diisi' })}
                            className="w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="Penjelasan singkat tentang kegunaan prompt ini"
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Isi Prompt</label>
                        <textarea
                            {...register('prompt_content', { required: 'Isi prompt wajib diisi' })}
                            className="w-full rounded-lg border border-gray-300 py-2.5 px-3 h-48 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-sm bg-gray-50"
                            placeholder="Tuliskan prompt lengkap disini..."
                        />
                        {errors.prompt_content && <p className="text-red-500 text-xs mt-1">{errors.prompt_content.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contoh Hasil (Opsional)</label>
                        <textarea
                            {...register('example_result')}
                            className="w-full rounded-lg border border-gray-300 py-2.5 px-3 h-32 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="Contoh output yang dihasilkan oleh prompt ini (untuk referensi user)..."
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <input
                            type="checkbox"
                            id="is_premium"
                            {...register('is_premium')}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="is_premium" className="text-sm font-medium text-gray-700">Set sebagai Konten Premium</label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>Batal</Button>
                        <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-700">
                            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : 'Simpan Prompt'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
