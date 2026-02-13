import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Loader2, File as FileIcon } from 'lucide-react';
import { learningService } from '../../../services/learningService';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import type { MaterialType } from '../../../types';

interface MaterialForm {
    title: string;
    type: MaterialType;
    code?: string;
    mapel: string;
    kelas: string;
    semester: number;
    content: string;
    is_premium: boolean;
    link_url?: string;
}

export function CreateMaterial() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MaterialForm>({
        defaultValues: {
            type: 'rpp',
            mapel: 'Informatika',
            semester: 1,
            is_premium: true
        }
    });

    const [submitting, setSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchMaterial();
        }
    }, [id]);

    const fetchMaterial = async () => {
        setLoading(true);
        try {
            const data = await learningService.getById(id!);
            setValue('title', data.title);
            setValue('type', data.type);
            setValue('mapel', data.mapel);
            setValue('kelas', data.kelas || '');
            setValue('semester', data.semester || 1);
            setValue('code', data.code);
            setValue('link_url', data.link_url);
            setExistingFileUrl(data.file_url || null);
            setContent(data.content || '');
        } catch (error) {
            console.error(error);
            alert('Gagal mengambil data materi');
        } finally {
            setLoading(false);
        }
    };
    const selectedType = watch('type');

    const onSubmit = async (data: MaterialForm) => {
        if (isDocumentType && !file && !data.link_url && !id) {
            alert('Silakan upload file atau masukkan Link URL!');
            return;
        }

        setSubmitting(true);
        try {
            let fileUrl = undefined;
            if (file) {
                fileUrl = await learningService.uploadDocument(file);
            }

            // Sanitize data
            const cleanData = {
                ...data,
                content: content,
                is_premium: data.is_premium,
                file_url: fileUrl,
                link_url: data.link_url,
            };

            if (id) {
                await learningService.update(id, cleanData);
            } else {
                await learningService.create(cleanData);
            }

            navigate('/admin/learning');
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan data';
            alert(`Gagal menyimpan materi: ${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };

    const isDocumentType = ['rpp', 'slide', 'modul'].includes(selectedType);

    return (
        <div className="w-full">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">
                            {id ? 'Edit Perangkat Ajar' : 'Tambah Perangkat Ajar Baru'}
                        </h1>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Main Content Column */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Materi</label>
                                        <input
                                            {...register('title', { required: 'Judul wajib diisi' })}
                                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg font-medium"
                                            placeholder="Contoh: Modul Ajar Algoritma"
                                        />
                                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Konten / Deskripsi <span className="text-gray-400 font-normal text-xs">(Opsional)</span>
                                        </label>
                                        <div className="min-h-[300px]">
                                            <RichTextEditor
                                                value={content}
                                                onChange={(val) => setContent(val)}
                                                placeholder="Tuliskan deskripsi tambahan, Capaian Pembelajaran atau Tujuan Pembelajaran di sini..."
                                            />
                                        </div>
                                        {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
                                    </div>
                                </div>

                                {/* Sidebar / Meta Info Column */}
                                <div className="space-y-6 bg-gray-50 p-6 rounded-xl h-fit sticky top-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Materi</label>
                                        <select
                                            {...register('type')}
                                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-primary-500 bg-white"
                                        >
                                            <option value="rpp">Modul Ajar</option>
                                            <option value="slide">Slide Presentasi</option>
                                            <option value="modul">Bahan Bacaan / E-Book</option>
                                        </select>
                                    </div>

                                    {selectedType === 'tp' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kode TP (Contoh: 7.1.1)</label>
                                            <input
                                                {...register('code')}
                                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-primary-500 bg-white"
                                                placeholder="Masukkan kode TP..."
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                                            <select
                                                {...register('mapel')}
                                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-primary-500 bg-white"
                                            >
                                                <option value="Informatika">Informatika</option>
                                                <option value="KKA">KKA</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                                            <select
                                                {...register('kelas')}
                                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-primary-500 bg-white"
                                            >
                                                <option value="">- Pilih -</option>
                                                <option value="7">Kelas 7</option>
                                                <option value="8">Kelas 8</option>
                                                <option value="9">Kelas 9</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                        <select
                                            {...register('semester', { valueAsNumber: true })}
                                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-primary-500 bg-white"
                                        >
                                            <option value="1">Semester 1 (Ganjil)</option>
                                            <option value={2}>Semester 2 (Genap)</option>
                                        </select>
                                    </div>

                                    {isDocumentType && (
                                        <div className="border-t border-gray-200 pt-4 mt-4">
                                            <h3 className="text-sm font-medium text-gray-700 mb-3">File / Link Materi</h3>
                                            <div className="space-y-4">
                                                {existingFileUrl && !file && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="bg-blue-100 p-1.5 rounded">
                                                                <FileIcon className="w-3.5 h-3.5 text-blue-600" />
                                                            </div>
                                                            <p className="text-xs font-medium text-blue-900">File Terupload:</p>
                                                        </div>
                                                        <a href={existingFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all block pl-7">
                                                            {existingFileUrl.split('/').pop()}
                                                        </a>
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                                        {existingFileUrl ? 'Ganti File' : 'Upload File (PDF/PPTX)'}
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.ppt,.pptx,.doc,.docx"
                                                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                                            className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="relative flex py-1 items-center">
                                                    <div className="flex-grow border-t border-gray-200"></div>
                                                    <span className="flex-shrink-0 mx-2 text-gray-300 text-[10px]">ATAU LINK</span>
                                                    <div className="flex-grow border-t border-gray-200"></div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Link Eksternal</label>
                                                    <input
                                                        {...register('link_url')}
                                                        className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 mt-6 border-t border-gray-200 flex flex-col gap-2">
                                        <Button type="submit" disabled={submitting} className="w-full">
                                            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : (id ? 'Update Materi' : 'Simpan Materi')}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-full bg-white">Batal</Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
