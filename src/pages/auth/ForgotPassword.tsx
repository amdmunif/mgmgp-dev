import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { api } from '../../lib/api'; // use if ready

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await api.post('/auth/forgot-password', { email });
            setMessage({
                type: 'success',
                text: 'Jika email terdaftar, link reset password akan dikirimkan.'
            });
            // Optionally redirect or clear form
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Gagal memproses permintaan. Silakan coba lagi.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-grow flex items-center justify-center bg-gray-50/50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 relative">

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="w-8 h-8 text-primary-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Lupa Password?</h1>
                    <p className="text-gray-500 text-sm mt-3 px-4">Jangan khawatir, masukkan email Anda dan kami akan mengirimkan petunjuk reset password.</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg text-sm mb-6 flex items-start ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">Email Terdaftar</label>
                        <input
                            type="email"
                            required
                            className="block w-full rounded-lg border-gray-300 bg-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4 text-sm transition-all hover:border-gray-400 placeholder-gray-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nama@email.com"
                        />
                    </div>

                    <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all" disabled={loading}>
                        {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Mengirim...</> : 'Kirim Link Reset'}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Halaman Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
