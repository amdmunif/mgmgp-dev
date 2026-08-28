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
        <div className="space-y-6 pb-10">
            {/* Top Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Cari kelas LMS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm bg-white"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-12 flex justify-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredEvents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredEvents.map((event) => (
                        <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 overflow-hidden group transition-all duration-300 flex flex-col">
                            <div className="aspect-video relative overflow-hidden bg-gray-50">
                                {event.image_url ? (
                                    <img src={getFileUrl(event.image_url)} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                                        <MonitorPlay className="w-10 h-10 text-blue-200" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-bold text-blue-700 rounded-full shadow-sm">
                                    LMS Aktif
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">{event.title}</h3>
                                <p className="text-xs text-gray-500 mb-4 font-medium">{new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                
                                <div className="mt-auto pt-4 border-t border-gray-50">
                                    <Button 
                                        onClick={() => navigate(`/admin/events/${event.id}/lms`)}
                                        className="w-full bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold transition-colors h-10"
                                    >
                                        Kelola Kelas <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MonitorPlay className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Kelas LMS</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Anda belum mengaktifkan fitur LMS pada acara atau kegiatan mana pun. Edit acara untuk mengaktifkannya.</p>
                </div>
            )}
        </div>
    );
}
