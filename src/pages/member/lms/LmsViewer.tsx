import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, PlayCircle, FileText, CheckCircle, ArrowLeft, Menu, X, CheckSquare, Trophy, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';
import { lmsService } from '../../../services/lmsService';
import { contentManagementService } from '../../../services/contentManagementService';

// Mock Data Types
interface LmsMaterial {
    id: string;
    title: string;
    type: 'video' | 'pdf' | 'text' | 'link' | 'quiz' | 'assignment';
    duration: string;
    is_completed: boolean;
    url?: string;
    content?: string;
}

interface LmsTopic {
    id: string;
    title: string;
    items: LmsMaterial[];
}

export function LmsViewer() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
    const [activeMaterial, setActiveMaterial] = useState<string>('');
    const [topics, setTopics] = useState<LmsTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [eventTitle, setEventTitle] = useState('Kelas LMS');
    const [quizData, setQuizData] = useState<any>(null);

    useEffect(() => {
        if (eventId) {
            loadData(eventId);
        }
    }, [eventId]);

    const loadData = async (eId: string) => {
        try {
            setLoading(true);
            
            try {
                const ev = await contentManagementService.getEventById(eId);
                if (ev && ev.title) setEventTitle(ev.title);
            } catch (e) {
                console.error('Failed to load event title', e);
            }

            const fetchedTopics = await lmsService.getTopicsByEvent(eId);
            
            const fullTopics: LmsTopic[] = [];
            for (const topic of fetchedTopics) {
                const materials = await lmsService.getMaterialsByTopic(topic.id);
                fullTopics.push({
                    id: topic.id,
                    title: topic.title,
                    items: materials.map(m => ({
                        id: m.id,
                        title: m.title,
                        type: m.type as any,
                        url: m.url,
                        content: m.content,
                        duration: m.duration ? `${m.duration} Menit` : '',
                        is_completed: false // default for now, until backend progress tracking is built
                    }))
                });
            }

            setTopics(fullTopics);
            
            if (fullTopics.length > 0) {
                setExpandedTopics([fullTopics[0].id]);
                if (fullTopics[0].items.length > 0) {
                    setActiveMaterial(fullTopics[0].items[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to load LMS data', error);
            toast.error("Gagal memuat materi LMS");
        } finally {
            setLoading(false);
        }
    };

    const toggleTopic = (id: string) => {
        setExpandedTopics(prev => 
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const getIcon = (type: string, isCompleted: boolean) => {
        if (isCompleted) return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
        switch (type) {
            case 'video': return <PlayCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />;
            case 'pdf': return <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />;
            case 'quiz': return <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />;
            case 'text': return <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />;
            case 'assignment': return <CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0" />;
            default: return <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />;
        }
    };

    // Calculate progress
    const totalItems = topics.reduce((acc, topic) => acc + topic.items.length, 0) || 1; // prevent div by zero
    const completedItems = topics.reduce((acc, topic) => acc + topic.items.filter(i => i.is_completed).length, 0);
    const progressPercent = Math.round((completedItems / totalItems) * 100);

    const activeItem = topics.flatMap(t => t.items).find(i => i.id === activeMaterial);

    useEffect(() => {
        if (activeItem?.type === 'quiz' && activeItem.id) {
            const fetchQuizData = async () => {
                try {
                    const data = await lmsService.getQuizByMaterialId(activeItem.id);
                    setQuizData(data);
                } catch (error) {
                    console.error('Failed to load quiz data', error);
                }
            };
            fetchQuizData();
        } else {
            setQuizData(null);
        }
    }, [activeItem?.id, activeItem?.type]);

    const handleMarkComplete = () => {
        setTopics(prevTopics => prevTopics.map(topic => ({
            ...topic,
            items: topic.items.map(item => 
                item.id === activeMaterial ? { ...item, is_completed: true } : item
            )
        })));
        toast.success("Berhasil menandai materi sebagai selesai!");
    };

    const getNavigation = () => {
        let allItems: LmsMaterial[] = [];
        topics.forEach(t => {
            if (t.items) allItems.push(...t.items);
        });
        const currentIndex = allItems.findIndex(i => i.id === activeMaterial);
        
        return {
            prev: currentIndex > 0 ? allItems[currentIndex - 1] : null,
            next: currentIndex > -1 && currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null
        };
    };

    const renderMainContent = () => {
        const { prev, next } = getNavigation();

        return (
            <div className="w-full h-full flex flex-col">
                {/* Header for content */}
                <div className="bg-primary-900 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-1 hover:bg-white/10 rounded">
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="font-medium text-lg hidden md:block line-clamp-1">{eventTitle}</h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="hidden md:flex flex-col items-end">
                            <span>Kemajuan Anda: <strong>{completedItems}</strong> dari <strong>{totalItems}</strong> ({progressPercent}%)</span>
                            <div className="w-48 h-2 bg-primary-950 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-green-400 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                            </div>
                        </div>
                        {progressPercent === 100 && (
                            <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold hidden md:flex items-center">
                                <Trophy className="w-4 h-4 mr-2" /> Unduh Sertifikat
                            </Button>
                        )}
                        <button onClick={() => navigate('/member/lms')} className="p-1 hover:bg-white/10 rounded ml-2">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-gray-50 p-6 md:p-10 overflow-y-auto relative flex flex-col">
                    {activeItem?.type === 'quiz' ? (
                        <div className="w-full mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-8 border-b border-gray-100">
                                <p className="text-gray-500 text-sm mb-2">Kuis</p>
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">{activeItem.title}</h2>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b border-gray-100">
                                    <div>
                                        <p className="text-sm text-gray-500">Pertanyaan</p>
                                        <p className="font-semibold text-gray-900">{quizData?.questions?.length || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Waktu Kuis</p>
                                        <p className="font-semibold text-gray-900">{quizData?.duration_minutes || 0} Menit</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Jumlah Nilai</p>
                                        <p className="font-semibold text-gray-900">{quizData?.questions?.reduce((acc: number, q: any) => acc + (q.points || 1), 0) || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Nilai Kelulusan</p>
                                        <p className="font-semibold text-gray-900">{quizData?.passing_score || 0}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-8 bg-gray-50">
                                <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-600 font-medium">
                                            <tr>
                                                <th className="py-3 px-4 whitespace-nowrap">Tanggal</th>
                                                <th className="py-3 px-4 whitespace-nowrap">Pertanyaan</th>
                                                <th className="py-3 px-4 whitespace-nowrap">Jumlah Nilai</th>
                                                <th className="py-3 px-4 whitespace-nowrap">Jawaban Benar</th>
                                                <th className="py-3 px-4 whitespace-nowrap">Jawaban Salah</th>
                                                <th className="py-3 px-4 whitespace-nowrap">Nilai Diperoleh</th>
                                                <th className="py-3 px-4 whitespace-nowrap">Hasil</th>
                                                <th className="py-3 px-4 whitespace-nowrap">Rincian</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            <tr>
                                                <td className="py-4 px-4 text-gray-900 whitespace-nowrap">Belum Dikerjakan</td>
                                                <td className="py-4 px-4 text-gray-600">-</td>
                                                <td className="py-4 px-4 text-gray-600">-</td>
                                                <td className="py-4 px-4 text-gray-600">-</td>
                                                <td className="py-4 px-4 text-gray-600">-</td>
                                                <td className="py-4 px-4 text-gray-900 font-medium whitespace-nowrap">-</td>
                                                <td className="py-4 px-4">
                                                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">Belum Mulai</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Button variant="outline" size="sm" className="h-8" disabled>Rincian</Button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="mt-8 flex justify-end">
                                    <Button 
                                        onClick={() => navigate(`/member/lms/classroom/${eventId}/quiz/${activeItem.id}`)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Mulai / Ulangi Ujian
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : activeItem?.type === 'assignment' ? (
                        <div className="w-full mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-8 border-b border-gray-100">
                                <p className="text-gray-500 text-sm mb-2">Penugasan</p>
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">{activeItem.title}</h2>
                                
                                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 py-4 border-t border-b border-gray-100 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Batas Waktu:</span>
                                        <span className="font-semibold text-gray-900">Sesuai jadwal pengajar</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Nilai Maksimal:</span>
                                        <span className="font-semibold text-gray-900">100.00</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Tipe Pengumpulan:</span>
                                        <span className="font-semibold text-gray-900">Unggah File</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-8 bg-white border-b border-gray-100">
                                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center text-gray-500">
                                    Belum ada tugas yang dikumpulkan.
                                </div>
                            </div>

                            <div className="p-8 bg-white">
                                <h3 className="font-bold text-gray-900 mb-4">Keterangan Tugas / Instruksi</h3>
                                <div 
                                    className="prose prose-sm prose-blue max-w-none text-gray-700"
                                    dangerouslySetInnerHTML={{ __html: activeItem.content || '<p>Tidak ada instruksi khusus untuk penugasan ini.</p>' }}
                                />
                                
                                <div className="mt-8 flex gap-3">
                                    <Button className="bg-blue-900 hover:bg-blue-800 text-white rounded-md">Unggah Jawaban (Segera Hadir)</Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full mx-auto flex flex-col flex-1 h-full">
                            <div className="mb-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm shrink-0">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{activeItem?.title}</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    Simak materi berikut ini dengan saksama.
                                </p>
                            </div>
                            <div className="w-full flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative flex flex-col min-h-[400px]">
                                {activeItem?.type === 'video' ? (
                                    <div className="w-full h-full bg-black relative flex-1 min-h-[400px]">
                                        {activeItem.url?.includes('youtube.com') || activeItem.url?.includes('youtu.be') ? (
                                            <iframe
                                                className="absolute inset-0 w-full h-full"
                                                src={activeItem.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                                allowFullScreen
                                                title={activeItem.title}
                                            />
                                        ) : (
                                            <video 
                                                className="absolute inset-0 w-full h-full object-contain"
                                                controls 
                                                src={activeItem.url} 
                                            />
                                        )}
                                    </div>
                                ) : activeItem?.type === 'pdf' || activeItem?.type === 'link' ? (
                                    <iframe 
                                        src={activeItem.url} 
                                        className="w-full h-full flex-1 min-h-[600px] bg-gray-50 border-0"
                                        title={activeItem.title}
                                        allowFullScreen
                                    />
                                ) : activeItem?.type === 'text' ? (
                                    <div className="p-8 md:p-12 prose prose-blue max-w-none w-full overflow-y-auto" dangerouslySetInnerHTML={{ __html: activeItem.content || '' }} />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 min-h-[400px]">
                                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                                        <p>Konten tidak tersedia</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Navigation & Complete Button Footer */}
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <Button 
                                    variant="outline" 
                                    disabled={!prev} 
                                    onClick={() => prev && setActiveMaterial(prev.id)}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Sebelumnya
                                </Button>
                                
                                <div className="flex-1 flex justify-center">
                                    {!activeItem?.is_completed ? (
                                        <Button onClick={handleMarkComplete} className="bg-green-600 hover:bg-green-700 h-10">
                                            <CheckCircle className="w-4 h-4 mr-2" /> Tandai Selesai
                                        </Button>
                                    ) : (
                                        <span className="px-4 py-2 bg-green-50 text-green-700 font-medium rounded-lg flex items-center gap-2 border border-green-200 h-10">
                                            <CheckCircle className="w-5 h-5" /> Selesai Ditonton
                                        </span>
                                    )}
                                </div>
                                
                                <Button 
                                    variant="outline" 
                                    disabled={!next} 
                                    onClick={() => next && setActiveMaterial(next.id)}
                                >
                                    Selanjutnya <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen w-full flex bg-white font-sans overflow-hidden">
            {/* Sidebar */}
            <div className={cn(
                "h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 absolute md:relative z-20",
                sidebarOpen ? "w-80 translate-x-0" : "w-80 -translate-x-full md:w-0 md:border-none"
            )}>
                {/* Brand / Top Area */}
                <div className="h-16 border-b border-gray-100 flex items-center px-4 bg-white sticky top-0 z-10 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/member/lms')} className="text-gray-600 hover:text-gray-900 -ml-2">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                    </Button>
                </div>

                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Konten Kelas</h2>
                </div>

                {/* Topics Accordion */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
                    ) : topics.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">Belum ada materi di kelas ini</div>
                    ) : (
                        <>
                            {/* Mobile Progress Bar (Shown only on small screens) */}
                            <div className="md:hidden p-4 border-b border-gray-100 bg-blue-50/50">
                                <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
                                    <span>Kemajuan Belajar</span>
                                    <span>{progressPercent}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                </div>
                                {progressPercent === 100 && (
                                    <Button size="sm" className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold">
                                        <Trophy className="w-4 h-4 mr-2" /> Unduh Sertifikat
                                    </Button>
                                )}
                            </div>

                            {topics.map((topic) => {
                        const isExpanded = expandedTopics.includes(topic.id);
                        const completedCount = topic.items.filter(i => i.is_completed).length;
                        
                        return (
                            <div key={topic.id} className="border-b border-gray-100 last:border-0">
                                <button
                                    onClick={() => toggleTopic(topic.id)}
                                    className="w-full text-left px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-medium text-gray-800 text-sm pr-4 leading-snug">{topic.title}</span>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                                        <span>{completedCount}/{topic.items.length}</span>
                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </div>
                                </button>
                                
                                {isExpanded && (
                                    <div className="bg-gray-50/30">
                                        {topic.items.map(item => {
                                            const isActive = activeMaterial === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setActiveMaterial(item.id)}
                                                    className={cn(
                                                        "w-full text-left px-4 py-3 pl-8 flex items-start gap-3 transition-colors group",
                                                        isActive ? "bg-blue-50/50" : "hover:bg-gray-50"
                                                    )}
                                                >
                                                    <div className="mt-0.5">{getIcon(item.type, item.is_completed)}</div>
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <span className={cn(
                                                            "text-sm block truncate",
                                                            isActive ? "text-blue-700 font-medium" : "text-gray-600 group-hover:text-gray-900"
                                                        )}>
                                                            {item.title}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-medium text-gray-400 mt-0.5">{item.duration}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 h-full relative">
                {renderMainContent()}
            </div>
            
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 z-10 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
