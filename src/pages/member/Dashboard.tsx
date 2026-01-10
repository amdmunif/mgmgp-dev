import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    BookOpen, Gamepad2, Terminal, Crown,
    ArrowRight, Lock, LayoutDashboard
} from 'lucide-react';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/button';

export function MemberDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { user, profile } = await authService.getCurrentUser() || {};
        if (!user) {
            navigate('/login');
            return;
        }
        setUser(profile);
        // TODO: Check real subscription status from DB
        // For now, assume simplified check or placeholder:
        // const hasActiveSub = await subscriptionService.checkStatus(user.id);
        setIsPremium(true); // Mocking active subscription for development
        setLoading(false);
    };

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
            path: '/learning', // Remains public/shared
            color: 'bg-yellow-100 text-yellow-600'
        }
    ];

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Anggota</h1>
                    <p className="text-gray-500">Selamat datang, <span className="font-semibold text-primary-600">{user?.nama}</span></p>
                </div>
                {!isPremium && (
                    <Link to="/admin/premium"> {/* Or public premium landing */}
                        <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border-0">
                            <Crown className="w-4 h-4 mr-2" /> Upgrade Premium
                        </Button>
                    </Link>
                )}
            </div>

            {/* Premium Status Banner */}
            {isPremium ? (
                <div className="bg-gradient-to-r from-primary-900 to-primary-800 rounded-2xl p-6 text-white mb-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Crown className="w-40 h-40" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-yellow-500 rounded-lg">
                                <Crown className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold text-yellow-400 tracking-wide uppercase text-sm">Member Premium</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Akses Tidak Terbatas</h2>
                        <p className="text-primary-100 max-w-xl">Anda memiliki akses penuh ke seluruh fitur premium, bank soal, dan perangkat ajar eksklusif.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-100 rounded-2xl p-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-200 rounded-full">
                            <Lock className="w-6 h-6 text-gray-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Akun Free</h3>
                            <p className="text-gray-600 text-sm">Beberapa fitur terkunci. Upgrade ke Premium untuk akses penuh.</p>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5" /> Menu Premium
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
    );
}
