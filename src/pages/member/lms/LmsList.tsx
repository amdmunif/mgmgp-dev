import { useState, useEffect } from 'react';
import { MonitorPlay, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { lmsService } from '../../../services/lmsService';
import { eventService } from '../../../services/eventService';
import { getFileUrl } from '../../../lib/api';
import type { Event } from '../../../types';

export function LmsList() {
    const navigate = useNavigate();
    const { setPageHeader } = useOutletContext<any>();
    const [events, setEvents] = useState<Event[]>([]);
    const [progressData, setProgressData] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setPageHeader({
            title: "LMS (Kelas Saya)",
            subtitle: "Lanjutkan proses belajar dan kerjakan tugas dari kegiatan yang menggunakan LMS."
        });

        loadData();

        return () => setPageHeader(null);
    }, [setPageHeader]);

    const loadData = async () => {
        try {
            // Mengambil riwayat event user, lalu memfilter yang memiliki fitur LMS
            const history = await eventService.getMyHistory();
            const lmsEvents = history
                .filter(item => Number(item.events?.has_lms) === 1)
                .map(item => ({
                    id: item.event_id,
                    title: item.events?.title || '',
                    date: item.events?.date || '',
                    location: item.events?.location || '',
                    image_url: item.events?.image_url,
                    has_lms: 1,
                    is_approved: item.is_approved
                }));
            
            setEvents(lmsEvents as any);
            
            // Ambil progress riil
            try {
                const summary = await lmsService.getProgressSummary();
                setProgressData(summary);
            } catch (err) {
                console.error('Failed to load progress summary', err);
            }
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
            ) : events.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <MonitorPlay className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Belum Ada Kelas LMS</h3>
                    <p className="text-gray-500">Belum ada kegiatan/pelatihan yang menggunakan fitur LMS saat ini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => {
                        const percent: number = progressData[event.id] || 0; 
                        
                        return (
                            <div key={event.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                                <div className="h-40 overflow-hidden relative bg-gray-100">
                                    <img 
                                        src={event.image_url ? getFileUrl(event.image_url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&background=random&size=800`}
                                        alt={event.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                    />
                                    {percent === 100 && (
                                        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                                            SELESAI
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 mb-4 line-clamp-2 leading-snug flex-1">{event.title}</h3>
                                    
                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Progres Belajar</span>
                                            <span className="font-medium text-gray-700">{percent}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 text-right">Lanjutkan progres untuk mendapatkan sertifikat</p>
                                    </div>

                                    {Number((event as any).is_approved) === 1 ? (
                                        <Button 
                                            className="w-full" 
                                            onClick={() => navigate(`/member/lms/classroom/${event.id}`)}
                                        >
                                            Masuk Kelas <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    ) : (
                                        <Button 
                                            className="w-full bg-gray-200 text-gray-500 hover:bg-gray-200 cursor-not-allowed" 
                                            disabled
                                        >
                                            Menunggu Konfirmasi Admin
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
