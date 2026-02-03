import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
    Users,
    FileText,
    Calendar,
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

export function DashboardOverview() {
    const [stats, setStats] = useState({
        members: 0,
        materials: 0,
        events: 0,
        premium: 0,
        pendingMembers: 0,
        pendingPremium: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await api.get<any>('/stats');

            if (data) {
                setStats({
                    members: data.members || 0,
                    materials: data.materials || 0,
                    events: data.events || 0,
                    premium: data.premium || 0,
                    pendingMembers: data.pendingMembers || 0,
                    pendingPremium: data.pendingPremium || 0
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Total Anggota',
            value: stats.members,
            icon: Users,
            color: 'bg-blue-500',
            trend: '+12%',
            trendUp: true
        },
        {
            label: 'Perangkat Ajar',
            value: stats.materials,
            icon: FileText,
            color: 'bg-green-500',
            trend: '+5%',
            trendUp: true
        },
        {
            label: 'Agenda Kegiatan',
            value: stats.events,
            icon: Calendar,
            color: 'bg-purple-500',
            trend: '+2',
            trendUp: true
        },
        {
            label: 'Premium Users',
            value: stats.premium,
            icon: TrendingUp,
            color: 'bg-orange-500',
            trend: '+8%',
            trendUp: true
        }
    ];

    if (loading) return <div>Loading statistics...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ringkasan Sistem</h1>
                    <p className="text-gray-500">Overview performa dan statistik MGMP hari ini.</p>
                </div>
            </div>

            {/* Notifications / Action Required */}
            {(stats.pendingMembers > 0 || stats.pendingPremium > 0) && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-500">
                    <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Perlu Tindakan
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats.pendingMembers > 0 && (
                            <div className="bg-white p-4 rounded-xl border border-orange-100 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{stats.pendingMembers} Member Baru</p>
                                        <p className="text-xs text-gray-500">Menunggu konfirmasi aktivasi akun</p>
                                    </div>
                                </div>
                                <a href="/admin/members?status=pending" className="text-sm font-semibold text-blue-600 hover:text-blue-700 px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                    Review
                                </a>
                            </div>
                        )}
                        {stats.pendingPremium > 0 && (
                            <div className="bg-white p-4 rounded-xl border border-orange-100 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{stats.pendingPremium} Upgrade Premium</p>
                                        <p className="text-xs text-gray-500">Menunggu verifikasi pembayaran</p>
                                    </div>
                                </div>
                                <a href="/admin/premium" className="text-sm font-semibold text-yellow-600 hover:text-yellow-700 px-4 py-2 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                                    Cek Request
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10 text-${stat.color.replace('bg-', '')}-600`}>
                                <stat.icon className={`w-6 h-6`} />
                            </div>
                            <span className={`flex items-center text-xs font-bold ${stat.trendUp ? 'text-green-600' : 'text-red-600'} bg-gray-50 px-2 py-1 rounded-full`}>
                                {stat.trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                {stat.trend}
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                        <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-bold text-gray-900">Aktivitas Terkini</h2>
                </div>

                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-2.5 before:w-0.5 before:bg-gray-100">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex gap-4 relative">
                            <div className="w-5 h-5 rounded-full bg-blue-100 border-2 border-white ring-4 ring-gray-50 flex items-center justify-center z-10">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            </div>
                            <div className="flex-1 -mt-1">
                                <p className="text-sm font-medium text-gray-900">Sistem melakukan backup otomatis</p>
                                <p className="text-xs text-gray-500">2 jam yang lalu</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <button className="text-sm text-blue-600 font-medium hover:text-blue-700">Lihat Semua Aktivitas</button>
                </div>
            </div>
        </div>
    );
}
