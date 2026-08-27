import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Video, FileText, CheckSquare, Pencil, Trash2, GripVertical, FileQuestion, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { lmsService } from '../../../services/lmsService';
import type { LmsTopic, LmsMaterial } from '../../../types';
import { toast } from 'react-hot-toast';

export function AdminEventLms() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [topics, setTopics] = useState<LmsTopic[]>([]);
    const [materials, setMaterials] = useState<Record<string, LmsMaterial[]>>({});
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

    // Form States
    const [topicTitle, setTopicTitle] = useState('');
    const [materialForm, setMaterialForm] = useState({
        title: '',
        type: 'video',
        duration: ''
    });

    useEffect(() => {
        if (id) {
            loadData(id);
        }
    }, [id]);

    const loadData = async (eventId: string) => {
        try {
            setLoading(true);
            const fetchedTopics = await lmsService.getTopicsByEvent(eventId);
            setTopics(fetchedTopics);
            
            const materialsMap: Record<string, LmsMaterial[]> = {};
            for (const topic of fetchedTopics) {
                materialsMap[topic.id] = await lmsService.getMaterialsByTopic(topic.id);
            }
            setMaterials(materialsMap);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data LMS");
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="w-4 h-4 text-blue-500" />;
            case 'text': return <FileText className="w-4 h-4 text-gray-500" />;
            case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
            case 'quiz': return <FileQuestion className="w-4 h-4 text-purple-500" />;
            case 'assignment': return <CheckSquare className="w-4 h-4 text-green-500" />;
            default: return <FileText className="w-4 h-4 text-gray-500" />;
        }
    };

    if (loading) return <div className="p-8 text-center">Memuat data kurikulum LMS...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" onClick={() => navigate(`/admin/events/${id}`)} className="text-gray-500">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kelola Kurikulum LMS</h1>
                    <p className="text-sm text-gray-500">Susun topik dan tambahkan materi, kuis, atau tugas</p>
                </div>
            </div>

            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="font-medium text-gray-700">Daftar Topik ({topics.length})</span>
                <Button onClick={() => setIsTopicModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Topik
                </Button>
            </div>

            <div className="space-y-4">
                {topics.map((topic) => (
                    <div key={topic.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        {/* Topic Header */}
                        <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                                <h2 className="font-bold text-lg text-gray-800">{topic.title}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-8">
                                    <Pencil className="w-3 h-3 mr-1" /> Edit
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200">
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Materials List */}
                        <div className="p-4">
                            {(materials[topic.id] || []).length > 0 ? (
                                <div className="space-y-2 mb-4">
                                    {materials[topic.id].map(mat => (
                                        <div key={mat.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 cursor-move transition-opacity" />
                                                <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center border border-gray-100">
                                                    {getIcon(mat.type)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm text-gray-900">{mat.title}</div>
                                                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{mat.type}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {mat.type === 'quiz' && (
                                                    <Button 
                                                        onClick={() => navigate(`/admin/events/${id}/lms/quiz/${mat.id}`)}
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-7 text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                                    >
                                                        Kelola Soal
                                                    </Button>
                                                )}
                                                {mat.type === 'assignment' && (
                                                    <Button 
                                                        onClick={() => navigate(`/admin/events/${id}/lms/assignment/${mat.id}`)}
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-7 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                    >
                                                        Periksa Tugas
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500">
                                                    <Pencil className="w-3 h-3" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500">
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-sm text-gray-400 border-2 border-dashed border-gray-100 rounded-lg mb-4">
                                    Belum ada materi di topik ini
                                </div>
                            )}

                            <Button 
                                onClick={() => {
                                    setActiveTopicId(topic.id);
                                    setIsMaterialModalOpen(true);
                                }}
                                variant="outline" 
                                size="sm" 
                                className="w-full border-dashed border-2 border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Tambah Materi / Kuis / Tugas
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Tambah Topik */}
            {isTopicModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Tambah Topik Baru</h3>
                            <button onClick={() => setIsTopicModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Topik</label>
                            <input 
                                type="text"
                                value={topicTitle}
                                onChange={(e) => setTopicTitle(e.target.value)}
                                placeholder="Misal: Pendahuluan"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsTopicModalOpen(false)}>Batal</Button>
                            <Button onClick={() => {
                                toast.success("Topik berhasil ditambahkan! (Simulasi)");
                                setIsTopicModalOpen(false);
                                setTopicTitle('');
                            }} className="bg-blue-600 hover:bg-blue-700">Simpan</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tambah Materi */}
            {isMaterialModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Tambah Materi Baru</h3>
                            <button onClick={() => setIsMaterialModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Materi</label>
                                <input 
                                    type="text"
                                    value={materialForm.title}
                                    onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                                    placeholder="Misal: Video Pengenalan AI"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Konten</label>
                                <select 
                                    value={materialForm.type}
                                    onChange={(e) => setMaterialForm({...materialForm, type: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="video">Video</option>
                                    <option value="pdf">Dokumen PDF</option>
                                    <option value="text">Teks / Artikel</option>
                                    <option value="quiz">Kuis / Ujian</option>
                                    <option value="assignment">Penugasan</option>
                                </select>
                            </div>
                            {['video', 'pdf'].includes(materialForm.type) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tautan File / Video URL</label>
                                    <input 
                                        type="url"
                                        placeholder="https://..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsMaterialModalOpen(false)}>Batal</Button>
                            <Button onClick={() => {
                                toast.success("Materi berhasil ditambahkan! (Simulasi) ke topik ID: " + activeTopicId);
                                setIsMaterialModalOpen(false);
                                setMaterialForm({ title: '', type: 'video', duration: '' });
                            }} className="bg-blue-600 hover:bg-blue-700">Simpan</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
