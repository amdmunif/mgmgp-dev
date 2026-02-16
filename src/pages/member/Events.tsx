import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Loader2, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import { eventService } from '../../services/eventService';
import type { EventParticipant } from '../../services/eventService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../../lib/utils';

type EventWithStatus = {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    participation_status?: string | null;
}

export function MemberEvents() {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
    const [loading, setLoading] = useState(true);
    const [upcomingEvents, setUpcomingEvents] = useState<EventWithStatus[]>([]);
    const [history, setHistory] = useState<EventParticipant[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    async function loadData() {
        setLoading(true);
        try {
            if (activeTab === 'upcoming') {
                const data = await eventService.getUpcomingEvents();
                setUpcomingEvents(data || []);
            } else {
                const data = await eventService.getMyHistory();
                setHistory(data || []);
            }
        } catch (error) {
            console.error('Failed to load events', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleRegister(eventId: string) {
        if (!confirm('Apakah Anda yakin ingin mendaftar ke acara ini?')) return;
        setProcessingId(eventId);
        try {
            await eventService.joinEvent(eventId);
            await loadData(); // Reload to update status
            alert('Berhasil mendaftar!');
        } catch (error: any) {
            alert('Gagal mendaftar: ' + error.message);
        } finally {
            setProcessingId(null);
        }
    }



    // async function handleCancel(eventId: string) {
    //     if(!confirm('Batalkan pendaftaran?')) return;
    //     setProcessingId(eventId);
    //     try {
    //         await eventService.cancel(eventId);
    //         await loadData();
    //     } catch (error) {
    //         alert('Gagal membatalkan');
    //     } finally {
    //         setProcessingId(null);
    //     }
    // }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-primary-100 p-3 rounded-xl">
                    <Calendar className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Agenda Kegiatan</h1>
                    <p className="text-gray-500">Informasi kegiatan dan pelatihan MGMP.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative",
                        activeTab === 'upcoming' ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    Akan Datang
                    {activeTab === 'upcoming' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative",
                        activeTab === 'history' ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    Riwayat Keikutsertaan
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500" /></div>
            ) : (
                <div className="space-y-4">
                    {/* Content: Upcoming */}
                    {activeTab === 'upcoming' && (
                        upcomingEvents.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">Belum ada agenda kegiatan mendatang.</div>
                        ) : (
                            upcomingEvents.map(event => (
                                <div key={event.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-primary-100 transition-colors flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-primary-600 text-sm font-medium mb-1">
                                            <Calendar className="w-4 h-4" />
                                            {format(new Date(event.date), 'EEEE, dd MMMM yyyy (HH:mm)', { locale: id })} WIB
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                            <MapPin className="w-4 h-4" />
                                            {event.location}
                                        </div>
                                        <p className="text-gray-600 text-sm line-clamp-2 md:line-clamp-none">
                                            {event.description}
                                        </p>
                                    </div>
                                    <div className="flex flex-col justify-center items-end min-w-[150px]">
                                        {event.participation_status === 'registered' ? (
                                            <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 px-4 py-2 rounded-lg">
                                                <CheckCircle className="w-5 h-5" />
                                                Terdaftar
                                            </div>
                                        ) : event.participation_status === 'attended' ? (
                                            <div className="flex items-center gap-2 text-blue-600 font-medium bg-blue-50 px-4 py-2 rounded-lg">
                                                <CheckCircle className="w-5 h-5" />
                                                Hadir
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => handleRegister(event.id)}
                                                disabled={!!processingId}
                                                className="w-full md:w-auto"
                                            >
                                                {processingId === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Daftar Sekarang'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )
                    )}

                    {/* Content: History */}
                    {activeTab === 'history' && (
                        history.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">Belum ada riwayat kegiatan.</div>
                        ) : (
                            history.map(item => (
                                <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                            <Clock className="w-4 h-4" />
                                            Daftar: {format(new Date(item.registered_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">{item.events?.title || 'Unknown Event'}</h3>
                                        <p className="text-gray-500 text-sm">{format(new Date(item.events?.date || ''), 'dd MMMM yyyy', { locale: id })} • {item.events?.location}</p>
                                    </div>

                                    <div>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-xs font-bold uppercase",
                                            item.status === 'registered' ? "bg-green-100 text-green-800" :
                                                item.status === 'attended' ? "bg-blue-100 text-blue-800" :
                                                    "bg-red-100 text-red-800"
                                        )}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            )}
        </div>
    );
}
