import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { BookOpen, FileText, Presentation, File, Download } from 'lucide-react';
import { learningService } from '../../services/learningService';
import type { LearningMaterial } from '../../types';

type Tab = 'cp' | 'tp' | 'rpp';

export function Learning() {
    const [activeTab, setActiveTab] = useState<Tab>('cp');
    const [materials, setMaterials] = useState<LearningMaterial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMaterials();
    }, []);

    const loadMaterials = async () => {
        try {
            const data = await learningService.getAll();
            setMaterials(data);
        } catch (error) {
            console.error('Failed to load materials', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMaterials = materials.filter(m => {
        if (activeTab === 'cp') return m.type === 'cp';
        if (activeTab === 'tp') return m.type === 'tp';
        if (activeTab === 'rpp') return m.type === 'rpp' || m.type === 'slide' || m.type === 'modul';
        return false;
    });

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900">Referensi Pembelajaran</h1>
                <p className="text-gray-500 mt-2">Kumpulan Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), dan Perangkat Ajar Kurikulum Merdeka.</p>
            </div>

            <div className="flex justify-center mb-8 border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('cp')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap",
                        activeTab === 'cp' ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    <BookOpen className="w-4 h-4" />
                    Capaian Pembelajaran (CP)
                    {activeTab === 'cp' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('tp')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap",
                        activeTab === 'tp' ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    <FileText className="w-4 h-4" />
                    Tujuan Pembelajaran (TP)
                    {activeTab === 'tp' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('rpp')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap",
                        activeTab === 'rpp' ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    <Presentation className="w-4 h-4" />
                    Perangkat Ajar (RPP/Modul)
                    {activeTab === 'rpp' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
                </button>
            </div>

            <div className="space-y-6 min-h-[300px]">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Memuat materi...</div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-lg">
                        <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">Belum ada materi tersedia</h3>
                        <p className="text-gray-500">Silakan cek kembali nanti atau hubungi admin.</p>
                    </div>
                ) : (
                    <div className={cn("grid gap-6", activeTab === 'rpp' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
                        {filteredMaterials.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded uppercase">{item.mapel}</span>
                                    {item.kelas && <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">Kelas {item.kelas}</span>}
                                    {item.is_premium && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">Premium</span>}
                                    {activeTab === 'rpp' && (
                                        <span className={cn(
                                            "px-2 py-1 text-xs font-semibold rounded uppercase ml-auto",
                                            item.type === 'slide' ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"
                                        )}>
                                            {item.type}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{item.title}</h3>
                                {item.content && <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">{item.content}</p>}

                                {item.file_url ? (
                                    <a
                                        href={item.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 mt-2"
                                    >
                                        <Download className="w-4 h-4 mr-2" /> Download Materi
                                    </a>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

