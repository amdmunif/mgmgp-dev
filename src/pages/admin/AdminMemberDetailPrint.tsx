import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Crown, QrCode } from 'lucide-react';
import type { Profile } from '../../services/memberService';
import { getFileUrl } from '../../lib/api';

export function AdminMemberDetailPrint() {
    const location = useLocation();
    const navigate = useNavigate();
    const member = location.state?.member as Profile | undefined;

    useEffect(() => {
        if (!member) {
            alert("Data member tidak ditemukan");
            navigate('/admin/members');
            return;
        }
        
        // Print and then go back
        setTimeout(() => {
            window.print();
        }, 800);

    }, [member, navigate]);

    if (!member) return null;

    const isPremium = member.premium_until && new Date(member.premium_until) > new Date();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
            
            {/* Kartu Bagian Depan */}
            <div className="w-[85.6mm] h-[54mm] bg-white rounded-lg shadow-xl overflow-hidden relative border border-gray-200 print:shadow-none print:border-none flex flex-col mb-8">
                
                {/* Header Kartu */}
                <div className="bg-blue-900 text-white p-3 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-2">
                        <img src="/mgmp-logo.png" alt="Logo" className="w-8 h-8 object-contain bg-white rounded-full p-0.5" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <div>
                            <h2 className="text-[10px] font-bold leading-tight">MGMP INFORMATIKA</h2>
                            <p className="text-[8px] opacity-90 leading-tight">KABUPATEN WONOSOBO</p>
                        </div>
                    </div>
                </div>

                {/* Badan Kartu */}
                <div className="flex-1 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 to-transparent"></div>
                    
                    <div className="flex p-3 gap-3 relative z-10 h-full items-center">
                        {/* Foto Profil */}
                        <div className="w-16 h-20 bg-gray-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                            {member.foto_profile ? (
                                <img src={getFileUrl(member.foto_profile)} alt="Foto" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-200">
                                    <span className="text-[10px] font-bold">FOTO</span>
                                </div>
                            )}
                        </div>

                        {/* Data Anggota */}
                        <div className="flex-1 flex flex-col justify-center">
                            <h3 className="text-sm font-black text-blue-900 uppercase leading-tight mb-1">{member.nama}</h3>
                            
                            <div className="space-y-1">
                                <div>
                                    <p className="text-[7px] text-gray-500 font-bold uppercase">Asal Instansi</p>
                                    <p className="text-[9px] font-semibold text-gray-800 leading-tight">{member.asal_sekolah || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[7px] text-gray-500 font-bold uppercase">Nomor ID / Email</p>
                                    <p className="text-[9px] font-semibold text-gray-800 leading-tight">{member.email}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* QR / Barcode space */}
                        <div className="absolute bottom-2 right-2 opacity-20">
                            <QrCode className="w-10 h-10 text-blue-900" />
                        </div>
                    </div>
                </div>

                {/* Footer Kartu */}
                <div className="bg-blue-50 border-t border-blue-100 p-1.5 px-3 flex justify-between items-center text-[8px] font-bold">
                    <span className="text-blue-900">KARTU TANDA ANGGOTA</span>
                    {isPremium ? (
                        <span className="text-amber-600 flex items-center gap-0.5"><Crown className="w-2 h-2" /> PREMIUM</span>
                    ) : (
                        <span className="text-gray-600">REGULER</span>
                    )}
                </div>
            </div>

            {/* Tombol Kembali (Non-Printable) */}
            <div className="mt-4 text-center print:hidden">
                <button 
                    onClick={() => navigate(-1)} 
                    className="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors shadow-sm"
                >
                    Kembali ke Daftar Anggota
                </button>
            </div>
        </div>
    );
}
