import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { MonitorPlay, ChevronRight, Search } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { contentManagementService } from '../../../services/contentManagementService';
import { getFileUrl } from '../../../lib/api';
import type { Event } from '../../../types';

export function AdminLmsList() {
    const navigate = useNavigate();
    const { setPageHeader } = useOutletContext<any>();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setPageHeader({
            title: "Learning Management System (LMS)",
            subtitle: "Kelola kelas, materi, dan tugas untuk kegiatan yang menggunakan fitur LMS"
        });

        loadData();

        return () => setPageHeader(null);
    }, [setPageHeader]);

    const loadData = async () => {
        try {
            const data = await contentManagementService.getAllEvents();
            // Filter events that have LMS
            setEvents(data.filter((e: any) => Number(e.has_lms) === 1 || e.has_lms === true));
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(e => 
        e.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Cari kelas LMS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Memuat data...</div>
                    ) : filteredEvents.length > 0 ? (
                        filteredEvents.map((event) => (
                            <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4 group">
                                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                    {event.image_url ? (
                                        <img src={getFileUrl(event.image_url)} alt={event.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <MonitorPlay className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <Button 
                                    onClick={() => navigate(`/admin/events/${event.id}/lms`)}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Kelola Kelas <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MonitorPlay className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Belum Ada Kelas LMS</h3>
                            <p className="text-gray-500 mb-4 max-w-sm mx-auto">Anda belum mengaktifkan fitur LMS pada acara atau kegiatan mana pun.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
