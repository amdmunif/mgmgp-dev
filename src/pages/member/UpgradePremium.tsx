import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Loader2, Upload, CheckCircle, Clock, XCircle, CreditCard, ShieldCheck, Crown } from 'lucide-react';
import { settingsService, type AppSettings, type BankAccount } from '../../services/settingsService';
import { premiumService, type PremiumRequest } from '../../services/premiumService';
import { cn } from '../../lib/utils';

import { useOutletContext } from 'react-router-dom';

export function UpgradePremium() {
    const { setPageHeader } = useOutletContext<any>();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [latestRequest, setLatestRequest] = useState<PremiumRequest | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // User Bank Info Form
    const [bankInfo, setBankInfo] = useState({
        bank_name: '',
        account_number: '',
        account_holder: ''
    });

    useEffect(() => {
        setPageHeader({
            title: 'Upgrade Premium',
            description: 'Dapatkan akses penuh ke Bank Soal & Materi Eksklusif.',
            icon: <Crown className="w-6 h-6 text-yellow-600" />
        });
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [settingsData, requestData, bankData] = await Promise.all([
                settingsService.getSettings(),
                premiumService.getMyLatestRequest(),
                settingsService.getBankAccounts(true)
            ]);
            setSettings(settingsData);
            setLatestRequest(requestData);
            setBankAccounts(bankData);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProofFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBankInfo({ ...bankInfo, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proofFile) {
            alert('Mohon upload bukti transfer');
            return;
        }

        setSubmitting(true);
        try {
            await premiumService.submitRequest(proofFile, bankInfo);
            // Reload to show pending state
            const req = await premiumService.getMyLatestRequest();
            setLatestRequest(req);
            setProofFile(null);
            setPreviewUrl(null);
        } catch (error: any) {
            alert('Gagal mengirim request: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    // View: Request Pending
    if (latestRequest?.status === 'pending') {
        return (
            <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-2xl shadow-sm border border-orange-100">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Menunggu Verifikasi</h2>
                <p className="text-gray-600 mb-6">
                    Terima kasih telah melakukan upgrade. Admin kami sedang memverifikasi bukti pembayaran Anda.
                    Proses ini biasanya memakan waktu 1x24 jam.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg inline-block text-left">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Detail Request</p>
                    <p className="text-sm">Tanggal: <span className="font-medium">{new Date(latestRequest.created_at).toLocaleDateString('id-ID')}</span></p>
                    <p className="text-sm">Bank Pengirim: <span className="font-medium">{latestRequest.bank_name || '-'}</span></p>
                </div>
            </div>
        );
    }

    // View: Premium Active (Approved) - Though maybe we still let them extend?
    // Let's assume if approved they can extend, but show a badge.

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                {/* Benefits & Payment Info */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-primary-900 to-primary-800 text-white rounded-2xl p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-primary-100">Biaya Langganan</h3>
                                <div className="flex items-baseline mt-1">
                                    <span className="text-4xl font-bold">Rp {parseInt(settings?.premium_price?.toString() || '0').toLocaleString('id-ID')}</span>
                                    <span className="text-primary-200 ml-2">/ tahun</span>
                                </div>
                            </div>
                            <ShieldCheck className="w-12 h-12 text-primary-300 opacity-50" />
                        </div>

                        <div className="space-y-4 mb-8">
                            <BenefitItem text="Akses Download RPP & Modul Ajar" />
                            <BenefitItem text="Akses Bank Soal & Pembahasan" />
                            <BenefitItem text="Akses Perpustakaan Prompt AI" />
                            <BenefitItem text="Prioritas Undangan Event MGMP" />
                            <BenefitItem text="Support Pengembangan Komunitas" />
                        </div>

                        <div className="pt-6 border-t border-primary-700/50">
                            <p className="text-primary-200 text-sm mb-3">Silakan transfer ke salah satu rekening resmi:</p>
                            <div className="space-y-3">
                                {bankAccounts.length > 0 ? bankAccounts.map(account => (
                                    <div key={account.id} className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-2">
                                            <CreditCard className="w-5 h-5 text-yellow-400" />
                                            <span className="font-bold text-lg">{account.bank_name}</span>
                                        </div>
                                        <p className="font-mono text-2xl tracking-wider mb-1 selection:bg-yellow-400 selection:text-black">
                                            {account.account_number}
                                        </p>
                                        <p className="text-sm text-primary-200 uppercase tracking-wide">
                                            a.n. {account.account_holder}
                                        </p>
                                    </div>
                                )) : (
                                    // Fallback if no specific bank accounts, try legacy settings (or show nothing/alert)
                                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                        <p className="text-primary-200">Belum ada rekening pembayaran yang tersedia.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {latestRequest?.status === 'rejected' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-red-800">Request Sebelumnya Ditolak</h4>
                                <p className="text-sm text-red-600 mt-1">Alasan: {latestRequest.notes || 'Bukti pembayaran tidak valid.'}</p>
                                <p className="text-sm text-red-700 mt-2 font-medium">Silakan upload ulang bukti pembayaran yang benar.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Upload Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Konfirmasi Pembayaran</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Bank Pengirim</label>
                                <input
                                    type="text"
                                    name="bank_name"
                                    required
                                    placeholder="Contoh: BCA, Mandiri, BRI"
                                    value={bankInfo.bank_name}
                                    onChange={handleBankChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">No. Rekening</label>
                                    <input
                                        type="text"
                                        name="account_number"
                                        required
                                        value={bankInfo.account_number}
                                        onChange={handleBankChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Atas Nama</label>
                                    <input
                                        type="text"
                                        name="account_holder"
                                        required
                                        value={bankInfo.account_holder}
                                        onChange={handleBankChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bukti Transfer</label>
                            <label
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors relative overflow-hidden",
                                    proofFile ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:bg-gray-50"
                                )}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500"><span className="font-semibold">Klik untuk upload</span> atau drag and drop</p>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG (Maks. 2MB)</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>

                        <Button type="submit" className="w-full py-6 text-lg" disabled={submitting}>
                            {submitting ? <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Mengirim...</> : 'Kirim Bukti Pembayaran'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function BenefitItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-primary-700 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-primary-50 font-medium">{text}</span>
        </div>
    );
}
