import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Plus, Video, FileText, CheckSquare, Pencil, Trash2, GripVertical, FileQuestion, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import { lmsService } from '../../../services/lmsService';
import type { LmsTopic, LmsMaterial } from '../../../types';
import { toast } from 'react-hot-toast';

export function AdminEventLms() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    // For updating the global admin layout header
    const { setPageHeader } = useOutletContext<any>();
    
    const [topics, setTopics] = useState<LmsTopic[]>([]);
    const [materials, setMaterials] = useState<Record<string, LmsMaterial[]>>({});
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    
    // State to determine if we are editing an existing item
    const [editingTopic, setEditingTopic] = useState<LmsTopic | null>(null);
    const [editingMaterial, setEditingMaterial] = useState<LmsMaterial | null>(null);
    
    const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

    // Form States
    const [topicTitle, setTopicTitle] = useState('');
    const [materialForm, setMaterialForm] = useState({
        title: '',
        type: 'video',
        url: '',
        content: '',
        duration: ''
    });

    useEffect(() => {
        // Set the global header
        setPageHeader({
            title: "Kelola LMS",
            subtitle: "Susun topik dan tambahkan materi, kuis, atau tugas"
        });

        // Cleanup on unmount
        return () => {
            setPageHeader(null);
        };
    }, [setPageHeader]);

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

    // --- TOPIC HANDLERS ---
    
    const handleOpenTopicModal = (topic?: LmsTopic) => {
        if (topic) {
            setEditingTopic(topic);
            setTopicTitle(topic.title);
        } else {
            setEditingTopic(null);
            setTopicTitle('');
        }
        setIsTopicModalOpen(true);
    };

    const handleSaveTopic = async () => {
        if (!topicTitle.trim()) {
            toast.error("Judul topik tidak boleh kosong");
            return;
        }

        try {
            const payload: Partial<LmsTopic> = {
                title: topicTitle,
                event_id: id,
                order_num: editingTopic ? editingTopic.order_num : topics.length + 1
            };

            if (editingTopic) {
                payload.id = editingTopic.id;
            }

            await lmsService.saveTopic(payload);
            toast.success(`Topik berhasil ${editingTopic ? 'diperbarui' : 'ditambahkan'}!`);
            setIsTopicModalOpen(false);
            setTopicTitle('');
            if (id) loadData(id);
        } catch (error) {
            toast.error("Gagal menyimpan topik");
            console.error(error);
        }
    };

    const handleDeleteTopic = async (topicId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus topik ini? Semua materi di dalamnya akan ikut terhapus.')) return;
        try {
            await lmsService.deleteTopic(topicId);
            toast.success("Topik berhasil dihapus");
            if (id) loadData(id);
        } catch (error) {
            toast.error("Gagal menghapus topik");
            console.error(error);
        }
    };

    // --- MATERIAL HANDLERS ---

    const handleOpenMaterialModal = (topicId: string, material?: LmsMaterial) => {
        setActiveTopicId(topicId);
        if (material) {
            setEditingMaterial(material);
            setMaterialForm({
                title: material.title,
                type: material.type,
                url: material.url || '',
                content: material.content || '',
                duration: material.duration ? material.duration.toString() : ''
            });
        } else {
            setEditingMaterial(null);
            setMaterialForm({ title: '', type: 'video', url: '', content: '', duration: '' });
        }
        setIsMaterialModalOpen(true);
    };

    const handleSaveMaterial = async () => {
        if (!materialForm.title.trim() || !activeTopicId) {
            toast.error("Judul materi tidak boleh kosong");
            return;
        }

        try {
            const payload: Partial<LmsMaterial> = {
                title: materialForm.title,
                topic_id: activeTopicId,
                type: materialForm.type as any,
                url: materialForm.url,
                content: materialForm.content,
                duration: materialForm.duration ? parseInt(materialForm.duration) : 0,
                order_num: editingMaterial ? editingMaterial.order_num : (materials[activeTopicId]?.length || 0) + 1
            };

            if (editingMaterial) {
                payload.id = editingMaterial.id;
            }

            await lmsService.saveMaterial(payload);
            toast.success(`Materi berhasil ${editingMaterial ? 'diperbarui' : 'ditambahkan'}!`);
            setIsMaterialModalOpen(false);
            if (id) loadData(id);
        } catch (error) {
            toast.error("Gagal menyimpan materi");
            console.error(error);
        }
    };

    const handleDeleteMaterial = async (materialId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;
        try {
            await lmsService.deleteMaterial(materialId);
            toast.success("Materi berhasil dihapus");
            if (id) loadData(id);
        } catch (error) {
            toast.error("Gagal menghapus materi");
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 text-center">Memuat data kurikulum LMS...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(`/admin/events/${id}`)} className="text-gray-500 p-2 h-auto">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <span className="font-medium text-gray-700">Daftar Topik ({topics.length})</span>
                </div>
                <Button onClick={() => handleOpenTopicModal()} className="bg-blue-600 hover:bg-blue-700">
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
                                <Button onClick={() => handleOpenTopicModal(topic)} variant="outline" size="sm" className="h-8">
                                    <Pencil className="w-3 h-3 mr-1" /> Edit
                                </Button>
                                <Button onClick={() => handleDeleteTopic(topic.id)} variant="outline" size="sm" className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200">
                                    <Trash2 className="w-3 h-3 mr-1" /> Hapus
                                </Button>
                            </div>
                        </div>

                        {/* Materials List */}
                        <div className="p-4 space-y-3">
                            {materials[topic.id] && materials[topic.id].length > 0 ? (
                                <div className="space-y-2">
                                    {materials[topic.id].map((material) => (
                                        <div key={material.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-100 hover:shadow-sm transition-all group">
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="w-4 h-4 text-gray-300 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center border border-gray-100">
                                                    {getIcon(material.type)}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-800 text-sm">{material.title}</h4>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{material.type}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {material.type === 'quiz' && (
                                                    <Button 
                                                        onClick={() => navigate(`/admin/events/${id}/lms/quiz/${material.id}`)}
                                                        size="sm" 
                                                        className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                                                    >
                                                        <FileQuestion className="w-3 h-3 mr-1" /> Kelola Soal
                                                    </Button>
                                                )}
                                                <Button 
                                                    onClick={() => handleOpenMaterialModal(topic.id, material)} 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-7 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200"
                                                >
                                                    <Pencil className="w-3 h-3 mr-1" /> {material.type === 'quiz' ? 'Edit Setelan' : 'Isi Konten'}
                                                </Button>
                                                <Button onClick={() => handleDeleteMaterial(material.id)} variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500">
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
                                onClick={() => handleOpenMaterialModal(topic.id)}
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

            {/* Modal Topik */}
            {isTopicModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">{editingTopic ? 'Edit Topik' : 'Tambah Topik Baru'}</h3>
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
                            <Button onClick={handleSaveTopic} className="bg-blue-600 hover:bg-blue-700">Simpan</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Materi */}
            {isMaterialModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden my-8">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">{editingMaterial ? 'Edit Materi' : 'Tambah Materi Baru'}</h3>
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
                            {['video', 'pdf', 'link'].includes(materialForm.type) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tautan URL (YouTube, GDrive, Canva, MP4)</label>
                                    <input 
                                        type="url"
                                        value={materialForm.url}
                                        onChange={(e) => setMaterialForm({...materialForm, url: e.target.value})}
                                        placeholder="https://..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            )}
                            {materialForm.type === 'text' && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Konten Artikel / Teks</label>
                                    <RichTextEditor
                                        value={materialForm.content || ''}
                                        onChange={(content) => setMaterialForm({...materialForm, content})}
                                        height={300}
                                        placeholder="Tulis konten materi di sini..."
                                    />
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsMaterialModalOpen(false)}>Batal</Button>
                            <Button onClick={handleSaveMaterial} className="bg-blue-600 hover:bg-blue-700">Simpan</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
