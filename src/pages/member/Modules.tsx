import { useState, useEffect } from 'react';
import { Book, Download, Presentation, FileText, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { learningService } from '../../services/learningService';
import { cn } from '../../lib/utils';
import type { LearningMaterial } from '../../types';
import { FileViewer } from '../../components/ui/FileViewer';

export function Modules() {
    const [materials, setMaterials] = useState<LearningMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'modul' | 'slide'>('modul');
    const [viewingMaterial, setViewingMaterial] = useState<LearningMaterial | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await learningService.getAll();
                setMaterials(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredMaterials = materials.filter(m => {
        if (activeTab === 'modul') return m.type === 'modul' || m.type === 'rpp';
        if (activeTab === 'slide') return m.type === 'slide';
        return false;
    });

    const getPhase = (kelas?: string) => {
        if (!kelas) return 'Umum';
        const k = parseInt(kelas);
        if (k >= 7 && k <= 9) return 'Fase D';
        if (k >= 10 && k <= 12) return 'Fase E/F';
        return 'Umum';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-xl">
                    <Book className="w-8 h-8 text-yellow-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Modul Ajar & Slide Premium</h1>
                    <p className="text-gray-500">Akses koleksi perangkat ajar lengkap siap pakai.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('modul')}
                        className={cn(
                            "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
                            activeTab === 'modul'
                                ? "border-yellow-500 text-yellow-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                    >
                        <Book className="w-4 h-4" />
                        Modul Ajar
                    </button>
                    <button
                        onClick={() => setActiveTab('slide')}
                        className={cn(
                            "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
                            activeTab === 'slide'
                                ? "border-yellow-500 text-yellow-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                    >
                        <Presentation className="w-4 h-4" />
                        Slide Presentasi
                    </button>
                </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-bold text-yellow-800 mb-2">Benefit Konten Premium</h3>
                <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                    <li>Materi sudah terintegrasi dengan CP/TP terbaru.</li>
                    <li>Dilengkapi dengan asesmen dan rubrik penilaian.</li>
                    <li>Format dapat diedit (Word/PPT) untuk disesuaikan.</li>
                </ul>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Memuat materi...</div>
            ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Belum ada materi di kategori ini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMaterials.map((mod) => (
                        <div key={mod.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:border-yellow-400 hover:shadow-md transition-all flex flex-col justify-between h-full">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getPhase(mod.kelas) === 'Fase D' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                            {getPhase(mod.kelas)}
                                        </span>
                                        {mod.kelas && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600">Kelas {mod.kelas}</span>}
                                        {mod.semester && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600">Smt {mod.semester}</span>}
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">{mod.type}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg leading-snug mb-2">{mod.title}</h3>
                                {mod.mapel && <p className="text-sm text-gray-500 mb-1">{mod.mapel}</p>}
                                <div className="text-xs text-gray-400 mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: mod.content || '' }} />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                    onClick={() => setViewingMaterial(mod)}
                                >
                                    <Book className="w-4 h-4 mr-2" /> Lihat
                                </Button>
                                <a href={mod.file_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                    <Button className="w-full bg-white border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50">
                                        <Download className="w-4 h-4 mr-2" /> Download
                                    </Button>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* View Modal */}
            {viewingMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                            <div>
                                <h3 className="font-bold text-gray-900 line-clamp-1">{viewingMaterial.title}</h3>
                                <p className="text-xs text-gray-500">{viewingMaterial.mapel} - {viewingMaterial.type.toUpperCase()}</p>
                            </div>
                            <button onClick={() => setViewingMaterial(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 bg-gray-100 overflow-hidden relative">
                            {viewingMaterial.file_url ? (
                                <FileViewer
                                    url={viewingMaterial.file_url}
                                    title={viewingMaterial.title}
                                    className="h-full border-0 rounded-none"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    File tidak tersedia
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-50 flex justify-between items-center bg-white shrink-0">
                            <span className="text-xs text-gray-400">
                                Jika pratinjau tidak muncul, silakan download file.
                            </span>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setViewingMaterial(null)}>Tutup</Button>
                                {viewingMaterial.file_url && (
                                    <a href={viewingMaterial.file_url} target="_blank" rel="noopener noreferrer">
                                        <Button className="bg-yellow-500 hover:bg-yellow-600 text-white border-none">
                                            <Download className="w-4 h-4 mr-2" /> Download File
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
