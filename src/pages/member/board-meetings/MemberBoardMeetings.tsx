import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Loader2, Clock } from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';
import type { BoardMeeting } from '../../../types';
import { format, isPast } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export const MemberBoardMeetings: React.FC = () => {
    const [meetings, setMeetings] = useState<BoardMeeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const data = await api.get<BoardMeeting[]>('/board-meetings');
            setMeetings(data);
        } catch (error: any) {
            toast.error(error.message || 'Gagal memuat jadwal pertemuan');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Agenda Pengurus</h1>
                <p className="text-slate-500">Jadwal pertemuan dan rapat khusus pengurus</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {meetings.length === 0 ? (
                    <div className="col-span-full p-12 bg-white rounded-xl shadow-sm border border-slate-200 text-center">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900 mb-1">Belum ada agenda</h3>
                        <p className="text-slate-500">Saat ini tidak ada jadwal pertemuan pengurus yang tersedia.</p>
                    </div>
                ) : (
                    meetings.map(meeting => {
                        const meetingDate = new Date(meeting.date);
                        const isPastMeeting = isPast(meetingDate);

                        return (
                            <div key={meeting.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all hover:shadow-md">
                                <div className="p-5 flex-grow space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-lg text-slate-900 line-clamp-2">{meeting.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Calendar className="w-4 h-4 flex-shrink-0" />
                                            <span>{format(meetingDate, 'dd MMMM yyyy, HH:mm', { locale: localeId })}</span>
                                        </div>
                                        {meeting.location && (
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{meeting.location}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {meeting.description && (
                                        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-3">
                                            {meeting.description}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <div className="text-sm">
                                        {isPastMeeting ? (
                                            <span className="flex items-center text-slate-500 font-medium">
                                                <Clock className="w-4 h-4 mr-1.5" />
                                                Selesai
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-blue-600 font-medium">
                                                <Clock className="w-4 h-4 mr-1.5" />
                                                Akan Datang
                                            </span>
                                        )}
                                    </div>
                                    {/* Untuk menandai kehadiran, pengurus akan scan QR code. Tombol manual bisa ditambahkan jika diizinkan */}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
