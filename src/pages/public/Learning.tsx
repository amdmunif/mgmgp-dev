import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { File, Download, Loader2 } from 'lucide-react';
import { learningService } from '../../services/learningService';
import { getFileUrl } from '../../lib/api';
import type { LearningMaterial } from '../../types';

export function Learning() {
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
        // Only show RPP, Slide, Modul (ignore any old CP/TP data if returned)
        return ['rpp', 'slide', 'modul'].includes(m.type);
    });

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900">Perangkat Ajar</h1>
                <p className="text-gray-500 mt-2">Kumpulan Modul Ajar, Bahan Bacaan, dan Slide Presentasi Kurikulum Merdeka.</p>
            </div>

            {/* <div className="flex justify-center mb-8 border-b border-gray-200 overflow-x-auto">
               Tabs removed as we only show general materials here now. CP/TP is in separate menu.
            </div> */}

            <div className="space-y-6 min-h-[300px]">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-lg">
                        <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">Belum ada materi tersedia</h3>
                        <p className="text-gray-500">Silakan cek kembali nanti atau hubungi admin.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMaterials.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded uppercase">{item.mapel}</span>
                                    {item.kelas && <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">Kelas {item.kelas}</span>}
                                    {item.is_premium && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">Premium</span>}
                                    {['rpp', 'slide', 'modul'].includes(item.type) && (
                                        <span className={cn(
                                            "px-2 py-1 text-xs font-semibold rounded uppercase ml-auto",
                                            item.type === 'slide' ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"
                                        )}>
                                            {item.type}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{item.title}</h3>
                                {item.content ? (
                                    <div
                                        className="prose prose-sm md:prose-base text-gray-600 leading-relaxed mb-4 line-clamp-3 prose-p:text-gray-600"
                                        dangerouslySetInnerHTML={{
                                            __html: (item.content || '').replace(/src="uploads\//g, `src="${getFileUrl('/uploads/')}`)
                                        }}
                                    />
                                ) : null}

                                {item.file_url ? (
                                    <a
                                        href={getFileUrl(item.file_url)}
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
