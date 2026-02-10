import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { contentManagementService } from '../../../services/contentManagementService';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';

interface NewsForm {
    title: string;
    content: string;
    category: string;
    image_url: string;
}

export function CreateNews() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { register, handleSubmit, setValue } = useForm<NewsForm>();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');

    useEffect(() => {
        if (id) {
            fetchNews();
        }
    }, [id]);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const data = await contentManagementService.getNewsById(id!);
            setValue('title', data.title);
            setValue('category', data.category);
            setValue('image_url', data.image_url);
            setContent(data.content);
        } catch (error) {
            console.error(error);
            alert('Gagal mengambil data berita');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: NewsForm) => {
        if (!content) {
            alert('Konten berita wajib diisi');
            return;
        }
        setSubmitting(true);
        try {
            if (id) {
                await contentManagementService.updateNews(id, { ...data, content });
            } else {
                await contentManagementService.createNews({ ...data, content });
            }
            navigate('/admin/news');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan berita');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 mb-6"><ArrowLeft className="w-4 h-4 mr-2" /> Kembali</button>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold mb-6">{id ? 'Edit Berita' : 'Tulis Berita Baru'}</h1>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Judul Berita</label>
                                <input {...register('title', { required: true })} className="w-full border rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Kategori</label>
                                <select {...register('category')} className="w-full border rounded-md p-2">
                                    <option value="Kegiatan">Kegiatan</option>
                                    <option value="Pengumuman">Pengumuman</option>
                                    <option value="Artikel">Artikel</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Konten</label>
                                <RichTextEditor
                                    value={content}
                                    onChange={(val) => setContent(val)}
                                    placeholder="Tulis isi berita di sini..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">URL Gambar Cover</label>
                                <input {...register('image_url')} className="w-full border rounded-md p-2" placeholder="https://..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : (id ? 'Update Berita' : 'Terbitkan')}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
