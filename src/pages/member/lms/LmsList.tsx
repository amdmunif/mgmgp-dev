import { MonitorPlay, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useNavigate } from 'react-router-dom';

export function LmsList() {
    const navigate = useNavigate();

    // Mock enrolled classes
    const enrolledClasses = [
        {
            id: 'evt-ai-1',
            title: 'Kelas Kecerdasan Artifisial Wonosobo – 28 Februari 2026',
            progress: 36,
            total: 36,
            image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800'
        },
        {
            id: 'evt-media-2',
            title: 'Workshop Media Pembelajaran Interaktif',
            progress: 5,
            total: 20,
            image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800'
        }
    ];

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MonitorPlay className="w-6 h-6 text-primary-600" />
                    LMS (Kelas Saya)
                </h1>
                <p className="text-gray-500 mt-1">Lanjutkan proses belajar dan kerjakan tugas dari kegiatan yang Anda ikuti.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledClasses.map(cls => {
                    const percent = Math.round((cls.progress / cls.total) * 100);
                    return (
                        <div key={cls.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                            <div className="h-40 overflow-hidden relative">
                                <img src={cls.image} alt={cls.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                {percent === 100 && (
                                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                                        SELESAI
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-gray-900 mb-4 line-clamp-2 leading-snug flex-1">{cls.title}</h3>
                                
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
                                    <p className="text-[10px] text-gray-400 text-right">{cls.progress} dari {cls.total} materi</p>
                                </div>

                                <Button 
                                    className="w-full" 
                                    onClick={() => navigate(`/member/lms/classroom/${cls.id}`)}
                                >
                                    Masuk Kelas <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
