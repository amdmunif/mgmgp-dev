import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Calendar, MapPin, Search, Eye, Pencil } from 'lucide-react';
import { contentManagementService } from '../../../services/contentManagementService';
import type { Event } from '../../../types';
import { Link } from 'react-router-dom';

export function AdminEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await contentManagementService.getAllEvents();
            setEvents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus agenda ini?')) return;
        try {
            await contentManagementService.deleteEvent(id);
            loadData();
        } catch (error) {
            alert('Gagal menghapus');
        }
    };

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Agenda Kegiatan</h1>
                    <p className="text-gray-500">Jadwal pertemuan dan kegiatan MGMP.</p>
                </div>
                <Link to="/admin/events/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"><Plus className="w-4 h-4 mr-2" /> Buat Agenda Baru</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari agenda atau lokasi..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-500">Nama Kegiatan</th>
                            <th className="px-6 py-4 font-semibold text-gray-500">Waktu & Lokasi</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && <tr><td colSpan={3} className="p-8 text-center text-gray-500">Loading...</td></tr>}
                        {!loading && filteredEvents.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-gray-500">Belum ada agenda yang ditemukan.</td></tr>}
                        {!loading && filteredEvents.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900 text-lg">{item.title}</div>
                                    <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <MapPin className="w-3 h-3 text-red-500" />
                                            {item.location}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            to={`/events/${item.id}`}
                                            target="_blank"
                                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                            title="Lihat Agenda"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            to={`/admin/events/edit/${item.id}`}
                                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                            title="Edit Agenda"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                            title="Hapus Agenda"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
