import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Crown, Mail, Phone, MapPin, Briefcase, GraduationCap, Clock } from 'lucide-react';
import type { Profile } from '../../services/memberService';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export function AdminMemberDetailPrint() {
    const location = useLocation();
    const navigate = useNavigate();
    const member = location.state?.member as Profile | undefined;

    useEffect(() => {
        if (!member) {
            alert("Data member tidak ditemukan");
            navigate('/admin/users');
            return;
        }
        
        // Print and then go back
        setTimeout(() => {
            window.print();
        }, 800);

        const handleAfterPrint = () => {
            // Optional: navigate back automatically after printing
            // navigate(-1);
        };
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, [member, navigate]);

    if (!member) return null;

    const isPremium = member.premium_until && new Date(member.premium_until) > new Date();

    return (
        <div className="p-8 max-w-4xl mx-auto bg-white min-h-screen text-gray-900 print:p-0">
            {/* Header / Kop */}
            <div className="border-b-4 border-blue-900 pb-6 mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-blue-900 tracking-tight">DATA DETAIL ANGGOTA</h1>
                    <p className="text-gray-500 font-medium mt-1">Musyawarah Guru Mata Pelajaran (MGMP) Informatika</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                    <p>Dicetak pada:</p>
                    <p className="font-semibold text-gray-800">{format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}</p>
                </div>
            </div>

            {/* Main Info */}
            <div className="flex gap-8 mb-8">
                {/* Photo Placeholder / Photo */}
                <div className="w-40 h-48 bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center shrink-0 rounded-xl overflow-hidden">
                    {member.foto_profile ? (
                        <img src={member.foto_profile} alt="Foto Profil" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center text-gray-400">
                            <span className="block text-4xl mb-2">📸</span>
                            <span className="text-xs font-medium">FOTO 3x4</span>
                        </div>
                    )}
                </div>

                {/* Primary Details */}
                <div className="flex-1 space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold uppercase">{member.nama}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex px-3 py-1 text-sm font-bold border-2 rounded-full ${
                                Number(member.is_active) === 1 ? 'border-green-600 text-green-700 bg-green-50' : 'border-yellow-600 text-yellow-700 bg-yellow-50'
                            }`}>
                                {Number(member.is_active) === 1 ? 'STATUS: AKTIF' : 'STATUS: PENDING'}
                            </span>
                            {isPremium ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-bold border-2 border-amber-500 text-amber-700 bg-amber-50 rounded-full">
                                    <Crown className="w-4 h-4" /> MEMBER PREMIUM
                                </span>
                            ) : (
                                <span className="inline-flex px-3 py-1 text-sm font-bold border-2 border-gray-300 text-gray-600 bg-gray-50 rounded-full">
                                    MEMBER REGULER
                                </span>
                            )}
                            <span className="inline-flex px-3 py-1 text-sm font-bold border-2 border-blue-200 text-blue-700 bg-blue-50 rounded-full">
                                ROLE: {member.role.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Email</p>
                                <p className="font-medium text-lg">{member.email}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">No. HP / WhatsApp</p>
                                <p className="font-medium text-lg">{member.no_hp || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Asal Sekolah</p>
                                <p className="font-medium text-lg">{member.asal_sekolah || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status Kepegawaian</p>
                                <p className="font-medium text-lg">{member.status_kepegawaian || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Details Sections */}
            <div className="grid grid-cols-2 gap-8">
                {/* Pendidikan & Kualifikasi */}
                <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50/50">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-3">
                        <GraduationCap className="w-5 h-5 text-blue-600" /> Profil Pendidikan
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Pendidikan Terakhir</p>
                            <p className="font-medium text-gray-900 mt-0.5">{member.pendidikan_terakhir || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Jurusan</p>
                            <p className="font-medium text-gray-900 mt-0.5">{member.jurusan || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Profil Mengajar */}
                <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50/50">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-3">
                        <Briefcase className="w-5 h-5 text-blue-600" /> Profil Mengajar
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Mata Pelajaran Ampu</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {(() => {
                                    try {
                                        const mapel = member.mapel ? (typeof member.mapel === 'string' ? JSON.parse(member.mapel) : member.mapel) : [];
                                        if (Array.isArray(mapel) && mapel.length > 0) {
                                            return mapel.map((m: string, i: number) => (
                                                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded">{m}</span>
                                            ));
                                        }
                                        return <span>-</span>;
                                    } catch (e) { return <span>-</span>; }
                                })()}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Kelas Ampu</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {(() => {
                                    try {
                                        const kelas = member.kelas ? (typeof member.kelas === 'string' ? JSON.parse(member.kelas) : member.kelas) : [];
                                        if (Array.isArray(kelas) && kelas.length > 0) {
                                            return kelas.map((k: string, i: number) => (
                                                <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded">{k}</span>
                                            ));
                                        }
                                        return <span>-</span>;
                                    } catch (e) { return <span>-</span>; }
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Informasi Tambahan */}
                <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50/50 col-span-2">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-3">
                        <Clock className="w-5 h-5 text-blue-600" /> Informasi Sistem
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Tanggal Registrasi</p>
                            <p className="font-medium text-gray-900 mt-0.5">
                                {member.created_at ? format(new Date(member.created_at), 'dd MMM yyyy') : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Jumlah Kehadiran Event</p>
                            <p className="font-medium text-gray-900 mt-0.5">{member.attendance_count || 0} Kali Hadir</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Ukuran Baju</p>
                            <p className="font-medium text-gray-900 mt-0.5">{member.ukuran_baju || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Masa Aktif Premium</p>
                            <p className="font-medium text-gray-900 mt-0.5">
                                {isPremium && member.premium_until ? format(new Date(member.premium_until), 'dd MMM yyyy') : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Footer */}
            <div className="mt-16 text-center text-gray-400 text-sm border-t border-gray-200 pt-6">
                Dokumen ini dicetak secara otomatis dari Sistem Informasi MGMP Informatika. Data bersifat rahasia dan digunakan untuk keperluan internal organisasi.
            </div>
            
            {/* Non-Printable Back Button */}
            <div className="mt-8 text-center print:hidden">
                <button 
                    onClick={() => navigate(-1)} 
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                    Kembali ke Daftar Anggota
                </button>
            </div>
        </div>
    );
}
