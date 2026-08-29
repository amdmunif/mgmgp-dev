import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Loader2, Calendar, MapPin, CheckCircle, Crown, Lock, Clock } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { authService } from '../../services/authService';
import type { EventParticipant } from '../../services/eventService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn, stripHtml } from '../../lib/utils';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';

type EventWithStatus = {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    is_premium: boolean | number;
    is_registration_open: boolean | number;
    registration_deadline?: string;
    participation_status?: string | null;
}

export function MemberEvents() {
    const navigate = useNavigate();
    const { setPageHeader } = useOutletContext<any>();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
    const [loading, setLoading] = useState(true);
    const [upcomingEvents, setUpcomingEvents] = useState<EventWithStatus[]>([]);
    const [history, setHistory] = useState<EventParticipant[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        setPageHeader({
            title: 'Agenda & Event',
            description: 'Informasi kegiatan dan pelatihan MGMP.',
            icon: <Calendar className="w-6 h-6 text-primary-600" />
        });
    }, []);

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
        <div className="w-full space-y-6 animate-in fade-in duration-500">

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
                                const isRegistrationOpen = Number(event.is_registration_open) === 1;
                                const isDeadlinePassed = event.registration_deadline ? new Date(event.registration_deadline) < new Date() : false;
                                const canRegisterPremium = !isEventPremium || isPremium;
                                const isQuotaFull = (event as any).quota ? Number((event as any).participants_count || 0) >= Number((event as any).quota) : false;

                                return (
                                <div key={event.id} className={cn(
                                    "bg-white rounded-2xl border transition-all flex flex-col relative overflow-hidden group/card",
                                    isEventPremium ? "border-amber-200 hover:border-amber-300 hover:shadow-md" : "border-gray-100 hover:border-blue-200 hover:shadow-md"
                                )}>
                                    {/* Corner Status Badges */}
                                    <div className="absolute top-0 right-0 z-10 flex">
                                        {event.is_premium === 1 && (
                                            <div className="bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-1.5 flex items-center gap-1 shadow-sm">
                                                <Crown className="w-3 h-3" /> PRO
                                            </div>
                                        )}
                                        {event.participation_status === 'registered' || event.participation_status === 'attended' ? (
                                            <div className="bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-xl shadow-sm tracking-wider">
                                                TERDAFTAR
                                            </div>
                                        ) : (!isRegistrationOpen || isDeadlinePassed || isQuotaFull) ? (
                                            <div className="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-xl shadow-sm tracking-wider">
                                                DITUTUP
                                            </div>
                                        ) : (
                                            <div className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-xl shadow-sm tracking-wider">
                                                BUKA
                                            </div>
                                        )}
                                    </div>

                                    {/* Main Content Area */}
                                    <div className="p-6 flex-1">
                                        <Link to={`/member/events/${event.id}`} className="block mb-4 pr-16">
                                            <h3 className="text-xl font-bold text-gray-900 group-hover/card:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                                {event.title}
                                            </h3>
                                        </Link>
                                        
                                        <div className="flex flex-col gap-2.5 text-sm text-gray-500 mb-5">
                                            <div className="flex items-start gap-2.5">
                                                <Calendar className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                                <span className="leading-tight">{format(new Date(event.date), 'EEEE, dd MMMM yyyy (HH:mm)', { locale: id })} WIB</span>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                                <span className="line-clamp-2 leading-tight">{event.location}</span>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 line-clamp-2 text-sm leading-relaxed">
                                            {stripHtml(event.description)}
                                        </p>
                                    </div>

                                    {/* Footer / Actions Area */}
                                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center">
                                            {(event as any).quota && (
                                                <span className="text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-md border border-gray-100 shadow-sm">
                                                    Sisa Kuota: <strong className="text-blue-600">{Number((event as any).quota) - Number((event as any).participants_count || 0)}</strong>
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <Link to={`/member/events/${event.id}`} className="flex-1 sm:flex-none">
                                                <Button variant="ghost" size="sm" className="w-full sm:w-auto text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                                    Detail
                                                </Button>
                                            </Link>
                                            
                                            {!(event.participation_status === 'registered' || event.participation_status === 'attended') && (
                                                isRegistrationOpen && !isDeadlinePassed && !isQuotaFull ? (
                                                    canRegisterPremium ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleRegister(event.id)}
                                                            disabled={processingId === event.id}
                                                            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-6"
                                                        >
                                                            {processingId === event.id ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : null}
                                                            Daftar
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => navigate('/member/upgrade')}
                                                            className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white shadow-sm px-5"
                                                        >
                                                            <Lock className="w-3 h-3 mr-1.5" />
                                                            Premium
                                                        </Button>
                                                    )
                                                ) : null
                                            )}
                                        </div>
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
                                        {Number(item.is_passed) === 1 && item.events?.certificate_url && (
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
