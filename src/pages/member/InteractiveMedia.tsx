import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Code2, Play, Download, ExternalLink, X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/DataTable';
import { interactiveMediaService, type InteractiveMediaItem } from '../../services/interactiveMediaService';
import { getFileUrl } from '../../lib/api';
import { formatDate } from '../../lib/utils';

const CATEGORIES = [
    'Simulasi',
    'Visualisasi Materi',
    'Kuis Interaktif',
    'Game Edukasi',
    'Alat Bantu Ajar',
    'Lainnya'
];

function formatFileSize(bytes?: number) {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface OutletContextType {
    setPageHeader?: (header: { title: string; description?: string; icon?: ReactNode }) => void;
}

export function InteractiveMedia() {
    const { setPageHeader } = useOutletContext<OutletContextType>() || {};
    const [items, setItems] = useState<InteractiveMediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [filterCategory, setFilterCategory] = useState('all');
    const [filterMapel, setFilterMapel] = useState('all');
    const [filterKelas, setFilterKelas] = useState('all');
    const [filterSemester, setFilterSemester] = useState('all');

    const [activeItem, setActiveItem] = useState<InteractiveMediaItem | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Media Pembelajaran Interaktif',
                description: 'Kumpulan simulasi, visualisasi materi, dan media HTML interaktif siap pakai di kelas.',
                icon: <Code2 className="w-6 h-6 text-blue-600" />
            });
        }
        loadData();
    }, [setPageHeader]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await interactiveMediaService.getAll();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchCat = filterCategory === 'all' || item.category === filterCategory;
            const matchMapel = filterMapel === 'all' || item.mapel === filterMapel;
            const matchKelas = filterKelas === 'all' || item.kelas === filterKelas || item.kelas === 'Semua';
            const matchSemester = filterSemester === 'all' || item.semester === filterSemester || item.semester === 'Semua';
            return matchCat && matchMapel && matchKelas && matchSemester;
        });
    }, [items, filterCategory, filterMapel, filterKelas, filterSemester]);

    const columns = useMemo(() => [
        {
            header: 'Media Interaktif',
            accessorKey: 'title' as keyof InteractiveMediaItem,
            cell: (item: InteractiveMediaItem) => (
                <div className="flex items-start gap-3 py-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Code2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {item.category || 'Simulasi'}
                            </span>
                            {item.file_size ? (
                                <span className="text-[11px] text-gray-400">
                                    HTML • {formatFileSize(Number(item.file_size))}
                                </span>
                            ) : (
                                <span className="text-[11px] text-gray-400">HTML</span>
                            )}
                        </div>
                        <div className="font-semibold text-gray-900 text-sm mt-1">{item.title}</div>
                        {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: 'Mapel & Kelas',
            accessorKey: 'mapel' as keyof InteractiveMediaItem,
            cell: (item: InteractiveMediaItem) => (
                <div className="space-y-1">
                    <div className="text-xs font-semibold text-gray-800">{item.mapel}</div>
                    <div className="flex flex-wrap gap-1">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 font-medium">
                            {item.kelas && item.kelas !== 'Semua' ? `Kelas ${item.kelas}` : 'Semua Kelas'}
                        </span>
                        {item.semester && item.semester !== 'Semua' && (
                            <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                Smt {item.semester}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: 'Diunggah',
            accessorKey: 'created_at' as keyof InteractiveMediaItem,
            cell: (item: InteractiveMediaItem) => (
                <div className="text-xs text-gray-500">
                    <div>{formatDate(item.created_at)}</div>
                    {item.creator_name && (
                        <div className="text-[11px] text-gray-400 mt-0.5">{item.creator_name}</div>
                    )}
                </div>
            )
        },
        {
            header: 'Aksi',
            className: 'w-44 text-right',
            cell: (item: InteractiveMediaItem) => (
                <div className="flex items-center justify-end gap-2 pr-1">
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs"
                        onClick={() => {
                            setIsFullscreen(false);
                            setActiveItem(item);
                        }}
                    >
                        <Play className="w-3.5 h-3.5 mr-1.5" /> Jalankan
                    </Button>
                    <a
                        href={getFileUrl(item.file_url)}
                        download={item.file_name || `${item.title}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button
                            size="sm"
                            variant="outline"
                            className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 h-8 px-2.5"
                            title="Unduh File HTML"
                        >
                            <Download className="w-3.5 h-3.5" />
                        </Button>
                    </a>
                </div>
            )
        }
    ], []);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 text-sm">Memuat data media interaktif...</div>
                ) : (
                    <DataTable
                        data={filteredItems}
                        columns={columns}
                        searchKeys={['title', 'description', 'mapel', 'category']}
                        pageSize={12}
                        filterContent={
                            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value="all">Semua Kategori</option>
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                    value={filterMapel}
                                    onChange={(e) => setFilterMapel(e.target.value)}
                                >
                                    <option value="all">Semua Mapel</option>
                                    <option value="Informatika">Informatika</option>
                                    <option value="KKA">KKA</option>
                                    <option value="Umum">Umum</option>
                                </select>
                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                    value={filterKelas}
                                    onChange={(e) => setFilterKelas(e.target.value)}
                                >
                                    <option value="all">Semua Kelas</option>
                                    <option value="7">Kelas 7</option>
                                    <option value="8">Kelas 8</option>
                                    <option value="9">Kelas 9</option>
                                </select>
                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                    value={filterSemester}
                                    onChange={(e) => setFilterSemester(e.target.value)}
                                >
                                    <option value="all">Semua Smt</option>
                                    <option value="1">Semester 1</option>
                                    <option value="2">Semester 2</option>
                                </select>
                            </div>
                        }
                    />
                )}
            </div>

            {/* Interactive HTML Viewer Modal */}
            {activeItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 md:p-4">
                    <div
                        className={`bg-white flex flex-col overflow-hidden shadow-2xl border border-gray-200 transition-all ${
                            isFullscreen
                                ? 'w-screen h-screen rounded-none'
                                : 'w-full max-w-6xl h-[90vh] rounded-xl'
                        }`}
                    >
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
                            <div className="min-w-0 pr-4">
                                <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">
                                    {activeItem.title}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {activeItem.mapel} • {activeItem.kelas !== 'Semua' ? `Kelas ${activeItem.kelas}` : 'Semua Kelas'} • {activeItem.category}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href={getFileUrl(activeItem.file_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button size="sm" variant="outline" className="h-8 text-xs bg-white">
                                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Buka Tab Baru
                                    </Button>
                                </a>
                                <a
                                    href={getFileUrl(activeItem.file_url)}
                                    download={activeItem.file_name || `${activeItem.title}.html`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button size="sm" variant="outline" className="h-8 text-xs bg-white hidden sm:inline-flex">
                                        <Download className="w-3.5 h-3.5 mr-1.5" /> Unduh HTML
                                    </Button>
                                </a>
                                <button
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded-lg"
                                    title={isFullscreen ? 'Perkecil Tampilan' : 'Layar Penuh'}
                                >
                                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setActiveItem(null)}
                                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Tutup"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-white relative overflow-hidden">
                            <iframe
                                src={getFileUrl(activeItem.file_url)}
                                title={activeItem.title}
                                className="w-full h-full border-0"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

