import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Loader2, Crown, CheckCircle, Upload, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils'; // Assumes utils exist

export function AdminPremium() {
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('premium_subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setSubscription(data);
        } catch (error) {
            console.error('Error checking subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpgrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setMessage({ type: 'error', text: 'Mohon pilih file bukti transfer terlebih dahulu.' });
            return;
        }

        setUploading(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not logged in');

            // 1. Upload file
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('payment_proofs')
                .upload(filePath, file);

            if (uploadError) {
                if (uploadError.message.includes('Bucket not found')) {
                    throw new Error('Storage belum dikonfigurasi. Hubungi Admin.');
                }
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('payment_proofs')
                .getPublicUrl(filePath);

            // 2. Create subscription record
            const today = new Date();
            const nextYear = new Date(today);
            nextYear.setFullYear(today.getFullYear() + 1);

            const { error: dbError } = await supabase
                .from('premium_subscriptions')
                .insert({
                    user_id: user.id,
                    start_date: today.toISOString(),
                    end_date: nextYear.toISOString(),
                    payment_proof_url: publicUrl,
                    status: 'pending'
                });

            if (dbError) throw dbError;

            setMessage({ type: 'success', text: 'Permintaan upgrade berhasil dikirim. Menunggu konfirmasi admin.' });
            checkSubscription(); // Refresh state
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Gagal mengirim permintaan.' });
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /> Checking status...</div>;

    const isPremium = subscription && subscription.status === 'active';
    const isPending = subscription && subscription.status === 'pending';
    const isExpired = subscription && (subscription.status === 'expired' || new Date(subscription.end_date) < new Date());

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Crown className="w-8 h-8 text-yellow-500" />
                <h1 className="text-2xl font-bold text-gray-900">Membership Premium</h1>
            </div>

            {isPremium ? (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-8 rounded-xl border border-yellow-200">
                    <div className="flex items-center gap-4 text-yellow-700 mb-4">
                        <CheckCircle className="w-8 h-8" />
                        <h2 className="text-2xl font-bold">Akun Anda Premium!</h2>
                    </div>
                    <p className="text-yellow-800 mb-4">Nikmati akses penuh ke semua fitur MGMP Informatika.</p>
                    <div className="bg-white/60 p-4 rounded-lg">
                        <p className="font-semibold text-gray-700">Masa Aktif:</p>
                        <p className="text-lg">{formatDate(subscription.start_date)} - {formatDate(subscription.end_date)}</p>
                    </div>
                </div>
            ) : isPending ? (
                <div className="bg-blue-50 p-8 rounded-xl border border-blue-200 text-center">
                    <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-blue-800 mb-2">Menunggu Konfirmasi</h2>
                    <p className="text-blue-600">Terima kasih telah melakukan pembayaran. Admin kami sedang memverifikasi bukti transfer Anda. Proses ini biasanya memakan waktu 1x24 jam.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Benefits Column */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Kenapa Upgrade Premium?</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-600">Akses ribuan <strong>Bank Soal</strong> siap pakai</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-600">Download <strong>Perangkat Pembelajaran (RPP/Modul)</strong> lengkap</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-600">Akses <strong>Prompt Library</strong> untuk AI tools</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-600">Prioritas pendaftaran event workshop</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gray-800 text-white p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-bold mb-2">Biaya Langganan</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold">{formatCurrency(100000)}</span>
                                <span className="text-gray-400">/tahun</span>
                            </div>
                            {isExpired && <p className="text-red-400 text-sm mt-2">Langganan Anda telah berakhir.</p>}
                        </div>
                    </div>

                    {/* Payment Form Column */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Form Upgrade</h3>

                        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
                            <p className="text-sm text-gray-500 mb-2">Silakan transfer ke rekening berikut:</p>
                            <p className="font-bold text-gray-900">Bank Jateng</p>
                            <p className="text-xl font-mono text-gray-900">123-456-7890</p>
                            <p className="text-sm text-gray-600">a.n. MGMP Informatika Wonosobo</p>
                        </div>

                        <form onSubmit={handleUpgrade} className="space-y-4">
                            {message && (
                                <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                    {message.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Bukti Transfer</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-primary-50 file:text-primary-700
                                  hover:file:bg-primary-100
                                "
                                    />
                                    <p className="text-xs text-gray-400 mt-2">Format: JPG, PNG, PDF (Max 2MB)</p>
                                </div>
                                {file && <p className="text-sm text-green-600 mt-2">File terpilih: {file.name}</p>}
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded text-xs text-yellow-800">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                Pastikan nominal transfer sesuai. Akun akan aktif otomatis setelah admin memverifikasi.
                            </div>

                            <Button type="submit" className="w-full" disabled={uploading}>
                                {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</> : 'Kirim Bukti Pembayaran'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
