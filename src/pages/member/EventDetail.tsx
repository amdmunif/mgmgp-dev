import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Calendar, MapPin, ArrowLeft, Loader2, Share2, CheckCircle, Lock, Crown } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { authService } from '../../services/authService';
import type { Event as EventType } from '../../services/eventService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export function MemberEventDetail() {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<EventType | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [participationStatus, setParticipationStatus] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [eventId]);

    async function loadData() {
        if (!eventId) return;
        setLoading(true);
        try {
            // Check premium status
            const { profile } = await authService.getCurrentUser() || {};
            if (profile?.premium_until && new Date(profile.premium_until) > new Date()) {
                setIsPremium(true);
            }

            // Get Event Detail
            const eventData = await eventService.getEventById(eventId);
            setEvent(eventData);

            // Get Participation Status (re-use logic or fetch separate?)
            // Ideally we check if user is registered. 
            // For now we can fetch upcoming events to check status, OR add a specific endpoint. 
            // Let's rely on getUpcomingEvents for status checking or assume we need to handle it.
            // Actually, let's try to fetch participation specifically or check from list.
            // Simplified: Fetch participation logic.
            const participation = await eventService.getParticipation(eventId);
            if (participation) {
                setParticipationStatus(participation.is_hadir ? 'attended' : 'registered');
            }
        } catch (error) {
            console.error('Failed to load event', error);
            // toast.error('Gagal memuat detail acara');
        } finally {
            setLoading(false);
        }
    }

    async function handleRegister() {
        if (!eventId || !event) return;
        if (!confirm('Daftar ke acara ini?')) return;

        setProcessing(true);
        try {
            await eventService.joinEvent(eventId);
            setParticipationStatus('registered');
            toast.success('Berhasil mendaftar!');
        } catch (error: any) {
            toast.error('Gagal mendaftar: ' + error.message);
        } finally {
            setProcessing(false);
        }
    }

    if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" /></div>;
    if (!event) return <div className="p-8 text-center">Acara tidak ditemukan</div>;

    const isEventPremium = Number(event.is_premium) === 1;
    const canRegister = !isEventPremium || isPremium;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all" onClick={() => navigate('/member/events')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Agenda
            </Button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Hero Image */}
                <div className="relative h-64 md:h-80 bg-gray-100">
                    <img
                        src={event.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=random&size=800`}
                        alt={event.title}
                        className="w-full h-full object-cover"
                    />
                    {isEventPremium && (
                        <div className="absolute top-4 right-4 bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-sm border border-amber-200">
                            <Crown className="w-4 h-4" /> PREMIUM EVENT
                        </div>
                    )}
                </div>

                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

                            <div className="flex flex-col gap-3 mb-8 text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary-600" />
                                    <span className="font-medium">{format(new Date(event.date), 'EEEE, dd MMMM yyyy', { locale: id })}</span>
                                    <span>•</span>
                                    <span>{format(new Date(event.date), 'HH:mm', { locale: id })} WIB</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-primary-600" />
                                    <span>{event.location}</span>
                                </div>
                            </div>

                            <div className="prose max-w-none text-gray-600 mb-8" dangerouslySetInnerHTML={{ __html: event.description }} />
                        </div>

                        {/* Action Sidebar */}
                        <div className="w-full md:w-80 shrink-0">
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 sticky top-8">
                                <h3 className="font-bold text-gray-900 mb-4">Status Pendaftar</h3>

                                {participationStatus === 'registered' ? (
                                    <div className="bg-green-100 text-green-800 p-4 rounded-lg flex items-center gap-3 font-medium mb-4">
                                        <CheckCircle className="w-5 h-5" />
                                        Anda sudah terdaftar
                                    </div>
                                ) : participationStatus === 'attended' ? (
                                    <div className="bg-blue-100 text-blue-800 p-4 rounded-lg flex items-center gap-3 font-medium mb-4">
                                        <CheckCircle className="w-5 h-5" />
                                        Anda sudah hadir
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {canRegister ? (
                                            <Button
                                                size="lg"
                                                className="w-full"
                                                onClick={handleRegister}
                                                disabled={processing}
                                            >
                                                {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                                Daftar Sekarang
                                            </Button>
                                        ) : (
                                            <Button
                                                size="lg"
                                                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                                                onClick={() => navigate('/member/upgrade')}
                                            >
                                                <Lock className="w-4 h-4 mr-2" />
                                                Upgrade ke Premium
                                            </Button>
                                        )}
                                        <p className="text-xs text-center text-gray-500">
                                            {isEventPremium ? "Khusus anggota premium." : "Terbuka untuk semua anggota."}
                                        </p>
                                    </div>
                                )}

                                <hr className="my-6 border-gray-200" />

                                <h4 className="font-semibold text-sm text-gray-900 mb-2">Bagikan</h4>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast.success('Link disalin');
                                    }}>
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Salin Link
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
