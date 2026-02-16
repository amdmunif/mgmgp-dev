import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Loader2, Image as ImageIcon, Calendar, MapPin, Type } from 'lucide-react';
import { contentManagementService } from '../../../services/contentManagementService';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';

interface EventForm {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    image_url: string;
    is_registration_open: boolean;
}

export function CreateEvent() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EventForm>();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    // Watch image_url for external changes or initial load
    const imageUrl = watch('image_url');

    useEffect(() => {
        if (id) {
            fetchEvent();
        }
    }, [id]);

    useEffect(() => {
        if (imageUrl) setPreviewUrl(imageUrl);
    }, [imageUrl]);

    const fetchEvent = async () => {
        setLoading(true);
        try {
            const data = await contentManagementService.getEventById(id!);
            setValue('title', data.title);

            // Split date time string if needed, or assume backend sends full datetime
            const dateObj = new Date(data.date);
            setValue('date', dateObj.toISOString().split('T')[0]);
            setValue('time', dateObj.toTimeString().slice(0, 5));

            setValue('location', data.location);
            setValue('image_url', data.image_url);
            setValue('is_registration_open', Number(data.is_registration_open) === 1);
            setDescription(data.description);
            setPreviewUrl(data.image_url);
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengambil data agenda');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'events/images');

        try {
            const res = await api.post<{ url: string }>('/upload', formData);
            setValue('image_url', res.url);
            toast.success('Gambar berhasil diunggah');
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengunggah gambar');
            setPreviewUrl(''); // Revert preview on failure
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (data: EventForm) => {
        setSubmitting(true);
        try {
            // Combine date and time
            const fullDate = `${data.date} ${data.time}:00`;

            const eventData = {
                ...data,
                date: fullDate,
                description,
                // Ensure boolean is handled if backend expects it, or it will be sent as is
            };

            if (id) {
                await contentManagementService.updateEvent(id, eventData);
                toast.success('Agenda berhasil diperbarui');
            } else {
                await contentManagementService.createEvent(eventData);
                toast.success('Agenda berhasil dibuat');
            }
            navigate('/admin/events');
        } catch (error) {
            console.error(error);
            toast.error('Gagal menyimpan agenda');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/admin/events')}
                    className="p-2 hover:bg-white rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit Agenda' : 'Buat Agenda Baru'}</h1>
                    <p className="text-gray-500">Isi detail lengkap kegiatan di bawah ini</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        {loading ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kegiatan</label>
                                    <div className="relative">
                                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            {...register('title', { required: 'Judul wajib diisi' })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="Contoh: Workshop Kurikulum Merdeka"
                                        />
                                    </div>
                                    {errors.title && <span className="text-xs text-red-500 mt-1">{errors.title.message}</span>}
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="date"
                                                {...register('date', { required: 'Tanggal wajib diisi' })}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Waktu</label>
                                        <input
                                            type="time"
                                            {...register('time', { required: 'Waktu wajib diisi' })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            {...register('location', { required: 'Lokasi wajib diisi' })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Contoh: Aula Utama atau Zoom Meeting"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi & Materi</label>
                                    <div className="prose-sm max-w-none border rounded-lg overflow-hidden">
                                        <RichTextEditor
                                            value={description}
                                            onChange={setDescription}
                                            placeholder="Tulis detail lengkap mengenai kegiatan ini..."
                                        />
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Sidebar: Image & Settings */}
                <div className="space-y-6">
                    {/* Image Upload */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Cover Image</label>

                        <div className="space-y-4">
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors group">
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => document.getElementById('image-upload')?.click()}
                                                className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
                                            >
                                                Ganti Gambar
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                                        <span className="text-sm">Upload Cover Image</span>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    id="image-upload"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </div>

                            {uploading && (
                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Mengunggah...</span>
                                </div>
                            )}
                            <input type="hidden" {...register('image_url')} />
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Pengaturan</label>

                        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                            <input
                                type="checkbox"
                                id="reg"
                                {...register('is_registration_open')}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="reg" className="flex-1 text-sm text-gray-700 cursor-pointer select-none">
                                Buka Pendaftaran Peserta
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleSubmit(onSubmit)}
                            disabled={submitting || loading}
                            className="w-full"
                        >
                            {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                            {id ? 'Simpan Perubahan' : 'Terbitkan Agenda'}
                        </Button>
                        <button
                            onClick={() => navigate('/admin/events')}
                            className="w-full py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
