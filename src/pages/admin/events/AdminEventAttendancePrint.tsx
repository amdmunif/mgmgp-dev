import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentManagementService } from '../../../services/contentManagementService';
import { settingsService } from '../../../services/settingsService';
import { Clock } from 'lucide-react';

interface Participant {
    user_id: string;
    nama: string;
    email: string;
    asal_sekolah: string | null;
    is_hadir: number;
}

export function AdminEventAttendancePrint() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<any>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        if (id) {
            Promise.all([
                contentManagementService.getEventById(id),
                contentManagementService.getEventParticipants(id),
                settingsService.getSettings()
            ]).then(([eventData, participantsData, settingsData]) => {
                setEvent(eventData);
                setParticipants(participantsData);
                setSettings(settingsData);
                
                // Allow time for rendering then print
                setTimeout(() => window.print(), 1000);
            }).catch(err => {
                console.error(err);
                alert("Gagal memuat data event.");
            });
        }
    }, [id]);

    if (!event || !settings) return <div className="p-8 text-center">Memuat...</div>;

    return (
        <div className="bg-white min-h-screen text-black font-serif p-0 sm:p-8">
            <style>
                {`
                    @media print {
                        @page { margin: 15mm; size: A4 portrait; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                        .no-print { display: none !important; }
                        .print-only { display: block !important; }
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid #000 !important; padding: 8px 12px !important; }
                    }
                    th, td { border: 1px solid #000; padding: 10px; text-align: left; }
                    th { font-weight: bold; text-align: center; background-color: #f8f9fa !important; -webkit-print-color-adjust: exact; }
                `}
            </style>
            
            <div className="no-print mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-lg">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-900">Mode Cetak Presensi</h3>
                        <p className="text-xs text-blue-700">Halaman ini dioptimalkan untuk cetak PDF/Kertas A4.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
                    >
                        Kembali
                    </button>
                    <button 
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md transition-all"
                    >
                        Cetak Sekarang
                    </button>
                </div>
            </div>

            <div className="max-w-[210mm] mx-auto bg-white">
                {/* Kop Surat */}
                <div className="flex items-center border-b-4 border-double border-black pb-6 mb-8">
                    {settings.kop_surat ? (
                        <img 
                            src={settings.kop_surat} 
                            alt="Kop Surat" 
                            className="w-full h-auto object-contain"
                        />
                    ) : (
                        <>
                            {settings.app_logo && (
                                <img 
                                    src={settings.app_logo} 
                                    alt="Logo" 
                                    className="h-24 w-auto mr-6 object-contain"
                                />
                            )}
                            <div className="text-center flex-1">
                                <h1 className="text-xl font-bold uppercase mb-1">MUSYAWARAH GURU MATA PELAJARAN (MGMP)</h1>
                                <h2 className="text-2xl font-black uppercase mb-1">{settings.app_name || "MGMP INFORMATIKA"}</h2>
                                <p className="text-sm italic">{settings.address || "Kabupaten Wonosobo, Jawa Tengah"}</p>
                            </div>
                        </>
                    )}
                </div>

                <div className="text-center mb-8">
                    <h3 className="text-xl font-bold underline uppercase">DAFTAR HADIR KEGIATAN</h3>
                    <p className="text-lg font-bold mt-1 uppercase">{event.title}</p>
                </div>

                <div className="mb-8 text-sm">
                    <table className="border-none w-full mb-0">
                        <tbody className="border-none">
                            <tr className="border-none">
                                <td className="border-none py-1 w-40 font-bold">Hari, Tanggal</td>
                                <td className="border-none py-1">: {new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            </tr>
                            <tr className="border-none">
                                <td className="border-none py-1 font-bold">Waktu</td>
                                <td className="border-none py-1">: {event.time || "08.00 WIB - Selesai"}</td>
                            </tr>
                            <tr className="border-none">
                                <td className="border-none py-1 font-bold">Tempat</td>
                                <td className="border-none py-1">: {event.location}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <table className="w-full border-collapse text-sm mb-12">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="w-12 text-center py-3">No</th>
                            <th className="py-3 px-4">Nama Lengkap</th>
                            <th className="py-3 px-4">Asal Instansi / Sekolah</th>
                            <th className="w-56 text-center py-3" colSpan={2}>Tanda Tangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.length > 0 ? participants.map((p, index) => (
                            <tr key={p.user_id} className="h-14">
                                <td className="text-center font-mono">{index + 1}.</td>
                                <td className="px-4 font-bold">{p.nama}</td>
                                <td className="px-4">{p.asal_sekolah || "-"}</td>
                                <td className="w-28 text-left border-r-0 pl-2 align-top pt-2">
                                    {index % 2 === 0 ? <span className="text-[10px] text-gray-400 font-mono">{index + 1}. .........</span> : ""}
                                </td>
                                <td className="w-28 text-left border-l-0 pl-2 align-top pt-2">
                                    {index % 2 !== 0 ? <span className="text-[10px] text-gray-400 font-mono">{index + 1}. .........</span> : ""}
                                </td>
                            </tr>
                        )) : (
                            [...Array(15)].map((_, i) => (
                                <tr key={i} className="h-14">
                                    <td className="text-center font-mono">{i + 1}.</td>
                                    <td></td>
                                    <td></td>
                                    <td className="w-28 text-left border-r-0 pl-2 align-top pt-2">
                                        {i % 2 === 0 ? <span className="text-[10px] text-gray-400 font-mono">{i + 1}. .........</span> : ""}
                                    </td>
                                    <td className="w-28 text-left border-l-0 pl-2 align-top pt-2">
                                        {i % 2 !== 0 ? <span className="text-[10px] text-gray-400 font-mono">{i + 1}. .........</span> : ""}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="flex justify-end pr-8 text-sm mt-16">
                    <div className="text-center w-64">
                        <p className="mb-1">Wonosobo, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="mb-20 font-bold uppercase">Ketua MGMP,</p>
                        <p className="font-bold underline text-lg">{settings.ketua_nama || "NAMA KETUA MGMP"}</p>
                        {settings.ketua_nip && <p className="font-mono">NIP. {settings.ketua_nip}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
