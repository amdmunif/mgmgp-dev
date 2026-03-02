import { useState, useEffect, useMemo } from 'react';
import { Book, Download, Presentation, FileText, X, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { learningService } from '../../services/learningService';
import type { LearningMaterial } from '../../types';
import { FileViewer } from '../../components/ui/FileViewer';
import { useOutletContext } from 'react-router-dom';
import { DataTable } from '../../components/ui/DataTable';

export function Modules() {
    const { setPageHeader } = useOutletContext<any>();
    const [materials, setMaterials] = useState<LearningMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('modul');
    const [viewingMaterial, setViewingMaterial] = useState<LearningMaterial | null>(null);

    useEffect(() => {
        setPageHeader({
            title: 'Modul Ajar & Slide Premium',
            description: 'Akses koleksi perangkat ajar lengkap siap pakai.',
            icon: <Book className="w-6 h-6 text-yellow-600" />
        });
    }, [setPageHeader]);

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

    const filteredMaterials = useMemo(() => {
        return materials.filter(m => {
            if (filterType === 'modul') return m.type === 'modul' || m.type === 'rpp';
            if (filterType === 'slide') return m.type === 'slide';
            return true;
        });
    }, [materials, filterType]);

    const getPhase = (kelas?: string) => {
        if (!kelas) return 'Umum';
        const k = parseInt(kelas);
        if (k >= 7 && k <= 9) return 'Fase D';
        if (k >= 10 && k <= 12) return 'Fase E/F';
        return 'Umum';
    };

    const columns = useMemo(() => [
        {
            header: "Perangkat Ajar",
            accessorKey: "title" as keyof LearningMaterial,
            cell: (item: LearningMaterial) => (
                <div className="flex items-start gap-3 py-1">
                    <div className="flex-shrink-0 w-12 h-12 bg-yellow-50 rounded-lg border border-yellow-100 flex items-center justify-center">
                        {item.type === 'slide' ? <Presentation className="w-5 h-5 text-yellow-600" /> : <FileText className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 group-hover:text-yellow-600 transition-colors uppercase text-xs mb-0.5 tracking-wider">{item.type}</div>
                        <div className="font-semibold text-sm line-clamp-2">{item.title}</div>
                        {item.mapel && <div className="text-xs text-gray-500 mt-1">{item.mapel}</div>}
                    </div>
                </div>
            )
        },
        {
            header: "Target/Kelas",
            accessorKey: "kelas" as keyof LearningMaterial,
            cell: (item: LearningMaterial) => (
                <div className="flex flex-wrap gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${getPhase(item.kelas) === 'Fase D' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                        {getPhase(item.kelas)}
                    </span>
                    {item.kelas && <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-50 text-gray-700 border border-gray-200">Kls {item.kelas}</span>}
                    {item.semester && <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-50 text-gray-700 border border-gray-200">Smt {item.semester}</span>}
                </div>
            ),
            className: "w-48"
        },
        {
            header: "Aksi",
            cell: (item: LearningMaterial) => (
                <div className="flex items-center justify-end gap-2 pr-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 h-8"
                        onClick={() => setViewingMaterial(item)}
                        title="Lihat Pratinjau"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-white border text-yellow-700 border-yellow-300 hover:bg-yellow-50 h-8" title="Download File">
                            <Download className="w-4 h-4" />
                        </Button>
                    </a>
                </div>
            ),
            className: "w-32 text-right"
        }
    ], []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-yellow-800 mb-2">Benefit Konten Premium</h3>
                <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                    <li>Materi sudah terintegrasi dengan CP/TP terbaru.</li>
                    <li>Dilengkapi dengan asesmen dan rubrik penilaian.</li>
                    <li>Format dapat diedit (Word/PPT) untuk disesuaikan.</li>
                </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Memuat data modul...</div>
                ) : (
                    <DataTable
                        data={filteredMaterials}
                        columns={columns}
                        searchKeys={['title', 'mapel', 'type', 'content']}
                        pageSize={15}
                        filterContent={
                            <select
                                className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 h-[38px]"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="all">Semua Tipe</option>
                                <option value="modul">Modul Ajar (RPP / Modul)</option>
                                <option value="slide">Slide Presentasi (PPT)</option>
                            </select>
                        }
                    />
                )}
            </div>

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
