import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api, getFileUrl } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Calendar, MapPin, Search, ArrowRight, Loader2 } from 'lucide-react';
import type { Event } from '../../types';

export function Events() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await api.get<Event[]>('/events');
                setEvents(data);
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.description.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Agenda Kegiatan</h1>
                    <p className="text-gray-500 mt-2">Jadwal kegiatan MGMP dan event pengembangan diri lainnya.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                        <Search className="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full ps-10 p-2.5"
                        placeholder="Cari event..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-6">
                {filteredEvents.map((event) => (
                    <div key={event.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row overflow-hidden group">
                        <div className="md:w-1/3 h-48 md:h-auto overflow-hidden relative">
                            <img
                                src={getFileUrl(event.image_url)}
                                alt={event.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md text-sm font-bold shadow-sm">
                                {new Date(event.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                        <div className="p-6 md:w-2/3 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(event.date)}</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.location}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{event.title}</h3>
                                <p className="text-gray-600 mb-4">{event.description}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${event.is_registration_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {event.is_registration_open ? 'Pendaftaran Buka' : 'Pendaftaran Tutup'}
                                </span>
                                <Link to={`/events/${event.id}`}>
                                    <Button>
                                        Detail Acara <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
                {!loading && filteredEvents.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        Tidak ada agenda kegiatan yang ditemukan.
                    </div>
                )}
            </div>
        </div>
    );
}
