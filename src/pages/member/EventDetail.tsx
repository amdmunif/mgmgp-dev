import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Calendar, MapPin, ArrowLeft, Loader2, Share2, CheckCircle, Lock, Crown, Clock, CalendarDays, ExternalLink } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { authService } from '../../services/authService';
import type { Event as EventType } from '../../services/eventService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { getFileUrl } from '../../lib/api';

export function MemberEventDetail() {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const { setPageHeader } = useOutletContext<any>() || {};

    const [event, setEvent] = useState<EventType | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [participationStatus, setParticipationStatus] = useState<string | null>(null);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Detail Acara',
                description: 'Informasi lengkap mengenai agenda dan kegiatan.',
                icon: <CalendarDays className="w-6 h-6 text-primary-600" />
            });
        }
    }, [setPageHeader]);

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

            // Get Participation Status
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
        if (!confirm('Apakah Anda yakin ingin mendaftar ke acara ini?')) return;

        setProcessing(true);
        try {
            await eventService.joinEvent(eventId);
            setParticipationStatus('registered');
            toast.success('Berhasil mendaftar! Silakan cek email Anda untuk detail lebih lanjut.');
        } catch (error: any) {
            toast.error('Gagal mendaftar: ' + error.message);
        } finally {
            setProcessing(false);
        }
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link acara berhasil disalin ke clipboard');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-4" />
                <p className="text-gray-500">Memuat detail acara...</p>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <CalendarDays className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Acara Tidak Ditemukan</h3>
                <p className="text-gray-500 mb-6">Acara yang Anda cari mungkin telah dihapus atau link tidak valid.</p>
                <Button onClick={() => navigate('/member/events')}>Kembali ke Daftar Acara</Button>
            </div>
        );
    }

    const isEventPremium = Number(event.is_premium) === 1;
    const canRegister = !isEventPremium || isPremium;

    // Determine status badge color/text
    const getStatusBadge = () => {
        if (participationStatus === 'attended') {
            return <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Hadir</div>;
        }
        if (participationStatus === 'registered') {
            return <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Terdaftar</div>;
        }
        return null;
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            {/* Breadcrumb / Back Navigation */}
            <div className="mb-6">
                <Link to="/member/events" className="inline-flex items-center text-gray-500 hover:text-primary-600 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali ke Agenda Kegiatan
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Header Image & Title */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="relative aspect-video w-full bg-gray-100">
                            <img
                                src={event.image_url ? getFileUrl(event.image_url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=random&size=800`}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay Badge for Premium */}
                            {isEventPremium && (
                                <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                                    <Crown className="w-4 h-4 fill-current" /> PREMIUM
                                </div>
                            )}
                        </div>

                        <div className="p-6 md:p-8">
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold uppercase tracking-wide">
                                            {event.type || 'Event'}
                                        </span>
                                        {getStatusBadge()}
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                                        {event.title}
                                    </h1>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-lg shadow-sm text-primary-600">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase">Tanggal</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {format(new Date(event.date), 'EEEE, dd MMMM yyyy', { locale: id })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-lg shadow-sm text-primary-600">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase">Waktu</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {format(new Date(event.date), 'HH:mm', { locale: id })} WIB - Selesai
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 md:col-span-2">
                                    <div className="p-2.5 bg-white rounded-lg shadow-sm text-primary-600">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase">Lokasi</p>
                                        <p className="text-sm font-semibold text-gray-900">{event.location}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            Deskripsi Acara
                        </h2>
                        <div
                            className="prose prose-blue max-w-none text-gray-600 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: event.description }}
                        />
                    </div>
                </div>

                {/* Sidebar Column (Sticky) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        {/* Registration Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-primary-100/50 overflow-hidden relative">
                            {/* Decorative background blurs */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-100/50 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl"></div>

                            <div className="p-6 relative z-10">
                                <h3 className="font-bold text-gray-900 text-lg mb-1">Pendaftaran</h3>
                                <p className="text-sm text-gray-500 mb-6">Amankan kursi Anda sekarang.</p>

                                {participationStatus === 'registered' || participationStatus === 'attended' ? (
                                    <div className="text-center py-6 bg-green-50 rounded-xl border border-green-100 mb-4">
                                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                        <h4 className="font-bold text-green-800">Anda Sudah Terdaftar!</h4>
                                        <p className="text-xs text-green-600 mt-1 px-4">
                                            Silakan hadir tepat waktu sesuai jadwal yang ditentukan.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {!canRegister ? (
                                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
                                                <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                                <h4 className="font-bold text-amber-800 mb-1">Event Premium</h4>
                                                <p className="text-xs text-amber-700 mb-4">
                                                    Upgrade akun Anda untuk mengikuti event eksklusif ini.
                                                </p>
                                                <Button
                                                    onClick={() => navigate('/member/upgrade')}
                                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                                                >
                                                    <Crown className="w-4 h-4 mr-2" /> Upgrade Premium
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100">
                                                    <span className="text-gray-500">Biaya Pendaftaran</span>
                                                    <span className="font-bold text-green-600">Gratis</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100 mb-2">
                                                    <span className="text-gray-500">Kuota Tersedia</span>
                                                    <span className="font-bold text-gray-900">Terbatas</span>
                                                </div>

                                                <Button
                                                    onClick={handleRegister}
                                                    className="w-full h-12 text-base shadow-md shadow-primary-500/20"
                                                    disabled={processing}
                                                >
                                                    {processing ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Mendaftar...</>
                                                    ) : (
                                                        "Daftar Sekarang"
                                                    )}
                                                </Button>
                                                <p className="text-xs text-center text-gray-400 mt-2">
                                                    Dengan mendaftar, Anda menyetujui ketentuan acara.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Share Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                                <Share2 className="w-4 h-4" /> Bagikan Event
                            </h3>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
                                    <span className="mr-2">🔗</span> Salin Link
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                                    window.open(`https://wa.me/?text=${encodeURIComponent(`Yuk ikut event ini: ${event.title} - ${window.location.href}`)}`, '_blank');
                                }}>
                                    <span className="mr-2">📱</span> WhatsApp
                                </Button>
                            </div>
                        </div>

                        {/* Support / Contact */}
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
                            <p className="text-xs text-blue-600 font-medium mb-1">Butuh bantuan?</p>
                            <p className="text-sm text-blue-800 font-bold mb-3">Hubungi Panitia MGMP</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
                            >
                                <ExternalLink className="w-3 h-3 mr-2" /> WhatsApp Admin
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper component for Icon Wrapper (optional, kept inline above for simplicity)
function FileText({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
    );
}
