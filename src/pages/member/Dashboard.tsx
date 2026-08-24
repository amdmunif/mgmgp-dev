import { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
    BookOpen, Gamepad2, Terminal, Crown,
    ArrowRight, Lock, LayoutDashboard, Calendar, Eye, X
} from 'lucide-react';
import { authService } from '../../services/authService';
import { statsService } from '../../services/statsService';
import { premiumService } from '../../services/premiumService';
import { settingsService } from '../../services/settingsService';
import { Button } from '../../components/ui/button';

export function MemberDashboard() {
    const navigate = useNavigate();
    const { setPageHeader } = useOutletContext<any>();
    const [profile, setProfile] = useState<any>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [stats, setStats] = useState({
        materials: 0,
        events: 0,
        premium: 0
    });
    
    // Premium Detail States
    const [showPremiumDetail, setShowPremiumDetail] = useState(false);
    const [latestRequest, setLatestRequest] = useState<any>(null);
    const [premiumPrice, setPremiumPrice] = useState<string>('0');
    const [adminBanks, setAdminBanks] = useState<any[]>([]);

    useEffect(() => {
        setPageHeader({
            title: 'Dashboard Anggota',
            description: `Selamat datang kembali, ${profile?.nama || 'Anggota'}!`,
            icon: <LayoutDashboard className="w-6 h-6 text-blue-600" />
        });
    }, [profile]);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                // Determine user
                const { user: authUser, profile: userProfile } = await authService.getCurrentUser() || {};
                const currentUser = userProfile || authUser;

                if (!currentUser) {
                    navigate('/login');
                    return;
                }
                setProfile(currentUser);

                // Check premium status
                const userWithPremium = currentUser as any;
                const isPremiumActive = userWithPremium?.premium_until && new Date(userWithPremium.premium_until) > new Date();
                setIsPremium(!!isPremiumActive);

                // Load Premium Info if active
                if (isPremiumActive) {
                    try {
                        const [req, settings, banks] = await Promise.all([
                            premiumService.getMyLatestRequest(),
                            settingsService.getSettings(),
                            settingsService.getBankAccounts(true)
                        ]);
                        setLatestRequest(req);
                        setPremiumPrice(settings?.premium_price?.toString() || '0');
                        setAdminBanks(banks || []);
                    } catch (e) {
                        console.error("Failed to load premium details", e);
                    }
                }

                // Load Events
                import('../../services/eventService').then(async m => {
                    const events = await m.eventService.getUpcomingEvents();
                    setUpcomingEvents(events?.slice(0, 3) || []); // Take top 3
                });

                // Load Stats
                const dashboardStats = await statsService.getOverview();
                setStats(dashboardStats);

            } catch (e) {
                console.error("Failed to load dashboard", e);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [navigate]);

    if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;

    const premiumFeatures = [
        {
            title: 'Bank Soal & Games',
            desc: 'Akses ribuan soal latihan dan game edukasi.',
            icon: Gamepad2,
            path: '/member/questions',
            color: 'bg-purple-100 text-purple-600'
        },
        {
            title: 'Prompt AI Library',
            desc: 'Kumpulan prompt ChatGPT untuk guru.',
            icon: Terminal,
            path: '/member/prompts',
            color: 'bg-green-100 text-green-600'
        },
        {
            title: 'Bank Referensi',
            desc: 'Buku digital dan simulator pembelajaran.',
            icon: BookOpen,
            path: '/member/references',
            color: 'bg-blue-100 text-blue-600'
        },
        {
            title: 'Perangkat Ajar Exclusive',
            desc: 'RPP, Modul Ajar, dan Slide Premium.',
            icon: Crown,
            path: '/learning',
            color: 'bg-yellow-100 text-yellow-600'
        }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">


            {/* Infographics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Perangkat Ajar</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.materials}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Agenda Kegiatan</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.events}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                        <Crown className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Status Akun</p>
                        <p className="text-lg font-bold text-gray-900">{isPremium ? 'Premium' : 'Reguler'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main: Premium Features Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5" /> Menu Eksklusif
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {premiumFeatures.map((feat) => (
                            <div key={feat.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
                                {!isPremium && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-center p-4">
                                        <Lock className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-xs font-bold text-gray-500 uppercase">Premium Only</span>
                                    </div>
                                )}
                                <div className={`w-12 h-12 ${feat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <feat.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">{feat.title}</h3>
                                <p className="text-sm text-gray-500 mb-4">{feat.desc}</p>
                                <Link to={feat.path} className={!isPremium ? 'pointer-events-none' : ''}>
                                    <span className="inline-flex items-center text-sm font-semibold text-primary-600 group-hover:translate-x-1 transition-transform">
                                        Akses Sekarang <ArrowRight className="w-4 h-4 ml-1" />
                                    </span>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar: Upcoming Events */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Agenda Terbaru</h2>
                        <Link to="/member/events" className="text-sm text-primary-600 hover:underline">Lihat Semua</Link>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {upcomingEvents.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {upcomingEvents.map((event) => (
                                    <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 text-center bg-blue-50 text-blue-700 rounded-lg p-1 shrink-0">
                                                <span className="block text-xs font-bold uppercase">{new Date(event.date).toLocaleString('id-ID', { month: 'short' })}</span>
                                                <span className="block text-lg font-bold">{new Date(event.date).getDate()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate flex items-center gap-2">
                                                    {event.title}
                                                    {event.is_premium === 1 && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                            PRO
                                                        </span>
                                                    )}
                                                    {(!Number(event.is_registration_open) || (event.registration_deadline && new Date(event.registration_deadline) < new Date())) && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                                            DITUTUP
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-xs text-gray-500 mb-2 line-clamp-1">{event.location}</p>
                                                <Link to={`/member/events/${event.id}`}>
                                                    <Button size="sm" variant="outline" className="w-full text-xs h-8">Lihat Detail</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <p className="text-sm">Belum ada agenda kegiatan.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Status Banner (Moved to Bottom) */}
            {isPremium ? (
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-yellow-400/20 rounded-xl">
                            <Crown className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Status Premium Aktif</h3>
                            <p className="text-gray-300">Terima kasih telah menjadi bagian dari komunitas premium kami.</p>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <Button onClick={() => setShowPremiumDetail(true)} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                            <Eye className="w-4 h-4 mr-2" /> Detail Member
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Crown className="w-64 h-64 rotate-12 translate-x-12 -translate-y-12" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold mb-4 border border-white/30">
                                <Crown className="w-3 h-3" /> LISTRIK PREMIUM
                            </div>
                            <h2 className="text-3xl font-bold mb-4">
                                Upgrade Skill Mengajar Anda!
                            </h2>
                            <p className="text-orange-50 mb-8 max-w-xl text-lg leading-relaxed">
                                Dapatkan akses tanpa batas ke ribuan Bank Soal, Perangkat Ajar Eksklusif, dan ikuti event premium secara gratis.
                            </p>
                            <Link to="/member/upgrade">
                                <Button className="bg-white text-orange-600 hover:bg-orange-50 border-none px-8 py-6 h-auto text-lg font-bold shadow-lg">
                                    Upgrade Sekarang <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                        </div>

                        <div className="hidden lg:grid grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                                <Gamepad2 className="w-6 h-6 mb-2 text-yellow-300" />
                                <p className="font-bold text-sm">Akses Bank Soal</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                                <BookOpen className="w-6 h-6 mb-2 text-yellow-300" />
                                <p className="font-bold text-sm">Modul Ajar</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                                <Terminal className="w-6 h-6 mb-2 text-yellow-300" />
                                <p className="font-bold text-sm">Prompt AI</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                                <Crown className="w-6 h-6 mb-2 text-yellow-300" />
                                <p className="font-bold text-sm">Sertifikat</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detail Member Premium */}
            {showPremiumDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
                        <div className="p-6 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white relative">
                            <button onClick={() => setShowPremiumDetail(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors">
                                <X className="w-5 h-5 text-white" />
                            </button>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-full">
                                    <Crown className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold">Detail Premium</h3>
                            </div>
                            <p className="text-yellow-50 opacity-90 text-sm">Informasi langganan akun Anda</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Mulai Berlangganan</label>
                                <p className="text-gray-900 font-medium">
                                    {latestRequest?.created_at ? new Date(latestRequest.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Tidak tersedia'}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Berakhir Pada</label>
                                <p className="text-gray-900 font-medium">
                                    {profile?.premium_until ? new Date(profile.premium_until).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Tidak tersedia'}
                                </p>
                            </div>
                            <div className="h-px bg-gray-100 my-2"></div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Biaya Transfer</label>
                                <p className="text-lg font-bold text-green-600">
                                    Rp {parseInt(premiumPrice || '0').toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Tujuan Transfer</label>
                                {adminBanks && adminBanks.length > 0 ? (
                                    adminBanks.map((bank, idx) => (
                                        <p key={idx} className="text-gray-900 font-medium text-sm">
                                            {bank.bank_name} - {bank.account_number} <span className="text-gray-500">(a.n {bank.account_holder})</span>
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-gray-900 font-medium">Rekening Resmi MGMP</p>
                                )}
                            </div>
                            {latestRequest && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                                    <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Info Pengirim</label>
                                    <p className="text-gray-800 text-sm">Bank: <span className="font-medium">{latestRequest.bank_name || '-'}</span></p>
                                    <p className="text-gray-800 text-sm">No. Rek: <span className="font-medium">{latestRequest.account_number || '-'}</span></p>
                                    <p className="text-gray-800 text-sm">A/n: <span className="font-medium">{latestRequest.account_holder || '-'}</span></p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <Button onClick={() => setShowPremiumDetail(false)} variant="default">Tutup</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

