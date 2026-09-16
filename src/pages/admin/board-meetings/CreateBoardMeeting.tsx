import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';
import type { BoardMeeting } from '../../../types';
import { format } from 'date-fns';

export const CreateBoardMeeting: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [isLoading, setIsLoading] = useState(isEdit);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        location: ''
    });

    useEffect(() => {
        if (isEdit) {
            fetchMeeting();
        }
    }, [id]);

    const fetchMeeting = async () => {
        try {
            const data = await api.get<BoardMeeting>(`/board-meetings/${id}`);
            setFormData({
                title: data.title,
                description: data.description || '',
                date: format(new Date(data.date), "yyyy-MM-dd'T'HH:mm"),
                location: data.location || ''
            });
        } catch (error: any) {
            toast.error('Gagal memuat pertemuan');
            navigate('/admin/board-meetings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.date) {
            toast.error('Judul dan tanggal wajib diisi');
            return;
        }

        setIsSaving(true);
        try {
            if (isEdit) {
                await api.put(`/board-meetings/${id}`, formData);
                toast.success('Pertemuan diperbarui');
            } else {
                await api.post('/board-meetings', formData);
                toast.success('Pertemuan dibuat');
            }
            navigate('/admin/board-meetings');
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyimpan pertemuan');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/admin/board-meetings">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isEdit ? 'Edit Pertemuan' : 'Buat Pertemuan Baru'}
                    </h1>
                    <p className="text-slate-500">
                        {isEdit ? 'Ubah informasi jadwal pertemuan' : 'Tambahkan jadwal pertemuan pengurus baru'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Judul Pertemuan <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Contoh: Rapat Pleno Bulan Oktober"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Tanggal & Waktu <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.date}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Lokasi
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Contoh: Ruang Rapat SMAN 1"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Deskripsi/Agenda
                        </label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Tuliskan agenda atau catatan pertemuan di sini..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Link to="/admin/board-meetings">
                        <Button type="button" variant="outline">Batal</Button>
                    </Link>
                    <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan
                    </Button>
                </div>
            </form>
        </div>
    );
};
