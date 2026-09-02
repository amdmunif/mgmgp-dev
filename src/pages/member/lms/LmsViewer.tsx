import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, PlayCircle, FileText, CheckCircle, ArrowLeft, Menu, X, CheckSquare, Trophy, Loader2, BookOpen, LayoutDashboard, Lock } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';
import { lmsService } from '../../../services/lmsService';
import { contentManagementService } from '../../../services/contentManagementService';
import { eventService } from '../../../services/eventService';

// Mock Data Types
interface LmsMaterial {
    id: string;
    title: string;
    type: 'video' | 'pdf' | 'text' | 'link' | 'quiz' | 'assignment';
    duration: string;
    is_completed: boolean;
    url?: string;
    content?: string;
    available_at?: string | null;
    deadline_at?: string | null;
    is_locked?: boolean;
    lock_reason?: string;
}

interface LmsTopic {
    id: string;
    title: string;
    items: LmsMaterial[];
}

const getEmbedUrl = (url: string | undefined): string => {
    if (!url) return '';
    let embedUrl = url;
    
    // YouTube
    if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
        return embedUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/');
    }
    
    // Canva
    if (embedUrl.includes('canva.com/design') && !embedUrl.includes('embed')) {
        if (embedUrl.includes('/view')) {
            embedUrl = embedUrl.split('/view')[0] + '/view?embed';
        } else {
            embedUrl += '?embed';
        }
    }
    
    // Google Drive
    if (embedUrl.includes('drive.google.com/file/d/') && embedUrl.includes('/view')) {
        embedUrl = embedUrl.replace('/view', '/preview');
    }
    
    return embedUrl;
};

export function LmsViewer() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlMaterialId = searchParams.get('materialId');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
    const [activeMaterial, setActiveMaterial] = useState<string>('');
    const [topics, setTopics] = useState<LmsTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [eventTitle, setEventTitle] = useState('Kelas LMS');
    const [quizData, setQuizData] = useState<any>(null);
    const [assignmentData, setAssignmentData] = useState<any>(null);
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [submissionText, setSubmissionText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
    const [isPassed, setIsPassed] = useState(false);

    useEffect(() => {
        if (eventId) {
            loadData(eventId);
        }
    }, [eventId]);

    const loadData = async (eId: string) => {
        try {
            setLoading(true);
            
            // Parallelize independent top-level fetches
            const [evRes, partRes, fetchedTopicsRaw, progressRaw] = await Promise.allSettled([
                contentManagementService.getEventById(eId),
                eventService.getParticipation(eId),
                lmsService.getTopicsByEvent(eId),
                lmsService.getEventProgress(eId)
            ]);

            if (evRes.status === 'fulfilled' && evRes.value?.title) setEventTitle(evRes.value.title);
            if (partRes.status === 'fulfilled' && partRes.value && Number(partRes.value.is_passed) === 1) setIsPassed(true);

            const fetchedTopics = (fetchedTopicsRaw.status === 'fulfilled' && Array.isArray(fetchedTopicsRaw.value)) ? fetchedTopicsRaw.value : [];
            const progress = (progressRaw.status === 'fulfilled' && Array.isArray(progressRaw.value)) ? progressRaw.value : [];
            
            // Fetch all materials concurrently
            const materialsPromises = fetchedTopics.map(topic => 
                lmsService.getMaterialsByTopic(topic.id)
                  .then(mats => ({ topicId: topic.id, materials: Array.isArray(mats) ? mats : [] }))
                  .catch(() => ({ topicId: topic.id, materials: [] }))
            );

            const materialsResults = await Promise.all(materialsPromises);
            const materialsMap = new Map(materialsResults.map(m => [m.topicId, m.materials]));

            let waterfallLocked = false;
            
            const fullTopics: LmsTopic[] = fetchedTopics.map(topic => {
                const materials = materialsMap.get(topic.id) || [];
                return {
                    id: topic.id,
                    title: topic.title,
                    items: materials.map((m: any) => {
                        const isCompleted = progress.includes(m.id);
                        
                        let isLocked = false;
                        let lockReason = '';

                        // 1. Availability check (Waktu Tampil)
                        if (m.available_at) {
                            const availableDate = new Date(m.available_at);
                            if (new Date() < availableDate) {
                                isLocked = true;
                                lockReason = `Tersedia pada: ${availableDate.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`;
                            }
                        }

                        // 2. Waterfall check
                        if (!isLocked && waterfallLocked) {
                            isLocked = true;
                            lockReason = 'Selesaikan materi sebelumnya terlebih dahulu';
                        }

                        // Update waterfall status for NEXT items
                        // If this item is not completed and it is NOT a locked-by-time item (or even if it is),
                        // subsequent items should be locked by waterfall.
                        if (!isCompleted) {
                            waterfallLocked = true;
                        }

                        return {
                            id: m.id,
                            title: m.title,
                            type: m.type as any,
                            url: m.url,
                            content: m.content,
                            available_at: m.available_at,
                            deadline_at: m.deadline_at,
                            duration: m.duration ? `${m.duration} Menit` : '',
                            is_completed: isCompleted,
                            is_locked: isLocked,
                            lock_reason: lockReason
                        };
                    })
                };
            });

            setTopics(fullTopics);
            
            if (fullTopics.length > 0) {
                let activeTopicId = fullTopics[0].id;
                let initialMaterialId = '';

                if (urlMaterialId) {
                    for (const t of fullTopics) {
                        const found = t.items.find(i => i.id === urlMaterialId);
                        if (found) {
                            activeTopicId = t.id;
                            initialMaterialId = urlMaterialId;
                            break;
                        }
                    }
                }
                
                setExpandedTopics([activeTopicId]);
                setActiveMaterial(initialMaterialId);
                if (initialMaterialId) {
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

    const getIcon = (type: string, isCompleted: boolean, isLocked?: boolean) => {
        if (isLocked) return <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />;
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
        // Reset states when changing material
        setIsFormOpen(false);
        setSubmissionUrl('');
        setSubmissionText('');

        if (activeItem?.type === 'quiz' && activeItem.id) {
            const fetchQuizData = async () => {
                try {
                    const data = await lmsService.getQuizByMaterialId(activeItem.id);
                    setQuizData(data);
                    
                    const attempts = await lmsService.getQuizAttempts(activeItem.id);
                    setQuizAttempts(attempts || []);
                } catch (error) {
                    console.error('Failed to load quiz data', error);
                }
            };
            fetchQuizData();
        } else {
            setQuizData(null);
            setQuizAttempts([]);
        }

        if (activeItem?.type === 'assignment' && activeItem.id) {
            const fetchAssignmentData = async () => {
                try {
                    const data = await lmsService.getAssignmentSubmission(activeItem.id);
                    setAssignmentData(data);
                    if (data) {
                        setSubmissionUrl(data.content_url || '');
                        setSubmissionText(data.text_content || '');
                    } else {
                        setSubmissionUrl('');
                        setSubmissionText('');
                    }
                } catch (error) {
                    console.error('Failed to load assignment submission', error);
                }
            };
            fetchAssignmentData();
        } else {
            setAssignmentData(null);
            setSubmissionUrl('');
            setSubmissionText('');
        }
    }, [activeItem?.id, activeItem?.type]);

    const handleAssignmentSubmit = async () => {
        if (!activeItem?.id) return;
        try {
            setIsSubmitting(true);
            await lmsService.submitAssignment(activeItem.id, submissionUrl, submissionText);
            toast.success("Berhasil mengumpulkan jawaban!");
            const data = await lmsService.getAssignmentSubmission(activeItem.id);
            setAssignmentData(data);
        } catch (e) {
            toast.error("Gagal mengumpulkan tugas.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkComplete = async () => {
        if (!activeItem || !eventId) return;
        try {
            await lmsService.markProgress(eventId, activeItem.type, activeItem.id);
            setTopics(prevTopics => prevTopics.map(topic => ({
                ...topic,
                items: topic.items.map(item => 
                    item.id === activeMaterial ? { ...item, is_completed: true } : item
                )
            })));
            toast.success("Berhasil menandai materi sebagai selesai!");
        } catch (error) {
            toast.error("Gagal menyimpan progres");
        }
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
                        <button onClick={() => activeItem ? setActiveMaterial('') : navigate('/member/lms')} className="p-2 hover:bg-white/10 rounded mr-2" title={activeItem ? "Kembali ke Dashboard Kelas" : "Kembali ke Daftar Kelas"}>
                            <ArrowLeft className="w-5 h-5" />
                        </button>
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
                        {isPassed && (
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
                <div className={cn("flex-1 overflow-y-auto", !activeItem ? "bg-white" : "bg-gray-50 p-4 md:p-8")}>
                    {!activeItem ? (
                        <div className="w-full min-h-full flex flex-col p-6 md:p-10">
                            <div className="w-full max-w-7xl mx-auto flex flex-col flex-1">
                                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Selamat Datang di Kelas {eventTitle}!</h2>
                                        <p className="text-gray-500">Pilih materi pembelajaran di bawah ini untuk memulai.</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    {topics.map((topic, idx) => (
                                        <div key={topic.id} className="bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
                                            <div className="bg-gray-100/80 px-5 py-3 border-b border-gray-200">
                                                <h3 className="font-bold text-gray-800">Bagian {idx + 1}: {topic.title}</h3>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {topic.items.map((item, itemIdx) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            if (item.is_locked) {
                                                                toast.error(item.lock_reason || "Materi terkunci");
                                                                return;
                                                            }
                                                            setActiveMaterial(item.id);
                                                            if (!expandedTopics.includes(topic.id)) {
                                                                setExpandedTopics(prev => [...prev, topic.id]);
                                                            }
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-5 py-4 flex items-center justify-between transition-colors group",
                                                            item.is_locked ? "opacity-70 bg-gray-50 cursor-not-allowed" : "hover:bg-white cursor-pointer"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-full border flex items-center justify-center shadow-sm transition-colors",
                                                                item.is_locked ? "bg-gray-100 border-gray-200" : "bg-white border-gray-200 group-hover:border-blue-300 group-hover:text-blue-600"
                                                            )}>
                                                                {item.is_completed ? (
                                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                                ) : item.is_locked ? (
                                                                    <Lock className="w-4 h-4 text-gray-400" />
                                                                ) : (
                                                                    <span className="text-xs font-semibold text-gray-400 group-hover:text-blue-600">{itemIdx + 1}</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700 group-hover:text-blue-700">{item.title}</p>
                                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                                                    {item.type === 'video' && <PlayCircle className="w-3 h-3" />}
                                                                    {item.type === 'pdf' && <FileText className="w-3 h-3" />}
                                                                    {item.type === 'quiz' && <CheckSquare className="w-3 h-3" />}
                                                                    <span className="capitalize">{item.type}</span>
                                                                    {item.duration && (
                                                                        <>
                                                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                                            <span>{item.duration}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                {item.is_locked && (
                                                                    <p className="text-xs text-red-500 mt-1">{item.lock_reason}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                                    </button>
                                                ))}
                                                {topic.items.length === 0 && (
                                                    <div className="px-5 py-4 text-sm text-gray-500 text-center">Belum ada materi di bagian ini.</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {topics.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                            Belum ada materi yang tersedia.
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500 pb-4 shrink-0">
                                &copy; {new Date().getFullYear()} LMS MGMP. Hak Cipta Dilindungi.
                            </div>
                        </div>
                    ) : activeItem?.type === 'quiz' ? (
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
                                        <p className="font-semibold text-gray-900">{quizData?.questions?.reduce((acc: number, q: any) => acc + (Number(q.points) || 1), 0) || 0}</p>
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
                                            {quizAttempts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="py-8 px-4 text-center text-gray-500 whitespace-nowrap">Belum ada percobaan kuis.</td>
                                                </tr>
                                            ) : (
                                                quizAttempts.map((attempt) => (
                                                    <tr key={attempt.id}>
                                                        <td className="py-4 px-4 text-gray-900 whitespace-nowrap">
                                                            {new Date(attempt.started_at).toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="py-4 px-4 text-gray-600">{quizData?.questions?.length || 0}</td>
                                                        <td className="py-4 px-4 text-gray-600">{quizData?.questions?.reduce((acc: number, q: any) => acc + (Number(q.points) || 1), 0) || 0}</td>
                                                        <td className="py-4 px-4 text-gray-600">-</td>
                                                        <td className="py-4 px-4 text-gray-600">-</td>
                                                        <td className="py-4 px-4 text-gray-900 font-medium whitespace-nowrap">{attempt.total_score}</td>
                                                        <td className="py-4 px-4">
                                                            {attempt.is_passed ? (
                                                                <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold">Lulus</span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold">Tidak Lulus</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <Button variant="outline" size="sm" className="h-8" disabled>Rincian</Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="mt-8 flex justify-end items-center gap-4">
                                    {activeItem?.deadline_at && new Date(activeItem.deadline_at) < new Date() ? (
                                        <div className="text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                                            Batas Waktu Telah Lewat ({new Date(activeItem.deadline_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })})
                                        </div>
                                    ) : (
                                        <>
                                            {quizData?.max_attempts > 0 && (
                                                <p className="text-sm text-gray-500">
                                                    Sisa percobaan: <span className="font-bold text-gray-900">{Math.max(0, quizData.max_attempts - quizAttempts.length)}</span> dari {quizData.max_attempts}
                                                </p>
                                            )}
                                            <Button 
                                                onClick={() => navigate(`/member/lms/classroom/${eventId}/quiz/${activeItem.id}`)}
                                                disabled={quizData?.max_attempts > 0 && quizAttempts.length >= quizData.max_attempts}
                                                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
                                            >
                                                {quizData?.max_attempts > 0 && quizAttempts.length >= quizData.max_attempts 
                                                    ? "Jatah Ujian Habis" 
                                                    : "Mulai / Ulangi Ujian"}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : activeItem?.type === 'assignment' ? (
                        <div className="w-full mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col shrink-0 mb-20">
                            <div className="p-8 border-b border-gray-100">
                                <p className="text-gray-500 text-sm mb-2">Penugasan</p>
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">{activeItem.title}</h2>
                                
                                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 py-4 border-t border-b border-gray-100 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Batas Waktu:</span>
                                        <span className={cn("font-semibold", activeItem?.deadline_at && new Date(activeItem.deadline_at) < new Date() ? "text-red-600" : "text-gray-900")}>
                                            {activeItem?.deadline_at ? new Date(activeItem.deadline_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) : "Sesuai jadwal pengajar"}
                                        </span>
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
                                {assignmentData ? (
                                    <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-green-800">
                                        <div className="flex items-center gap-2 mb-4">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <span className="font-semibold text-lg">Tugas telah dikumpulkan</span>
                                        </div>
                                        <div className="text-sm space-y-2">
                                            <p><span className="font-medium">Waktu Pengumpulan:</span> {new Date(assignmentData.submitted_at).toLocaleString('id-ID')}</p>
                                            {assignmentData.score !== null && (
                                                <p><span className="font-medium">Nilai:</span> <span className="text-lg font-bold">{assignmentData.score}</span> / 100</p>
                                            )}
                                            {assignmentData.feedback && (
                                                <div className="mt-4 p-4 bg-white rounded-lg border border-green-100">
                                                    <span className="font-medium text-green-900 block mb-1">Catatan Pengajar:</span>
                                                    <p className="text-gray-700">{assignmentData.feedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center text-gray-500">
                                        Belum ada tugas yang dikumpulkan.
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-white">
                                <h3 className="font-bold text-gray-900 mb-4">Instruksi Tugas</h3>
                                <div 
                                    className="prose prose-sm prose-blue max-w-none text-gray-700 mb-8"
                                    dangerouslySetInnerHTML={{ __html: activeItem.content || '<p>Tidak ada instruksi khusus untuk penugasan ini.</p>' }}
                                />
                                <div className="mt-8 flex gap-3">
                                    {!isFormOpen ? (
                                        activeItem?.deadline_at && new Date(activeItem.deadline_at) < new Date() ? (
                                            <div className="text-sm font-bold text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100 w-full text-center">
                                                Batas waktu pengumpulan tugas telah lewat.
                                            </div>
                                        ) : (
                                            <Button 
                                                onClick={() => setIsFormOpen(true)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                                            >
                                                {assignmentData ? "Edit Pengumpulan Tugas" : "Mulai Pengumpulan Tugas"}
                                            </Button>
                                        )
                                    ) : (
                                        <div className="w-full">
                                            <div className="space-y-4 max-w-2xl bg-gray-50 p-6 rounded-xl border border-gray-200">
                                                <h3 className="font-bold text-gray-900 border-b pb-2">Lembar Jawaban</h3>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tautan Lampiran (Google Drive, Docs, dll) (Opsional)</label>
                                                    <input
                                                        type="url"
                                                        value={submissionUrl}
                                                        onChange={(e) => setSubmissionUrl(e.target.value)}
                                                        placeholder="https://..."
                                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Jawaban Teks</label>
                                                    <textarea
                                                        value={submissionText}
                                                        onChange={(e) => setSubmissionText(e.target.value)}
                                                        rows={5}
                                                        placeholder="Ketik jawaban Anda di sini..."
                                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 flex gap-3">
                                                <Button 
                                                    onClick={handleAssignmentSubmit}
                                                    disabled={isSubmitting || (!submissionUrl && !submissionText)}
                                                    className="bg-blue-900 hover:bg-blue-800 text-white rounded-md"
                                                >
                                                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                    Kirim Jawaban Tugas
                                                </Button>
                                                <Button 
                                                    variant="outline"
                                                    onClick={() => setIsFormOpen(false)}
                                                    disabled={isSubmitting}
                                                    className="rounded-md"
                                                >
                                                    Batal
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full mx-auto flex flex-col flex-1 h-full">
                            <div className="mb-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{activeItem?.title}</h2>
                                    <p className="text-gray-600 leading-relaxed">
                                        Simak materi berikut ini dengan saksama.
                                    </p>
                                </div>
                                {(activeItem?.type === 'pdf' || activeItem?.type === 'link') && activeItem.url && (
                                    <a href={activeItem.url} target="_blank" rel="noopener noreferrer" className="shrink-0 w-full sm:w-auto">
                                        <Button variant="outline" className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50">
                                            Buka di Tab Baru
                                        </Button>
                                    </a>
                                )}
                            </div>
                            <div className="w-full bg-black md:bg-white rounded-2xl shadow-sm border border-gray-100 relative flex flex-col mb-6">
                                {activeItem?.type === 'video' ? (
                                    <div className="w-full relative bg-black flex items-center justify-center rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                        {activeItem.url?.includes('youtube.com') || activeItem.url?.includes('youtu.be') ? (
                                            <iframe
                                                className="absolute inset-0 w-full h-full border-0"
                                                src={getEmbedUrl(activeItem.url)}
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
                                    <div className="w-full relative bg-gray-50 flex items-center justify-center" style={{ height: '75vh', minHeight: '500px' }}>
                                        <iframe 
                                            src={getEmbedUrl(activeItem.url)} 
                                            className="absolute inset-0 w-full h-full border-0"
                                            title={activeItem.title}
                                            allowFullScreen
                                        />
                                    </div>
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
                <div className="h-16 border-b border-gray-100 flex items-center px-6 bg-white sticky top-0 z-10 flex-shrink-0 gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg text-gray-900">LMS MGMP</span>
                </div>

                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Konten Kelas</h2>
                </div>

                {/* Dashboard Menu Item */}
                <div className="border-b border-gray-100 flex-shrink-0">
                    <button
                        onClick={() => setActiveMaterial('')}
                        className={cn(
                            "w-full text-left px-5 py-4 flex items-center gap-3 transition-colors",
                            activeMaterial === '' ? "bg-blue-50/50 text-blue-700 font-bold border-l-4 border-blue-600" : "hover:bg-gray-50 text-gray-700 font-medium border-l-4 border-transparent"
                        )}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard Kelas</span>
                    </button>
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
                                {isPassed && (
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
                                                    onClick={() => {
                                                        if (item.is_locked) {
                                                            toast.error(item.lock_reason || "Materi terkunci");
                                                            return;
                                                        }
                                                        setActiveMaterial(item.id);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-3 pl-8 flex items-start gap-3 transition-colors group relative",
                                                        isActive ? "bg-blue-50/50" : (item.is_locked ? "opacity-70 bg-gray-50/50 cursor-not-allowed" : "hover:bg-gray-50")
                                                    )}
                                                >
                                                    <div className="mt-0.5">{getIcon(item.type, item.is_completed, item.is_locked)}</div>
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <span className={cn(
                                                            "text-sm block truncate",
                                                            isActive ? "text-blue-700 font-medium" : "text-gray-600 group-hover:text-gray-900"
                                                        )}>
                                                            {item.title}
                                                        </span>
                                                        {item.is_locked && (
                                                            <span className="text-[10px] text-red-500 block leading-tight mt-0.5">{item.lock_reason}</span>
                                                        )}
                                                    </div>
                                                    {!item.is_locked && <span className="text-[10px] font-medium text-gray-400 mt-0.5">{item.duration}</span>}
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
