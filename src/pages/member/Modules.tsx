import { useState, useEffect, useMemo } from 'react';
import { Book, Download, Presentation, FileText, X, Eye, ExternalLink } from 'lucide-react';
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
    const [filterType, setFilterType] = useState('all');
    const [filterMapel, setFilterMapel] = useState('all');
    const [filterKelas, setFilterKelas] = useState('all');
    const [filterSemester, setFilterSemester] = useState('all');
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
            const matchType = filterType === 'all' || 
                              (filterType === 'modul' && (m.type === 'modul' || m.type === 'rpp')) || 
                              (filterType === 'slide' && m.type === 'slide');
            const matchMapel = filterMapel === 'all' || m.mapel === filterMapel;
            const matchKelas = filterKelas === 'all' || m.kelas === filterKelas;
            const matchSemester = filterSemester === 'all' || m.semester?.toString() === filterSemester;
            
            return matchType && matchMapel && matchKelas && matchSemester;
        });
    }, [materials, filterType, filterMapel, filterKelas, filterSemester]);

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
                <div className="flex items-center gap-1.5 whitespace-nowrap overflow-x-auto pb-1 scrollbar-hide">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${getPhase(item.kelas) === 'Fase D' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                        {getPhase(item.kelas)}
                    </span>
                    {item.kelas && <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-50 text-gray-700 border border-gray-200">Kls {item.kelas}</span>}
                    {item.semester && <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-50 text-gray-700 border border-gray-200">Smt {item.semester}</span>}
                </div>
            ),
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
                    {item.link_url && (
                        <a href={item.link_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-white border text-blue-700 border-blue-300 hover:bg-blue-50 h-8" title="Buka Link">
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </a>
                    )}
                    {item.file_url && (
                        <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-white border text-yellow-700 border-yellow-300 hover:bg-yellow-50 h-8" title="Download File">
                                <Download className="w-4 h-4" />
                            </Button>
                        </a>
                    )}
                </div>
            ),
            className: "w-32 text-right"
        }
    ], []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">


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
                            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 w-full sm:w-auto"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="all">Semua Tipe</option>
                                    <option value="modul">Modul Ajar</option>
                                    <option value="slide">Slide</option>
                                </select>
                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 w-full sm:w-auto"
                                    value={filterMapel}
                                    onChange={(e) => setFilterMapel(e.target.value)}
                                >
                                    <option value="all">Semua Mapel</option>
                                    <option value="Informatika">Informatika</option>
                                    <option value="KKA">KKA</option>
                                </select>
                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 w-full sm:w-auto"
                                    value={filterKelas}
                                    onChange={(e) => setFilterKelas(e.target.value)}
                                >
                                    <option value="all">Semua Kls</option>
                                    <option value="7">Kelas 7</option>
                                    <option value="8">Kelas 8</option>
                                    <option value="9">Kelas 9</option>
                                </select>
                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 w-full sm:w-auto"
                                    value={filterSemester}
                                    onChange={(e) => setFilterSemester(e.target.value)}
                                >
                                    <option value="all">Semua Smt</option>
                                    <option value="1">Smt 1</option>
                                    <option value="2">Smt 2</option>
                                </select>
                            </div>
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
                            {viewingMaterial.link_url && !viewingMaterial.file_url ? (
                                <div className="flex flex-col items-center justify-center h-full bg-white p-6 text-center">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                        <ExternalLink className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <p className="text-gray-900 font-medium mb-1">Tautan Eksternal</p>
                                    <p className="text-sm text-gray-500 mb-6">Materi ini berupa tautan eksternal dan akan dibuka di tab baru.</p>
                                    <a href={viewingMaterial.link_url} target="_blank" rel="noopener noreferrer">
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                            <ExternalLink className="w-4 h-4 mr-2" /> Buka Tautan
                                        </Button>
                                    </a>
                                </div>
                            ) : viewingMaterial.file_url ? (
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
                                {viewingMaterial.link_url && (
                                    <a href={viewingMaterial.link_url} target="_blank" rel="noopener noreferrer">
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white border-none">
                                            <ExternalLink className="w-4 h-4 mr-2" /> Buka Link
                                        </Button>
                                    </a>
                                )}
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
