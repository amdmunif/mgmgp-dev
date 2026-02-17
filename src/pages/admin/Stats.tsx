import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { statsService, type TeacherStats } from '../../services/statsService';
import {
    Users,
    Award,
    Home,
    Activity,
    CheckCircle2
} from 'lucide-react';

export function AdminStats() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [stats, setStats] = useState<TeacherStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Statistik & Laporan Guru',
                description: 'Analisis demografi dan tingkat keaktifan anggota MGMP.',
                icon: <Activity className="w-6 h-6" />
            });
        }
        statsService.getTeacherStats()
            .then(res => setStats(res))
            .catch(err => console.error('Error fetching teacher stats:', err))
            .finally(() => setLoading(false));
    }, [setPageHeader]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!stats) return <div className="p-8 text-center text-gray-500">Gagal memuat statistik.</div>;

    const totalTeachers = stats.schoolTypes.Negeri + stats.schoolTypes.Swasta;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-primary-50 text-primary-600 rounded-xl">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Anggota</p>
                        <h3 className="text-2xl font-bold text-gray-900">{totalTeachers}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                        <Activity className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Guru Aktif</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.engagement.uniqueActiveTeachers}</h3>
                        <p className="text-xs text-green-600 font-medium mt-1">Pernah hadir di kegiatan</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Kehadiran</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.engagement.totalAttendance}</h3>
                        <p className="text-xs text-purple-600 font-medium mt-1">Akumulasi presensi</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* School Types Chart */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-8">
                        <Home className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-bold text-gray-900">Distribusi Sekolah</h2>
                    </div>

                    <div className="space-y-6">
                        {[
                            { label: 'Negeri', value: stats.schoolTypes.Negeri, color: 'bg-primary-600' },
                            { label: 'Swasta', value: stats.schoolTypes.Swasta, color: 'bg-orange-500' }
                        ].map((item) => {
                            const percentage = totalTeachers > 0 ? (item.value / totalTeachers) * 100 : 0;
                            return (
                                <div key={item.label} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-gray-700">{item.label}</span>
                                        <span className="text-gray-900">{item.value} ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${item.color} transition-all duration-1000`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                            <span className="text-xs text-gray-500 font-medium font-mono">NEGERI</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-xs text-gray-500 font-medium font-mono">SWASTA</span>
                        </div>
                    </div>
                </div>

                {/* Employment Status */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-8">
                        <Award className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-bold text-gray-900">Status Kepegawaian</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {stats.employment.sort((a, b) => b.count - a.count).map((item, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{item.status_kepegawaian || 'LAINNYA'}</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                                    <span className="text-xs text-gray-400 mb-1 font-medium">Guru</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex items-center gap-4 text-sm text-gray-500 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <Award className="w-5 h-5 text-blue-500 shrink-0" />
                        <p>Data ini membantu pengurus dalam memetakan kebutuhan pelatihan bagi Guru ASN dan Non-ASN.</p>
                    </div>
                </div>
            </div>

            {/* Engagement Table/List? Or more charts. 
                Let's add a "Ratio" section.
            */}
            <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-8 rounded-3xl shadow-xl text-white overflow-hidden relative">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="md:w-1/3">
                        <h2 className="text-2xl font-bold mb-2">Tingkat Engagement</h2>
                        <p className="text-primary-100 text-sm">Presentase anggota yang berpartisipasi aktif dalam rangkaian kegiatan MGMP.</p>
                    </div>
                    <div className="flex-1 flex gap-4 w-full">
                        <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                            <h4 className="text-4xl font-black mb-1">
                                {totalTeachers > 0 ? Math.round((stats.engagement.uniqueActiveTeachers / totalTeachers) * 100) : 0}%
                            </h4>
                            <p className="text-xs text-primary-100 font-bold tracking-widest uppercase">Keaktifan Guru</p>
                        </div>
                        <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                            <h4 className="text-4xl font-black mb-1">
                                {stats.engagement.uniqueActiveTeachers > 0 ? (stats.engagement.totalAttendance / stats.engagement.uniqueActiveTeachers).toFixed(1) : 0}
                            </h4>
                            <p className="text-xs text-primary-100 font-bold tracking-widest uppercase">Kegiatan / Guru</p>
                        </div>
                    </div>
                </div>
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-400/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
            </div>
        </div>
    );
}
