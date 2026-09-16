import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, QrCode, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface MeetingDetail {
    id: string;
    title: string;
    date: string;
    location?: string;
    description?: string;
    attendances: any[];
    all_pengurus: any[];
}

export const AdminBoardMeetingDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchMeeting();
    }, [id]);

    const fetchMeeting = async () => {
        try {
            const data = await api.get<MeetingDetail>(`/board-meetings/${id}`);
            setMeeting(data);
        } catch (error: any) {
            toast.error(error.message || 'Gagal memuat detail pertemuan');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAttendance = async (userId: string, isAttended: boolean) => {
        setIsUpdating(userId);
        try {
            if (isAttended) {
                await api.put(`/board-meetings/${id}/attend`, {
                    user_id: userId,
                    status: 'absent'
                });
            } else {
                await api.put(`/board-meetings/${id}/attend`, {
                    user_id: userId,
                    method: 'manual'
                });
            }
            toast.success('Status kehadiran diperbarui');
            fetchMeeting(); // Refresh data
        } catch (error: any) {
            toast.error(error.message || 'Gagal mengubah kehadiran');
        } finally {
            setIsUpdating(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!meeting) {
        return <div className="text-center p-8">Pertemuan tidak ditemukan</div>;
    }

    const attendancesUrl = `${window.location.origin}/member/board-meetings/attend/${meeting.id}`;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/admin/board-meetings">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{meeting.title}</h1>
                    <p className="text-slate-500">
                        {format(new Date(meeting.date), 'dd MMMM yyyy, HH:mm', { locale: localeId })}
                        {meeting.location && ` • ${meeting.location}`}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* QR Code Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center space-y-4">
                        <h2 className="font-semibold text-slate-800 flex items-center justify-center gap-2">
                            <QrCode className="w-5 h-5" />
                            Scan untuk Kehadiran
                        </h2>
                        <div className="bg-slate-50 p-4 rounded-xl flex justify-center inline-block mx-auto border border-slate-100">
                            <QRCodeSVG
                                value={attendancesUrl}
                                size={200}
                                level="H"
                                includeMargin={true}
                                className="rounded-lg shadow-sm"
                            />
                        </div>
                        <p className="text-sm text-slate-500">
                            Minta pengurus untuk menscan QR code ini menggunakan kamera HP atau aplikasi scanner untuk mencatat kehadiran secara otomatis.
                        </p>
                        <div className="pt-4 border-t">
                            <a href={attendancesUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                                Buka Link Kehadiran
                            </a>
                        </div>
                    </div>
                </div>

                {/* Attendance List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h2 className="font-semibold text-slate-800">Daftar Kehadiran Pengurus</h2>
                            <div className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                {meeting.attendances.length} Hadir dari {meeting.all_pengurus.length} Pengurus
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {meeting.all_pengurus.map(pengurus => {
                                const attendanceRecord = meeting.attendances.find(a => a.user_id === pengurus.id);
                                const isAttended = !!attendanceRecord;

                                return (
                                    <div key={pengurus.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex flex-shrink-0 items-center justify-center font-bold text-slate-600">
                                                {pengurus.nama.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{pengurus.nama}</p>
                                                <p className="text-xs text-slate-500">{pengurus.role}</p>
                                                {isAttended && attendanceRecord.attendance_method === 'qr' && (
                                                    <span className="inline-block mt-1 text-[10px] uppercase font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Via QR</span>
                                                )}
                                                {isAttended && attendanceRecord.attendance_method === 'manual' && (
                                                    <span className="inline-block mt-1 text-[10px] uppercase font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Manual</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <Button
                                                variant={isAttended ? 'destructive' : 'outline'}
                                                size="sm"
                                                onClick={() => toggleAttendance(pengurus.id, isAttended)}
                                                disabled={isUpdating === pengurus.id}
                                                className="w-28 flex items-center justify-center"
                                            >
                                                {isUpdating === pengurus.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : isAttended ? (
                                                    <>
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Batal Hadir
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Tandai Hadir
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
