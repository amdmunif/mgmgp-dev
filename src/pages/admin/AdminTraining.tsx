import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, Users, DollarSign, Search, CheckCircle2, Clock, XCircle, FileText, Settings, Save, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';

interface Registration {
    id: string;
    registration_code: string;
    nama_lengkap: string;
    email: string;
    no_wa: string;
    asal_sekolah: string;
    is_premium: number;
    total_payment: string;
    payment_status: string;
    registered_at: string;
}

export function AdminTraining() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('data'); // 'data' | 'settings'
    
    // Settings state
    const [settings, setSettings] = useState<any>({
        event_name: '',
        event_date: '',
        price_regular: '',
        price_premium: '',
        description: ''
    });
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Pelatihan Publik',
                description: 'Kelola pendaftaran dan pengaturan pelatihan publik.',
                icon: <Calendar className="w-6 h-6 text-blue-600" />
            });
        }
        fetchData();
    }, [setPageHeader]);

    const fetchData = async () => {
        try {
            const [regData, settsData] = await Promise.all([
                api.get('/training/registrations'),
                api.get('/training/settings')
            ]);
            setRegistrations(regData || []);
            if(settsData && !settsData.message) {
                setSettings(settsData);
            }
        } catch (e: any) {
            toast.error('Gagal mengambil data pelatihan');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        // Todo: Connect to backend to update status
        toast.success(`Status diubah menjadi ${status}`);
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            // NOTE: Backend for saving training settings isn't fully implemented yet,
            // You will need to add an endpoint in TrainingController.php to handle this POST request.
            await api.post('/training/settings', settings);
            toast.success('Pengaturan pelatihan berhasil disimpan');
        } catch (e) {
            toast.error('Gagal menyimpan pengaturan');
        } finally {
            setSavingSettings(false);
        }
    };

    const stats = {
        total: registrations.length,
        paid: registrations.filter(r => r.payment_status === 'paid').length,
        pending: registrations.filter(r => r.payment_status === 'pending').length,
        revenue: registrations.filter(r => r.payment_status === 'paid').reduce((acc, curr) => acc + Number(curr.total_payment), 0)
    };

    const filteredData = registrations.filter(r => 
        r.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.registration_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button 
                    className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 ${activeTab === 'data' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('data')}
                >
                    <Users className="w-4 h-4" /> Data Pendaftar
                </button>
                <button 
                    className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 ${activeTab === 'settings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <Settings className="w-4 h-4" /> Pengaturan Pelatihan
                </button>
            </div>

            {activeTab === 'data' && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
                                <h3 className="font-semibold text-gray-700">Total Pendaftar</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
                                <h3 className="font-semibold text-gray-700">Sudah Bayar</h3>
                            </div>
                            <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><Clock className="w-5 h-5" /></div>
                                <h3 className="font-semibold text-gray-700">Pending</h3>
                            </div>
                            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
                                <h3 className="font-semibold text-gray-700">Pendapatan</h3>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">Rp {stats.revenue.toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Cari nama atau kode registrasi..." 
                                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Kode & Tanggal</th>
                                        <th className="px-6 py-4 font-semibold">Peserta</th>
                                        <th className="px-6 py-4 font-semibold">Tagihan</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat data...</td></tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada pendaftar.</td></tr>
                                    ) : (
                                        filteredData.map((reg) => (
                                            <tr key={reg.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4">
                                                    <div className="font-mono text-xs font-semibold text-gray-900 mb-1">{reg.registration_code}</div>
                                                    <div className="text-xs text-gray-500">{new Date(reg.registered_at).toLocaleString('id-ID')}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{reg.nama_lengkap}</div>
                                                    <div className="text-xs text-gray-500">{reg.asal_sekolah}</div>
                                                    <div className="text-xs text-gray-400">{reg.no_wa}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">Rp {Number(reg.total_payment).toLocaleString('id-ID')}</div>
                                                    <div className="text-[10px] uppercase font-bold text-gray-500">{reg.is_premium ? 'Premium' : 'Reguler'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {reg.payment_status === 'paid' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="w-3 h-3" /> Lunas</span>}
                                                    {reg.payment_status === 'pending' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200"><Clock className="w-3 h-3" /> Pending</span>}
                                                    {reg.payment_status === 'failed' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3 h-3" /> Gagal</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {reg.payment_status === 'pending' && (
                                                        <button onClick={() => handleUpdateStatus(reg.id, 'paid')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                                            Verifikasi Lunas
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-bold text-gray-900">Pengaturan Pelatihan</h2>
                        <p className="text-sm text-gray-500">Atur harga dan informasi acara yang akan ditampilkan di halaman pendaftaran publik.</p>
                    </div>
                    <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Acara Pelatihan</label>
                                <input 
                                    type="text" 
                                    required
                                    value={settings.event_name || ''} 
                                    onChange={e => setSettings({...settings, event_name: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Acara</label>
                                <input 
                                    type="date" 
                                    required
                                    value={settings.event_date ? settings.event_date.split('T')[0] : ''} 
                                    onChange={e => setSettings({...settings, event_date: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga Reguler (Umum)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                                        <input 
                                            type="number" 
                                            required
                                            value={settings.price_regular || ''} 
                                            onChange={e => setSettings({...settings, price_regular: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga Member Premium</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                                        <input 
                                            type="number" 
                                            required
                                            value={settings.price_premium || ''} 
                                            onChange={e => setSettings({...settings, price_premium: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-green-600 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi Pelatihan</label>
                                <textarea 
                                    rows={4}
                                    value={settings.description || ''} 
                                    onChange={e => setSettings({...settings, description: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <Button type="submit" disabled={savingSettings} className="bg-blue-600 hover:bg-blue-700">
                                {savingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Simpan Pengaturan
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
