import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { AlertCircle, CheckCircle, ArrowLeft, Loader2, KeyRound } from 'lucide-react';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Password tidak cocok.' });
            return;
        }
        if (!token || !email) {
            setMessage({ type: 'error', text: 'Token atau email tidak valid.' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            await api.post('/auth/reset-password', {
                token,
                email,
                password
            });

            setMessage({
                type: 'success',
                text: 'Password berhasil diubah. Silakan login dengan password baru Anda.'
            });

            // Redirect after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Gagal mereset password.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div className="flex-grow flex items-center justify-center bg-gray-50/50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 relative text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Link Tidak Valid</h2>
                    <p className="text-gray-500 mb-6">Link reset password tidak valid atau sudah kadaluarsa.</p>
                    <Link to="/forgot-password" className="text-primary-600 hover:underline font-medium">
                        Minta link baru
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-grow flex items-center justify-center bg-gray-50/50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 relative">

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="w-8 h-8 text-primary-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
                    <p className="text-gray-500 text-sm mt-3 px-4">Masukkan password baru untuk akun Anda.</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg text-sm mb-6 flex items-start ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {message.type === 'error' ? <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" /> : <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />}
                        <span>{message.text}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700" htmlFor="password">Password Baru</label>
                        <input
                            id="password"
                            type="password"
                            required
                            className="block w-full rounded-lg border-gray-300 bg-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4 text-sm transition-all hover:border-gray-400 placeholder-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            minLength={6}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700" htmlFor="confirmPassword">Konfirmasi Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            required
                            className="block w-full rounded-lg border-gray-300 bg-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4 text-sm transition-all hover:border-gray-400 placeholder-gray-400"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ulangi password baru"
                        />
                    </div>

                    <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all" disabled={isLoading}>
                        {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Menyimpan...</> : 'Ubah Password'}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Login
                    </Link>
                </div>

            </div>
        </div>
    );
}
