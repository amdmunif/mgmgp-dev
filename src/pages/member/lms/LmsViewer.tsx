import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, PlayCircle, FileText, CheckCircle, ArrowLeft, Menu, X, Play, CheckSquare, Trophy } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';

// Mock Data Types
interface LmsMaterial {
    id: string;
    title: string;
    type: 'video' | 'pdf' | 'text' | 'quiz' | 'assignment';
    duration: string;
    is_completed: boolean;
}

interface LmsTopic {
    id: string;
    title: string;
    items: LmsMaterial[];
}

const INITIAL_TOPICS: LmsTopic[] = [
    {
        id: 't1',
        title: 'Pendahuluan',
        items: [
            { id: 'm1', title: 'Gambaran Kelas Kecerdasan Artifisial', type: 'video', duration: '04:12', is_completed: true },
            { id: 'm2', title: 'Pretest Kelas Kecerdasan Artifisial', type: 'quiz', duration: '15 Soal', is_completed: true }
        ]
    },
    {
        id: 't2',
        title: 'Pengenalan Teknologi Kecerdasan Artifisial (KA)',
        items: [
            { id: 'm3', title: 'Teknologi Kecerdasan Artifisial (KA)', type: 'video', duration: '12:00', is_completed: false },
            { id: 'm4', title: 'KA Akan Mengubah Cara Belajar', type: 'video', duration: '08:30', is_completed: false },
            { id: 'm5', title: 'Modul 1: Pengenalan Teknologi KA', type: 'pdf', duration: '15 Halaman', is_completed: false },
            { id: 'm6', title: 'Kuis 1: Pengenalan Teknologi KA', type: 'quiz', duration: '5 Soal', is_completed: false }
        ]
    },
    {
        id: 't3',
        title: 'Manajemen Prompt dan Interaksi dengan LLM',
        items: [
            { id: 'm7', title: 'Manajemen Prompt', type: 'video', duration: '15:20', is_completed: false },
            { id: 'm8', title: 'Tugas 1: Praktik Membuat Prompt', type: 'assignment', duration: 'Tugas', is_completed: false }
        ]
    }
];

export function LmsViewer() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedTopics, setExpandedTopics] = useState<string[]>(['t1', 't2']);
    const [activeMaterial, setActiveMaterial] = useState<string>('m3');
    const [topics, setTopics] = useState<LmsTopic[]>(INITIAL_TOPICS);

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
    const totalItems = topics.reduce((acc, topic) => acc + topic.items.length, 0);
    const completedItems = topics.reduce((acc, topic) => acc + topic.items.filter(i => i.is_completed).length, 0);
    const progressPercent = Math.round((completedItems / totalItems) * 100);

    const activeItem = topics.flatMap(t => t.items).find(i => i.id === activeMaterial);

    const handleMarkComplete = () => {
        setTopics(prevTopics => prevTopics.map(topic => ({
            ...topic,
            items: topic.items.map(item => 
                item.id === activeMaterial ? { ...item, is_completed: true } : item
            )
        })));
        toast.success("Berhasil menandai materi sebagai selesai!");
    };

    const renderMainContent = () => {
        return (
            <div className="w-full h-full flex flex-col">
                {/* Header for content */}
                <div className="bg-[#2D1B69] text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-1 hover:bg-white/10 rounded">
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="font-medium text-lg hidden md:block">Kelas Kecerdasan Artifisial Wonosobo – 28 Februari 2026</h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="hidden md:flex flex-col items-end">
                            <span>Kemajuan Anda: <strong>{completedItems}</strong> dari <strong>{totalItems}</strong> ({progressPercent}%)</span>
                            <div className="w-48 h-2 bg-[#1d0f4d] rounded-full mt-1 overflow-hidden">
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
                <div className="flex-1 bg-gray-50 p-6 md:p-10 overflow-y-auto relative flex flex-col items-center">
                    {activeItem?.type === 'quiz' ? (
                        <div className="max-w-2xl w-full mx-auto mt-12 bg-white p-10 rounded-2xl border border-gray-100 shadow-sm text-center">
                            <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{activeItem.title}</h2>
                            <p className="text-gray-600 mb-8">
                                Ujian ini memiliki durasi yang dibatasi. Waktu akan mulai berjalan ketika Anda menekan tombol di bawah.
                            </p>
                            <Button 
                                size="lg" 
                                className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
                                onClick={() => navigate(`/member/lms/classroom/${eventId}/quiz/${activeItem.id}`)}
                            >
                                Mulai Ujian Sekarang
                            </Button>
                        </div>
                    ) : activeItem?.type === 'assignment' ? (
                        <div className="max-w-3xl w-full mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                                        <CheckSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{activeItem.title}</h2>
                                        <p className="text-gray-500 text-sm">Batas Pengumpulan: 30 Agustus 2026, 23:59</p>
                                    </div>
                                </div>
                                <div className="prose prose-sm text-gray-600">
                                    <p>Buatlah 5 prompt efektif menggunakan metode peran (Role-play) yang telah dipelajari. Kumpulkan tugas Anda dalam bentuk link Google Drive atau Google Docs yang bisa diakses (viewer).</p>
                                </div>
                            </div>
                            <div className="p-8 bg-gray-50">
                                <h3 className="font-bold text-gray-800 mb-4">Pengumpulan Tugas</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tautan / Link Tugas</label>
                                        <input 
                                            type="url" 
                                            placeholder="https://..."
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
                                        <textarea 
                                            rows={3}
                                            placeholder="Tulis pesan untuk instruktur..."
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white resize-y"
                                        />
                                    </div>
                                    <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white mt-2">
                                        Kumpulkan Tugas
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-4xl mx-auto">
                            <div className="w-full aspect-video bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg relative overflow-hidden flex items-center justify-center group cursor-pointer">
                                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-20 h-20 bg-black/60 rounded-xl flex items-center justify-center shadow-2xl relative z-10 transition-transform group-hover:scale-110">
                                    <Play className="w-10 h-10 text-white ml-2" />
                                </div>
                            </div>
                            <div className="mt-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{activeItem?.title}</h2>
                                    <p className="text-gray-600 leading-relaxed">
                                        Ini adalah area untuk menampilkan video, PDF, atau teks secara langsung.
                                    </p>
                                </div>
                                {!activeItem?.is_completed && (
                                    <Button onClick={handleMarkComplete} className="bg-green-600 hover:bg-green-700 flex-shrink-0">
                                        <CheckCircle className="w-4 h-4 mr-2" /> Tandai Selesai
                                    </Button>
                                )}
                                {activeItem?.is_completed && (
                                    <span className="px-4 py-2 bg-green-50 text-green-700 font-medium rounded-lg flex items-center gap-2 border border-green-200">
                                        <CheckCircle className="w-5 h-5" /> Selesai Ditonton
                                    </span>
                                )}
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
