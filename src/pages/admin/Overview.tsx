import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Users, Calendar, FileText, ArrowRight, Activity, Clock } from 'lucide-react';
import { authService } from '../../services/authService';
import { useEffect, useState } from 'react';

export function DashboardOverview() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        authService.getCurrentUser().then(data => setUser(data?.user));
    }, []);

    return (
        <div className="space-y-8">
            {/* Welcome Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white shadow-xl">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 rounded-full bg-white/10 blur-3xl"></div>

                <div className="relative z-10 p-8 md:p-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-700/50 border border-primary-600 text-xs font-medium text-primary-100 mb-3">
                                <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                                Sistem Aktif
                            </div>
                            <h1 className="text-3xl font-bold mb-2">
                                Selamat Datang, {user?.email?.split('@')[0] || 'Admin'}! 👋
                            </h1>
                            <p className="text-primary-100 max-w-xl text-lg opacity-90">
                                Selamat bertugas di Dashboard MGMP Informatika. Kelola anggota, surat, dan agenda kegiatan dengan mudah.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link to="/">
                                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary-900 backdrop-blur-sm">
                                    Lihat Website
                                </Button>
                            </Link>
                            <Link to="/admin/members">
                                <Button className="bg-white text-primary-900 hover:bg-gray-100 border-none shadow-lg">
                                    Kelola Anggota <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-full">+12%</span>
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Total Anggota</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">120</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-purple-50 text-purple-700 rounded-full">3 Aktif</span>
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Agenda Kegiatan</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">15</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                            <FileText className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Bulan Ini</span>
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">Surat Keluar</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">24</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity & Quick Actions Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary-600" />
                            <h3 className="text-lg font-bold text-gray-900">Aktivitas Terbaru</h3>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary-600">Lihat Semua</Button>
                    </div>

                    <div className="space-y-0 divide-y divide-gray-100">
                        <div className="flex items-start gap-4 py-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                                A
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Ahmad Munif mendaftar sebagai anggota baru</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">2 jam yang lalu</span>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="text-xs">Review</Button>
                        </div>

                        <div className="flex items-start gap-4 py-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold flex-shrink-0">
                                S
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Surat undangan rapat telah dibuat</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">5 jam yang lalu</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 py-4">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold flex-shrink-0">
                                E
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Event "Workshop Kurikulum Merdeka" dipublikasikan</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">1 hari yang lalu</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Info/System Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Status Sistem</h3>
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-600">Storage</span>
                                <span className="text-xs font-bold text-gray-900">45%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">1.2GB dari 5GB terpakai</p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-600">Bandwidth</span>
                                <span className="text-xs font-bold text-gray-900">68%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Masih dalam batas aman</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
