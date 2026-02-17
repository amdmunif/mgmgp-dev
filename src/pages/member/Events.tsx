import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Loader2, Calendar, MapPin, CheckCircle, Crown, Lock, Clock } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { authService } from '../../services/authService';
import type { EventParticipant } from '../../services/eventService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn, stripHtml } from '../../lib/utils';
import { useNavigate, Link } from 'react-router-dom';

type EventWithStatus = {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    is_premium: boolean | number;
    participation_status?: string | null;
}

export function MemberEvents() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
    const [loading, setLoading] = useState(true);
    const [upcomingEvents, setUpcomingEvents] = useState<EventWithStatus[]>([]);
    const [history, setHistory] = useState<EventParticipant[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    async function loadData() {
        setLoading(true);
        try {
            // Check premium status
            const { profile } = await authService.getCurrentUser() || {};
            if (profile?.premium_until && new Date(profile.premium_until) > new Date()) {
                setIsPremium(true);
            }

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
        <div className="w-full p-4 md:p-8">
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
                            upcomingEvents.map(event => {
                                const isEventPremium = Number(event.is_premium) === 1;
                                const canRegister = !isEventPremium || isPremium;

                                return (
                                    <div key={event.id} className={cn(
                                        "bg-white p-6 rounded-xl shadow-sm border transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden",
                                        isEventPremium ? "border-amber-200" : "border-gray-100 hover:border-primary-100"
                                    )}>
                                        {isEventPremium && (
                                            <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                                                <Crown className="w-3 h-3" /> PREMIUM ONLY
                                            </div>
                                        )}

                                        <div className="flex-1">
                                            <Link to={`/events/${event.id}`} className="block group">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                                                    {event.title}
                                                </h3>
                                            </Link>

                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{format(new Date(event.date), 'EEEE, dd MMMM yyyy (HH:mm)', { locale: id })} WIB</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{event.location}</span>
                                                </div>
                                            </div>

                                            <p className="text-gray-600 line-clamp-2 mb-4">
                                                {stripHtml(event.description)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col justify-center items-end min-w-[150px] gap-2">
                                            <Link to={`/member/events/${event.id}`} className="w-full md:w-auto">
                                                <Button variant="outline" className="w-full">
                                                    Lihat Detail
                                                </Button>
                                            </Link>

                                            {event.participation_status === 'registered' ? (
                                                <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 px-4 py-2 rounded-lg w-full justify-center">
                                                    <CheckCircle className="w-5 h-5" />
                                                    Terdaftar
                                                </div>
                                            ) : event.participation_status === 'attended' ? (
                                                <div className="flex items-center gap-2 text-blue-600 font-medium bg-blue-50 px-4 py-2 rounded-lg w-full justify-center">
                                                    <CheckCircle className="w-5 h-5" />
                                                    Hadir
                                                </div>
                                            ) : (
                                                canRegister ? (
                                                    <Button
                                                        onClick={() => handleRegister(event.id)}
                                                        disabled={processingId === event.id}
                                                        className="w-full md:w-auto"
                                                    >
                                                        {processingId === event.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                        Daftar Sekarang
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => navigate('/member/upgrade')}
                                                        className="bg-amber-500 hover:bg-amber-600 text-white w-full md:w-auto"
                                                    >
                                                        <Lock className="w-4 h-4 mr-2" />
                                                        Upgrade Premium
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )
                    )}

                    {/* Content: History */}
                    {activeTab === 'history' && (
                        history.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">Belum ada riwayat kegiatan.</div>
                        ) : (
                            history.map(item => (
                                <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                            <Clock className="w-4 h-4" />
                                            Daftar: {format(new Date(item.registered_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{item.events?.title || 'Unknown Event'}</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                            <span>{format(new Date(item.events?.date || ''), 'dd MMMM yyyy', { locale: id })}</span>
                                            <span>•</span>
                                            <span>{item.events?.location}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                                        {/* Attendance Status */}
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1",
                                            item.status === 'registered' ? "bg-amber-100 text-amber-800" :
                                                item.status === 'attended' ? "bg-green-100 text-green-800" :
                                                    "bg-red-100 text-red-800"
                                        )}>
                                            {item.status === 'registered' ? 'Terdaftar' :
                                                item.status === 'attended' ? 'Hadir' : 'Tidak Hadir'}
                                        </span>

                                        {/* Certificate Download */}
                                        {item.status === 'attended' && item.events?.certificate_url && (
                                            <a
                                                href={item.events.certificate_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                            >
                                                <Crown className="w-4 h-4" /> Download Sertifikat
                                            </a>
                                        )}

                                        {/* Task Link */}
                                        {item.events?.tasks_url && (
                                            <a
                                                href={item.events.tasks_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Link Tugas
                                            </a>
                                        )}
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
