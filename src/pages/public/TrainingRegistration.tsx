import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Mail, Phone, Building, ArrowRight, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { api } from '../../lib/api';
import { authService } from '../../services/authService';
import { toast } from 'react-hot-toast';

interface TrainingSettings {
    event_name: string;
    event_date: string;
    price_regular: string;
    price_premium: string;
    description: string;
}

export function TrainingRegistration() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<TrainingSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // User context (if logged in)
    const [user, setUser] = useState<any>(null);
    const [isPremium, setIsPremium] = useState(false);

    const [form, setForm] = useState({
        nama_lengkap: '',
        email: '',
        no_wa: '',
        asal_sekolah: ''
    });

    const [successData, setSuccessData] = useState<any>(null);

    useEffect(() => {
        // Fetch Settings
        api.get('/training/settings')
            .then(data => setSettings(data as TrainingSettings))
            .catch(() => toast.error('Gagal memuat info pelatihan'))
            .finally(() => setLoading(false));

        // Check if user is logged in to auto-fill and give premium discount
        authService.getCurrentUser().then(data => {
            if (data?.profile) {
                setUser(data.profile);
                const premium = data.profile.premium_until && new Date(data.profile.premium_until) > new Date();
                setIsPremium(!!premium);
                setForm({
                    nama_lengkap: data.profile.nama || '',
                    email: data.profile.email || '',
                    no_wa: data.profile.no_hp || '',
                    asal_sekolah: data.profile.asal_sekolah || ''
                });
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = await api.post('/training/register', {
                ...form,
                user_id: user?.id || null,
                is_premium: isPremium ? 1 : 0
            });
            setSuccessData(data);
            toast.success('Pendaftaran berhasil!');
        } catch (e: any) {
            toast.error(e.message || 'Gagal mendaftar');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (!settings) return <div className="min-h-screen flex items-center justify-center text-gray-500">Informasi pelatihan tidak ditemukan.</div>;

    const currentPrice = isPremium ? Number(settings.price_premium) : Number(settings.price_regular);

    if (successData) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 print:py-0 print:bg-white">
                <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 print:p-0 print:border-none print:shadow-none animate-in zoom-in-95 duration-500">
                    
                    {/* Header Invoice (Hanya tampil saat print) */}
                    <div className="hidden print:flex items-center justify-between border-b-2 border-blue-600 pb-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-blue-600 tracking-tight">INVOICE</h1>
                            <p className="text-sm text-gray-500 font-medium">MGMP Informatika - {settings.event_name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">Kode: {successData.registration_code}</p>
                            <p className="text-xs text-gray-500">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
                        </div>
                    </div>

                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 print:hidden">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center print:hidden">Pendaftaran Berhasil!</h1>
                    <p className="text-gray-600 mb-8 text-center print:hidden">Terima kasih telah mendaftar. Kode booking Anda adalah:</p>
                    
                    {/* Kotak Kode Registrasi */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 text-center print:bg-white print:border-gray-300">
                        <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Kode Registrasi / Booking</p>
                        <p className="text-3xl font-black text-gray-900 tracking-widest">{successData.registration_code}</p>
                    </div>

                    {/* Detail Pendaftar */}
                    <div className="mb-8 hidden print:block">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Detail Pendaftar</h3>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr><td className="py-2 text-gray-500 w-1/3">Nama Lengkap</td><td className="py-2 font-semibold text-gray-900">{form.nama_lengkap}</td></tr>
                                <tr><td className="py-2 text-gray-500">Instansi / Sekolah</td><td className="py-2 font-semibold text-gray-900">{form.asal_sekolah}</td></tr>
                                <tr><td className="py-2 text-gray-500">Email</td><td className="py-2 font-semibold text-gray-900">{form.email}</td></tr>
                                <tr><td className="py-2 text-gray-500">Tipe Tiket</td><td className="py-2 font-semibold text-blue-600">{isPremium ? 'Member Premium' : 'Reguler/Umum'}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="text-left bg-blue-50 text-blue-900 p-6 rounded-xl border border-blue-100 mb-8 space-y-4 print:bg-white print:border-gray-300">
                        <p className="font-bold flex items-center gap-2 text-lg"><AlertCircle className="w-5 h-5 print:hidden" /> Rincian Tagihan</p>
                        
                        <div className="flex justify-between items-center py-2 border-b border-blue-100 print:border-gray-200">
                            <span className="text-sm">Biaya Pendaftaran</span>
                            <span className="font-semibold text-gray-900">Rp {Number(settings.price_regular).toLocaleString('id-ID')}</span>
                        </div>
                        {isPremium && (
                            <div className="flex justify-between items-center py-2 border-b border-blue-100 print:border-gray-200 text-green-700">
                                <span className="text-sm">Diskon Premium</span>
                                <span className="font-semibold">- Rp {(Number(settings.price_regular) - Number(settings.price_premium)).toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-lg">Total Pembayaran</span>
                            <span className="font-black text-2xl text-blue-700">Rp {currentPrice.toLocaleString('id-ID')}</span>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-blue-100 mt-4 print:border-gray-300">
                            <p className="text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">Metode Pembayaran (Transfer Bank)</p>
                            <p className="text-lg font-mono font-black text-gray-900">BSI - 7123456789</p>
                            <p className="text-sm font-semibold text-gray-600">a.n. MGMP Informatika</p>
                        </div>
                        
                        <p className="text-sm print:text-xs italic text-gray-600 mt-4">Mohon segera lakukan transfer dan konfirmasi pembayaran melalui WhatsApp admin dengan menyertakan Invoice ini atau kode registrasi.</p>
                    </div>

                    <div className="flex gap-4 print:hidden">
                        <Button onClick={() => window.print()} variant="outline" className="w-1/2 flex items-center justify-center gap-2 border-gray-300">
                            <FileText className="w-4 h-4" /> Cetak Invoice (PDF)
                        </Button>
                        <Button onClick={() => navigate('/')} className="w-1/2">Selesai</Button>
                    </div>
                </div>
            </div>
        );
    }

    const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all";

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header / Hero */}
            <div className="bg-blue-600 text-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <h1 className="text-3xl md:text-5xl font-black">{settings.event_name}</h1>
                    <p className="text-blue-100 text-lg max-w-2xl mx-auto">{settings.description}</p>
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm font-medium">
                        <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full"><Calendar className="w-4 h-4" /> {new Date(settings.event_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                        <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full"><MapPin className="w-4 h-4" /> Online (Zoom)</span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Formulir Pendaftaran</h2>
                            
                            {user && !isPremium && (
                                <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl text-sm flex gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>Anda login sebagai anggota Reguler. Dapatkan diskon khusus pendaftaran dengan <a href="/member/upgrade" className="font-bold underline">Upgrade Premium</a>.</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Nama Lengkap & Gelar</label>
                                        <div className="relative">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input required type="text" className={`${inputClass} pl-12`} value={form.nama_lengkap} onChange={e => setForm(p => ({ ...p, nama_lengkap: e.target.value }))} placeholder="Budi Santoso, S.Kom" readOnly={!!user?.nama} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Email Aktif</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input required type="email" className={`${inputClass} pl-12`} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="budi@example.com" readOnly={!!user?.email} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">No. WhatsApp</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input required type="tel" className={`${inputClass} pl-12`} value={form.no_wa} onChange={e => setForm(p => ({ ...p, no_wa: e.target.value }))} placeholder="08123456789" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Instansi / Asal Sekolah</label>
                                        <div className="relative">
                                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input required type="text" className={`${inputClass} pl-12`} value={form.asal_sekolah} onChange={e => setForm(p => ({ ...p, asal_sekolah: e.target.value }))} placeholder="SMP Negeri 1..." />
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg" disabled={submitting}>
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Selesaikan Pendaftaran <ArrowRight className="w-5 h-5 ml-2" /></>}
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                            <div className="p-6 bg-gray-50 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900">Ringkasan Biaya</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Kategori Pendaftar</span>
                                    <span className={`font-semibold ${isPremium ? 'text-yellow-600' : 'text-gray-900'}`}>
                                        {isPremium ? 'Member Premium' : (user ? 'Member Reguler' : 'Umum')}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Biaya Pendaftaran</span>
                                    <span className="font-semibold text-gray-900">Rp {Number(settings.price_regular).toLocaleString('id-ID')}</span>
                                </div>
                                {isPremium && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Diskon Premium</span>
                                        <span className="font-semibold">- Rp {(Number(settings.price_regular) - Number(settings.price_premium)).toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <span className="font-bold text-gray-900">Total Tagihan</span>
                                    <span className="text-2xl font-black text-blue-600">Rp {currentPrice.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
