import { useState, useEffect } from 'react';
import { MonitorPlay, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { contentManagementService } from '../../../services/contentManagementService';
import { getFileUrl } from '../../../lib/api';
import type { Event } from '../../../types';

export function LmsList() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Mengambil semua data acara, lalu memfilter yang memiliki fitur LMS
            const data = await contentManagementService.getEvents();
            setEvents(data.filter((e: any) => e.has_lms === 1 || e.has_lms === true));
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MonitorPlay className="w-6 h-6 text-primary-600" />
                    LMS (Kelas Saya)
                </h1>
                <p className="text-gray-500 mt-1">Lanjutkan proses belajar dan kerjakan tugas dari kegiatan yang menggunakan LMS.</p>
            </div>

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
                        // Dummy progress logic since we don't have the user's progress from API yet
                        const percent = 0; 
                        
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
                                        <p className="text-[10px] text-gray-400 text-right">0 materi terselesaikan</p>
                                    </div>

                                    <Button 
                                        className="w-full" 
                                        onClick={() => navigate(`/member/lms/classroom/${event.id}`)}
                                    >
                                        Masuk Kelas <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
