import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentManagementService } from '../../../services/contentManagementService';
import { settingsService } from '../../../services/settingsService';

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

    if (!event || !settings) return <div className="p-8">Memuat Data...</div>;

    const attendedParticipants = participants;

    return (
        <div className="bg-white min-h-screen text-black font-serif p-8">
            <style>
                {`
                    @media print {
                        @page { margin: 20mm; size: A4 portrait; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                    th, td { border: 1px solid #000; padding: 10px; text-align: left; }
                    th { font-weight: bold; text-align: center; }
                `}
            </style>
            
            <div className="no-print mb-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded mr-2"
                >
                    Kembali
                </button>
                <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                    Cetak Ulang
                </button>
            </div>

            <div className="flex items-center border-b-4 border-double border-black pb-4 mb-6">
                {(settings.kop_surat || settings.app_logo) && (
                    <img 
                        src={settings.kop_surat || settings.app_logo} 
                        alt="Logo" 
                        className="h-24 w-auto mr-4 object-contain"
                    />
                )}
                <div className="text-center flex-1 pr-12">
                    <h1 className="text-2xl font-bold uppercase mb-1">DAFTAR HADIR PESERTA</h1>
                    <h2 className="text-xl font-bold uppercase">{event.title}</h2>
                </div>
            </div>

            <div className="mb-6 text-sm">
                <table className="border-none w-auto">
                    <tbody>
                        <tr>
                            <td className="border-none py-1 w-32">Hari, Tanggal</td>
                            <td className="border-none py-1">: {new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        </tr>
                        <tr>
                            <td className="border-none py-1">Tempat</td>
                            <td className="border-none py-1">: {event.location}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <table className="w-full border-collapse text-sm mb-12">
                <thead>
                    <tr>
                        <th className="w-12 text-center">No</th>
                        <th className="w-64">Nama Lengkap</th>
                        <th>Asal Sekolah</th>
                        <th className="w-48 text-center" colSpan={2}>Tanda Tangan</th>
                    </tr>
                </thead>
                <tbody>
                    {attendedParticipants.map((p, index) => (
                        <tr key={p.user_id}>
                            <td className="text-center">{index + 1}</td>
                            <td>{p.nama}</td>
                            <td>{p.asal_sekolah || "-"}</td>
                            <td className="w-24 text-left border-r-0 h-12">
                                {index % 2 === 0 ? `${index + 1}.` : ""}
                            </td>
                            <td className="w-24 text-left border-l-0 h-12 align-top pt-2">
                                {index % 2 !== 0 ? `${index + 1}.` : ""}
                            </td>
                        </tr>
                    ))}
                    {/* Add few empty rows just in case */}
                    {[...Array(5)].map((_, i) => {
                        const index = attendedParticipants.length + i;
                        return (
                            <tr key={`empty-${i}`}>
                                <td className="text-center">{index + 1}</td>
                                <td></td>
                                <td></td>
                                <td className="w-24 text-left border-r-0 h-12">
                                    {index % 2 === 0 ? `${index + 1}.` : ""}
                                </td>
                                <td className="w-24 text-left border-l-0 h-12 align-top pt-2">
                                    {index % 2 !== 0 ? `${index + 1}.` : ""}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="flex justify-end pr-12 text-sm mt-8">
                <div className="text-center">
                    <p className="mb-20">Wonosobo, {new Date(event.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="font-bold underline">{settings.ketua_nama || "Ketua MGMP"}</p>
                    {settings.ketua_nip && <p>NIP. {settings.ketua_nip}</p>}
                </div>
            </div>
        </div>
    );
}
