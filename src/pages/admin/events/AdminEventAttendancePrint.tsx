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
                        @page { margin: 8mm 10mm; size: A4 portrait; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                        .no-print { display: none !important; }
                        table { border-collapse: collapse; width: 100%; font-size: 11px; }
                        th, td { border: 1px solid #000 !important; padding: 4px 6px !important; }
                        tr.signature-row { height: 40px; vertical-align: bottom; }
                    }
                    th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 12px; }
                    th { font-weight: bold; text-align: center; background-color: #f8f9fa !important; }
                    tr.signature-row td { vertical-align: bottom; height: 44px; }
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

                <div className="mb-4 text-sm">
                    <table className="border-none w-full mb-0" style={{borderCollapse:'separate', borderSpacing:0}}>
                        <tbody className="border-none">
                            <tr className="border-none">
                                <td className="border-none py-0.5 w-36 font-bold text-xs">Hari, Tanggal</td>
                                <td className="border-none py-0.5 text-xs">: {new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            </tr>
                            <tr className="border-none">
                                <td className="border-none py-0.5 font-bold text-xs">Waktu</td>
                                <td className="border-none py-0.5 text-xs">: {event.time || "08.00 WIB - Selesai"}</td>
                            </tr>
                            <tr className="border-none">
                                <td className="border-none py-0.5 font-bold text-xs">Tempat</td>
                                <td className="border-none py-0.5 text-xs">: {event.location}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <table className="w-full border-collapse text-xs mb-6">
                    <thead>
                        <tr>
                            <th className="w-8 text-center py-2">No</th>
                            <th className="py-2 px-3">Nama Lengkap</th>
                            <th className="py-2 px-3">Asal Instansi / Sekolah</th>
                            <th className="w-48 text-center py-2" colSpan={2}>Tanda Tangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...participants].sort((a, b) => (a.nama || '').localeCompare(b.nama || '', 'id')).length > 0
                            ? [...participants].sort((a, b) => (a.nama || '').localeCompare(b.nama || '', 'id')).map((p, index) => (
                            <tr key={p.user_id} className="signature-row">
                                <td className="text-center">{index + 1}.</td>
                                <td className="px-3 font-semibold">{p.nama}</td>
                                <td className="px-3">{p.asal_sekolah || "-"}</td>
                                <td className="w-24 border-r-0" style={{verticalAlign:'bottom', paddingBottom:'4px'}}>
                                    <span className="text-[9px] text-gray-400">{index % 2 === 0 ? `${index + 1}.` : ""}</span>
                                </td>
                                <td className="w-24 border-l-0" style={{verticalAlign:'bottom', paddingBottom:'4px'}}>
                                    <span className="text-[9px] text-gray-400">{index % 2 !== 0 ? `${index + 1}.` : ""}</span>
                                </td>
                            </tr>
                        ))
                            : [...Array(20)].map((_, i) => (
                                <tr key={i} className="signature-row">
                                    <td className="text-center">{i + 1}.</td>
                                    <td></td>
                                    <td></td>
                                    <td className="w-24 border-r-0" style={{verticalAlign:'bottom', paddingBottom:'4px'}}>
                                        <span className="text-[9px] text-gray-400">{i % 2 === 0 ? `${i + 1}.` : ""}</span>
                                    </td>
                                    <td className="w-24 border-l-0" style={{verticalAlign:'bottom', paddingBottom:'4px'}}>
                                        <span className="text-[9px] text-gray-400">{i % 2 !== 0 ? `${i + 1}.` : ""}</span>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>

                <div className="flex justify-end pr-4 text-xs mt-8">
                    <div className="text-center w-56">
                        <p className="mb-0.5">Wonosobo, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="mb-16 font-bold uppercase">Ketua MGMP,</p>
                        <p className="font-bold underline">{settings.ketua_nama || "NAMA KETUA MGMP"}</p>
                        {settings.ketua_nip && <p className="font-mono text-[10px]">NIP. {settings.ketua_nip}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
