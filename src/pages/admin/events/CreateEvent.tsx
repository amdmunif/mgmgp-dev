import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { contentManagementService } from '../../../services/contentManagementService';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';

interface EventForm {
    title: string;
    description: string;
    date: string;
    location: string;
    image_url: string;
    is_registration_open: boolean;
}

export function CreateEvent() {
    const navigate = useNavigate();
    const { register, handleSubmit } = useForm<EventForm>();
    const [submitting, setSubmitting] = useState(false);
    const [description, setDescription] = useState('');

    const onSubmit = async (data: EventForm) => {
        setSubmitting(true);
        try {
            await contentManagementService.createEvent({ ...data, description });
            navigate('/admin/events');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan agenda');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 mb-6"><ArrowLeft className="w-4 h-4 mr-2" /> Kembali</button>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h1 className="text-2xl font-bold mb-6">Buat Agenda Baru</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nama Kegiatan</label>
                        <input {...register('title', { required: true })} className="w-full border rounded-md p-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tanggal</label>
                            <input type="date" {...register('date', { required: true })} className="w-full border rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Lokasi</label>
                            <input {...register('location', { required: true })} className="w-full border rounded-md p-2" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Deskripsi</label>
                        <RichTextEditor
                            value={description}
                            onChange={(val) => setDescription(val)}
                            placeholder="Tulis deskripsi agenda di sini..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">URL Cover Image</label>
                        <input {...register('image_url')} className="w-full border rounded-md p-2" placeholder="https://..." />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" {...register('is_registration_open')} id="reg" className="rounded border-gray-300" />
                        <label htmlFor="reg" className="text-sm">Buka Pendaftaran?</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="submit" disabled={submitting}>
                            {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Simpan Agenda'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
