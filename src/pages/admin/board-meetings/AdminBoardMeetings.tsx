import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, MapPin, Users, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { api } from '../../../lib/api';
import type { BoardMeeting } from '../../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const AdminBoardMeetings: React.FC = () => {
    const [meetings, setMeetings] = useState<BoardMeeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const data = await api.get<BoardMeeting[]>('/board-meetings');
            setMeetings(data);
        } catch (error: any) {
            toast.error(error.message || 'Gagal memuat pertemuan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Yakin ingin menghapus pertemuan ini?')) return;
        try {
            await api.delete(`/board-meetings/${id}`);
            toast.success('Pertemuan dihapus');
            fetchMeetings();
        } catch (error: any) {
            toast.error(error.message || 'Gagal menghapus pertemuan');
        }
    };

    const filtered = meetings.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()));

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pertemuan Pengurus</h1>
                    <p className="text-slate-500">Kelola jadwal pertemuan dan rapat pengurus</p>
                </div>
                <Link to="/admin/board-meetings/create">
                    <Button className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Buat Pertemuan
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            placeholder="Cari pertemuan..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            className="pl-9 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                
                <div className="divide-y divide-slate-200">
                    {filtered.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            Tidak ada pertemuan yang ditemukan.
                        </div>
                    ) : (
                        filtered.map(meeting => (
                            <div key={meeting.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                <div className="space-y-1">
                                    <h3 className="font-medium text-slate-900">{meeting.title}</h3>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {format(new Date(meeting.date), 'dd MMMM yyyy, HH:mm', { locale: id })}
                                        </div>
                                        {meeting.location && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {meeting.location}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link to={`/admin/board-meetings/${meeting.id}`}>
                                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            Kehadiran
                                        </Button>
                                    </Link>
                                    <Link to={`/admin/board-meetings/edit/${meeting.id}`}>
                                        <Button variant="outline" size="sm">Edit</Button>
                                    </Link>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(meeting.id)}>
                                        Hapus
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
