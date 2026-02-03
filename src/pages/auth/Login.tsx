import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/button';
import { FormInput } from '../../components/ui/VerifiedFormElements';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';

export function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const { register, handleSubmit } = useForm();

    const handleLogin = async (data: any) => {
        setLoading(true);
        setError(null);

        try {
            const response = await authService.login(data.email, data.password);

            if (response.user) {
                // Redirect based on role
                if (response.user.role === 'Admin') {
                    navigate('/admin');
                } else {
                    navigate('/member');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Gagal login. Periksa email dan password Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-grow flex items-center justify-center bg-gray-50/50 p-4">
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
                {/* Left Side: Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Selamat Datang</h1>
                        <p className="text-gray-500">Masuk untuk mengakses layanan anggota MGMP.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg text-sm mb-6 animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
                        <FormInput
                            label="Email"
                            type="email"
                            placeholder="email@sekolah.sch.id"
                            register={register}
                            name="email"
                            required
                        />

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold text-gray-700">Password</span>
                                <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                                    Lupa Password?
                                </Link>
                            </div>
                            {/* We use FormInput here but pass label="" to key the strict layout, or just use it normally. 
                                The user's layout has the link INSIDE the label row. 
                                I will adapt usage. */}
                            <FormInput
                                label="" // Label handled above for custom layout
                                type="password"
                                placeholder="••••••••"
                                register={register}
                                name="password"
                                required
                                className="!mt-0"
                            />
                        </div>

                        <Button type="submit" className="w-full h-11 text-base mt-2 shadow-primary-500/20 hover:shadow-primary-500/30 transition-all font-semibold rounded-xl" disabled={loading}>
                            {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sedang memproses...</> : 'Masuk ke Akun'}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-gray-500 text-sm">Belum punya akun?</p>
                        <Link to="/register">
                            <Button variant="outline" className="mt-3 w-full border-gray-200 hover:bg-gray-50 text-gray-700">
                                Daftar Anggota Baru <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Right Side: Hero/Banner */}
                <div className="hidden md:flex w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-12 text-white flex-col justify-between relative overflow-hidden">
                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 rounded-full bg-white/5 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 rounded-full bg-white/5 blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="bg-white/10 backdrop-blur-sm inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-white/20 mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                            MGMP Informatika Wonosobo
                        </div>
                        <h2 className="text-4xl font-bold leading-tight mb-4">
                            Tingkatkan Kompetensi, <br />
                            Jalin Kolaborasi.
                        </h2>
                        <p className="text-primary-100 text-lg leading-relaxed max-w-sm">
                            Bergabunglah dengan komunitas guru informatika untuk berbagi pengetahuan, materi ajar, dan pengalaman.
                        </p>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-4 mt-12">
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                            <div className="text-2xl font-bold mb-1">50+</div>
                            <div className="text-xs text-primary-200">Guru Terdaftar</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                            <div className="text-2xl font-bold mb-1">12+</div>
                            <div className="text-xs text-primary-200">Sekolah Mitra</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
