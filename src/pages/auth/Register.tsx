import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
    Loader2, Upload, AlertCircle, CheckCircle2,
    User, Lock, Briefcase,
    BookOpen, ChevronRight, ChevronLeft, Check
} from 'lucide-react';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/button';
import { registerSchema, type RegisterFormValues } from '../../lib/schemas/registerSchema';

const STEPS = [
    { id: 1, title: 'Identitas', icon: User },
    { id: 2, title: 'Profesi', icon: Briefcase },
    { id: 3, title: 'Mengajar', icon: BookOpen },
    { id: 4, title: 'Akun', icon: Lock },
];

export function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const {
        register,
        handleSubmit,
        watch,
        trigger,
        formState: { errors }
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            mapel_diampu: [],
            kelas_mengajar: []
        }
    });

    const fotoFiles = watch("foto_profil");
    const mapelDiampu = watch("mapel_diampu");
    const kelasMengajar = watch("kelas_mengajar");

    // Validation fields per step
    const validateStep = async (step: number) => {
        let fieldsToValidate: any[] = [];
        switch (step) {
            case 1:
                fieldsToValidate = ['nama', 'no_hp', 'ukuran_baju'];
                // gelar is optional, so we don't strictly need to block if it's empty, but trigger will handle it based on schema
                break;
            case 2:
                fieldsToValidate = ['asal_sekolah', 'status_kepegawaian', 'pendidikan_terakhir', 'jurusan'];
                break;
            case 3:
                fieldsToValidate = ['mapel_diampu', 'kelas_mengajar'];
                break;
            case 4:
                fieldsToValidate = ['email', 'password', 'confirmPassword'];
                // foto_profil is optional in schema for now
                break;
        }

        const isValid = await trigger(fieldsToValidate);
        return isValid;
    };

    const handleNext = async () => {
        const isValid = await validateStep(currentStep);
        if (isValid) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onSubmit = async (data: RegisterFormValues) => {
        setLoading(true);
        setServerError(null);

        try {
            const payload = {
                email: data.email,
                password: data.password,
                profile: {
                    nama: data.nama,
                    gelar: data.gelar,
                    no_hp: data.no_hp,
                    ukuran_baju: data.ukuran_baju,
                    asal_sekolah: data.asal_sekolah,
                    status_kepegawaian: data.status_kepegawaian,
                    pendidikan_terakhir: data.pendidikan_terakhir,
                    jurusan: data.jurusan,
                    mapel_diampu: data.mapel_diampu,
                    mapel_lainnya: data.mapel_lainnya,
                    kelas_mengajar: data.kelas_mengajar,
                },
            };

            await authService.register(
                data.email,
                data.password,
                payload.profile
            );

            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            console.error(err);
            setServerError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Pendaftaran Berhasil!</h2>
                    <p className="text-gray-600 mb-8 text-lg">Akun Anda telah dibuat. Silakan login untuk melengkapi profil dan mengakses fitur anggota.</p>
                    <Link to="/login">
                        <Button className="w-full h-12 text-lg">Ke Halaman Login</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-grow flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-3xl">

                {/* Header Text */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Daftar Anggota MGMP</h1>
                    <p className="text-gray-500 mt-2">Bergabung dengan komunitas dalam 4 langkah mudah</p>
                </div>

                {/* Progress Stepper */}
                <div className="mb-8 hidden sm:flex justify-between relative px-6">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2 rounded"></div>
                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <div key={step.id} className="flex flex-col items-center bg-gray-50 px-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-500/30' :
                                    isCompleted ? 'border-primary-600 bg-white text-primary-600' :
                                        'border-gray-300 bg-white text-gray-400'
                                    }`}>
                                    {isCompleted ? <Check size={20} /> : <Icon size={18} />}
                                </div>
                                <span className={`text-xs font-semibold mt-2 transition-colors duration-300 ${isActive ? 'text-primary-700' : isCompleted ? 'text-primary-600' : 'text-gray-400'
                                    }`}>{step.title}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Stepper (Simpler) */}
                <div className="mb-6 sm:hidden flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
                    <span className="text-sm font-semibold text-gray-600">Langkah {currentStep} dari 4</span>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-2 w-2 rounded-full ${i === currentStep ? 'bg-primary-600' : i < currentStep ? 'bg-primary-300' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
                    {/* Decorative Top Line */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700"></div>

                    {serverError && (
                        <div className="mx-8 mt-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start text-red-700">
                            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{serverError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit, (errors) => console.log("Validation Errors:", errors))} className="p-6 md:p-10">
                        {/* Step 1: Identitas */}
                        <div className={currentStep === 1 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <User className="mr-2 text-primary-600" /> Identitas Diri
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <FormInput label="Nama Lengkap" placeholder="Nama tanpa gelar" register={register} name="nama" error={errors.nama} required autoFocus />
                                </div>
                                <FormInput label="Gelar" placeholder="Contoh: S.Kom" register={register} name="gelar" error={errors.gelar} />
                                <FormInput label="No. WhatsApp" placeholder="08xxxx" register={register} name="no_hp" error={errors.no_hp} required />
                                <div>
                                    <label className="form-label">Ukuran Baju <span className="text-red-500">*</span></label>
                                    <select {...register('ukuran_baju')} className={`form-select ${errors.ukuran_baju ? 'border-red-500' : ''}`}>
                                        <option value="">Pilih Ukuran</option>
                                        {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {errors.ukuran_baju && <p className="form-error">{errors.ukuran_baju.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Profesi */}
                        <div className={currentStep === 2 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Briefcase className="mr-2 text-primary-600" /> Data Profesi
                            </h2>
                            <div className="grid grid-cols-1 gap-6">
                                <FormInput label="Asal Sekolah" placeholder="Nama Sekolah" register={register} name="asal_sekolah" error={errors.asal_sekolah} required autoFocus />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">Status Kepegawaian <span className="text-red-500">*</span></label>
                                        <select {...register('status_kepegawaian')} className={`form-select ${errors.status_kepegawaian ? 'border-red-500' : ''}`}>
                                            <option value="">Pilih Status</option>
                                            {['PNS', 'PPPK', 'GTY', 'GTT', 'Honorer', 'Lainnya'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        {errors.status_kepegawaian && <p className="form-error">{errors.status_kepegawaian.message}</p>}
                                    </div>
                                    <div>
                                        <label className="form-label">Pendidikan Terakhir <span className="text-red-500">*</span></label>
                                        <select {...register('pendidikan_terakhir')} className={`form-select ${errors.pendidikan_terakhir ? 'border-red-500' : ''}`}>
                                            <option value="">Pilih Jenjang</option>
                                            {['D3', 'S1', 'S2', 'S3'].map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        {errors.pendidikan_terakhir && <p className="form-error">{errors.pendidikan_terakhir.message}</p>}
                                    </div>
                                </div>
                                <FormInput label="Jurusan Pendidikan" placeholder="Contoh: Pend. TIK" register={register} name="jurusan" error={errors.jurusan} required />
                            </div>
                        </div>

                        {/* Step 3: Mengajar */}
                        <div className={currentStep === 3 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <BookOpen className="mr-2 text-primary-600" /> Informasi Mengajar
                            </h2>
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                    <label className="form-label mb-3">Mata Pelajaran yang Diampu <span className="text-red-500">*</span></label>
                                    <div className="flex flex-wrap gap-3">
                                        {['Informatika', 'KKA'].map((m) => (
                                            <label key={m} className={`cursor-pointer border rounded-lg px-4 py-3 text-sm font-medium transition-all flex items-center space-x-2 ${mapelDiampu?.includes(m) ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200 hover:border-gray-300'
                                                }`}>
                                                <input type="checkbox" value={m} {...register('mapel_diampu')} className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-gray-300" />
                                                <span>{m}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <input type="text" {...register('mapel_lainnya')} placeholder="Mapel Lainnya (Opsional)..." className="mt-4 w-full text-sm bg-white border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
                                    {errors.mapel_diampu && <p className="form-error">{errors.mapel_diampu.message}</p>}
                                </div>

                                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                    <label className="form-label mb-3">Jenjang Kelas <span className="text-red-500">*</span></label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Kelas VII', 'Kelas VIII', 'Kelas IX'].map((k) => (
                                            <label key={k} className={`cursor-pointer border rounded-lg px-2 py-3 text-sm font-medium transition-all text-center ${kelasMengajar?.includes(k) ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200 hover:border-gray-300'
                                                }`}>
                                                <input type="checkbox" value={k} {...register('kelas_mengajar')} className="hidden" />
                                                <span>{k}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.kelas_mengajar && <p className="form-error">{errors.kelas_mengajar.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Step 4: Akun */}
                        <div className={currentStep === 4 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Lock className="mr-2 text-primary-600" /> Akun & Keamanan
                            </h2>
                            <div className="space-y-5">
                                <FormInput label="Email" type="email" placeholder="email@sekolah.sch.id" register={register} name="email" error={errors.email} required autoFocus />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormInput label="Password" type="password" placeholder="Min 8 karakter" register={register} name="password" error={errors.password} required />
                                    <FormInput label="Ulangi Password" type="password" placeholder="Ketik ulang" register={register} name="confirmPassword" error={errors.confirmPassword} required />
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <label className="form-label">Foto Profil (Opsional)</label>
                                    <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-8 hover:bg-gray-50 cursor-pointer transition-colors relative">
                                        <input type="file" accept="image/*" {...register('foto_profil')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className="text-center">
                                            <Upload className="mx-auto h-10 w-10 text-gray-400" />
                                            <div className="mt-2 flex text-sm text-gray-600 justify-center">
                                                <span className="font-semibold text-primary-600">Klik upload</span>
                                                <p className="pl-1">atau drag & drop</p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Max 2MB (JPG/PNG)</p>
                                            {fotoFiles && fotoFiles.length > 0 && (
                                                <div className="mt-2 text-green-600 text-sm font-medium flex items-center justify-center">
                                                    <CheckCircle2 className="w-4 h-4 mr-1" /> {fotoFiles[0].name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
                            {currentStep > 1 ? (
                                <Button type="button" variant="outline" onClick={handlePrev} className="flex items-center">
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
                                </Button>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    Sudah punya akun? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Login</Link>
                                </div>
                            )}

                            {currentStep < STEPS.length ? (
                                <Button type="button" onClick={handleNext} className="ml-auto w-32">
                                    Lanjut <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button type="submit" className="ml-auto w-40" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    {loading ? 'Proses...' : 'Daftar'}
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                .form-label {
                    @apply block text-sm font-semibold text-primary-900 mb-1.5;
                }
                .form-select {
                    @apply block w-full rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 sm:text-sm appearance-none;
                    /* Custom arrow could be added here if needed, but standard appearance-none + bg-image is better done via utility or plugin */
                }
                .form-error {
                    @apply mt-1 text-xs text-red-500 font-medium ml-1;
                }
            `}</style>
        </div>
    );
}

function FormInput({ label, register, name, error, className = "", required = false, ...props }: any) {
    return (
        <div className={className}>
            <label className="form-label">{label} {required && <span className="text-red-500">*</span>}</label>
            <input
                {...register(name)}
                {...props}
                className={`block w-full rounded-lg border-gray-300 bg-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 px-3 sm:text-sm transition-all text-gray-900 placeholder-gray-400 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'hover:border-gray-400'}`}
            />
            {error && <p className="form-error">{error.message}</p>}
        </div>
    );
}
