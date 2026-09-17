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
                
                <div className="overflow-x-auto">
                    {filtered.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            Tidak ada pertemuan yang ditemukan.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50/80 text-gray-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="py-3.5 px-4 w-16 text-center">No</th>
                                    <th className="py-3.5 px-4">Judul Kegiatan</th>
                                    <th className="py-3.5 px-4">Tanggal</th>
                                    <th className="py-3.5 px-4">Lokasi</th>
                                    <th className="py-3.5 px-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filtered.map((meeting, index) => (
                                    <tr key={meeting.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3.5 px-4 text-center text-gray-500 font-medium">
                                            {index + 1}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-slate-900">{meeting.title}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                {format(new Date(meeting.date), 'dd MMMM yyyy, HH:mm', { locale: id })}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-600">
                                            {meeting.location ? (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4 text-red-500" />
                                                    {meeting.location}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">-</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link to={`/admin/board-meetings/${meeting.id}`}>
                                                    <Button variant="outline" size="sm" className="flex items-center gap-1 h-8 text-xs">
                                                        <Users className="w-3.5 h-3.5" />
                                                        Kehadiran
                                                    </Button>
                                                </Link>
                                                <Link to={`/admin/board-meetings/edit/${meeting.id}`}>
                                                    <Button variant="outline" size="sm" className="h-8 text-xs">Edit</Button>
                                                </Link>
                                                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => handleDelete(meeting.id)}>
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
