import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CreditCard, User as UserIcon } from 'lucide-react';
import { api, getFileUrl } from '../../lib/api';
import { settingsService } from '../../services/settingsService';
import type { AppSettings } from '../../services/settingsService';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

export function MemberCard() {
    const { setPageHeader } = useOutletContext<any>();
    const [profile, setProfile] = useState<any>(null);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setPageHeader({
            title: 'Kartu Anggota',
            description: 'Lihat dan cetak kartu anggota MGMP Anda.',
            icon: <CreditCard className="w-6 h-6 text-primary-600" />
        });
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [userRes, settingsRes] = await Promise.all([
                    api.get<any>('/auth/profile'),
                    settingsService.getSettings()
                ]);
                setProfile(userRes);
                setSettings(settingsRes);
            } catch (error) {
                toast.error('Gagal memuat data kartu anggota.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="p-10 text-center animate-pulse">Memuat kartu anggota...</div>;

    const wonosoboLogo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Lambang_Kabupaten_Wonosobo.png/371px-Lambang_Kabupaten_Wonosobo.png';
    const mainLogo = settings?.logo_url ? getFileUrl(settings.logo_url) : '/mgmp-logo.png';
    const contactAddress = settings?.address || settings?.contact_address || 'Jl. Raya Wonosobo, Jawa Tengah, Indonesia';

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">


            {/* Print Styles for hiding unnecessary elements */}
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-card, #printable-card * {
                        visibility: visible;
                    }
                    #printable-card {
                        position: absolute;
                        left: 50%;
                        top: 2cm;
                        transform: translateX(-50%);
                        box-shadow: none !important;
                    }
                }
                `}
            </style>

            <div className="flex justify-center">
                {/* ID CARD CONTAINER */}
                <div 
                    id="printable-card"
                    className="w-[8.6cm] h-[5.4cm] md:w-[17.2cm] md:h-[10.8cm] bg-white rounded-xl shadow-2xl relative overflow-hidden border border-gray-200 flex flex-col"
                >
                    {/* Header Kop */}
                    <div className="bg-blue-900 text-white p-2 md:p-4 flex items-center justify-between relative z-10">
                        {/* Left Logo */}
                        <div className="w-10 h-10 md:w-16 md:h-16 shrink-0 bg-white rounded-full p-1 flex items-center justify-center shadow-inner">
                            <img src={mainLogo} alt="Logo MGMP" className="w-full h-full object-contain" crossOrigin="anonymous" />
                        </div>
                        
                        {/* Text Center */}
                        <div className="text-center flex-1 px-2">
                            <h2 className="text-[10px] md:text-sm font-bold uppercase tracking-wide leading-tight">
                                MGMP Informatika SMP/MTS
                            </h2>
                            <h3 className="text-[11px] md:text-lg font-black uppercase tracking-wider text-white leading-tight drop-shadow-md">
                                Kabupaten Wonosobo
                            </h3>
                            <p className="text-[6px] md:text-[9px] mt-0.5 opacity-90 leading-tight max-w-[200px] md:max-w-[350px] mx-auto">
                                {contactAddress}
                            </p>
                        </div>
                        
                        {/* Right Logo (Wonosobo) */}
                        <div className="w-10 h-10 md:w-16 md:h-16 shrink-0 flex items-center justify-center">
                            <img src={wonosoboLogo} alt="Logo Wonosobo" className="w-full h-full object-contain drop-shadow-lg" crossOrigin="anonymous" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center py-1 md:py-1.5 bg-blue-50/90 border-b border-blue-100/50 backdrop-blur-sm z-10">
                        <h1 className="text-[11px] md:text-lg font-bold text-blue-900 tracking-[0.25em] uppercase">
                            KARTU ANGGOTA
                        </h1>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex p-2 md:p-5 gap-3 md:gap-8 relative z-10 items-center">
                        {/* Watermark in background */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0 overflow-hidden">
                            <img src={mainLogo} alt="watermark" className="w-[120%] h-[120%] object-contain grayscale" crossOrigin="anonymous" />
                        </div>

                        {/* Photo */}
                        <div className="z-10 w-16 h-20 md:w-28 md:h-36 shrink-0 border-2 md:border-4 border-white outline outline-1 outline-gray-200 rounded-md overflow-hidden bg-gray-100 shadow-md">
                            {profile?.foto_profile ? (
                                <img src={getFileUrl(profile.foto_profile)} alt="Foto Anggota" className="w-full h-full object-cover" crossOrigin="anonymous" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                    <UserIcon className="w-6 h-6 md:w-12 md:h-12 mb-1" />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="z-10 flex-1 flex flex-col justify-center space-y-1.5 md:space-y-3">
                            <div>
                                <p className="text-[7px] md:text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5 md:mb-1">Nama Lengkap</p>
                                <p className="text-[11px] md:text-lg font-bold text-gray-900 leading-none">
                                    {profile?.nama || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[7px] md:text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5 md:mb-1">Asal Sekolah</p>
                                <p className="text-[10px] md:text-base font-bold text-blue-900 leading-none">
                                    {profile?.asal_sekolah || '-'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-[7px] md:text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5 md:mb-1">No HP</p>
                                    <p className="text-[9px] md:text-sm font-semibold text-gray-800">
                                        {profile?.no_hp || '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[7px] md:text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5 md:mb-1">Status</p>
                                    <p className="text-[9px] md:text-sm font-semibold text-gray-800">
                                        {profile?.status_kepegawaian || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="h-1.5 md:h-3 bg-blue-900 z-10 w-full mt-auto"></div>
                </div>
            </div>
            
            <div className="text-center mt-6 text-sm text-gray-500 max-w-xl mx-auto print:hidden bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="font-medium text-gray-700 mb-1">Kartu Anggota Elektronik</p>
                <p>Ini adalah pratinjau desain kartu anggota resmi Anda. Pencetakan fisik hanya dapat dilakukan oleh Admin.</p>
            </div>
        </div>
    );
}
