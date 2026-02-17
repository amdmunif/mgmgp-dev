import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Plus, FileText, Presentation, File, Book, Eye, Pencil, Trash2, X } from 'lucide-react';
import { learningService } from '../../../services/learningService';
import type { LearningMaterial, MaterialType } from '../../../types';
import { formatDate } from '../../../lib/utils';
import { DataTable } from '../../../components/ui/DataTable';

import { FileViewer } from '../../../components/ui/FileViewer';

export function AdminMaterials() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [materials, setMaterials] = useState<LearningMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<MaterialType | 'all'>('all');
    const [search, setSearch] = useState('');
    const [viewingMaterial, setViewingMaterial] = useState<LearningMaterial | null>(null);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Perangkat Ajar',
                description: 'Kelola Modul Ajar, Bahan Bacaan, dan Slide Presentasi.',
                icon: <Book className="w-6 h-6" />
            });
        }
    }, [setPageHeader]);

    useEffect(() => {
        loadMaterials();
    }, [filterType]);

    const loadMaterials = async () => {
        setLoading(true);
        try {
            const type = filterType === 'all' ? undefined : filterType;
            const data = await learningService.getAll(type);
            setMaterials(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;
        try {
            await learningService.delete(id);
            loadMaterials();
        } catch (error) {
            console.error(error);
            alert('Gagal menghapus materi');
        }
    };

    const getIcon = (type: MaterialType) => {
        switch (type) {
            case 'rpp': return <File className="w-5 h-5 text-orange-500" />;
            case 'slide': return <Presentation className="w-5 h-5 text-purple-500" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.mapel.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            header: "Materi",
            accessorKey: "title" as keyof LearningMaterial,
            cell: (item: LearningMaterial) => (
                <div>
                    <div className="font-bold text-gray-900 text-base">{item.title}</div>
                    {item.is_premium && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800 mt-1 uppercase tracking-wide">Premium</span>}
                </div>
            )
        },
        {
            header: "Tipe",
            accessorKey: "type" as keyof LearningMaterial,
            cell: (item: LearningMaterial) => (
                <div className="flex items-center gap-2 bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                    {getIcon(item.type)}
                    <span className="capitalize font-medium text-gray-700">{item.type.toUpperCase()}</span>
                </div>
            )
        },
        {
            header: "Mapel / Kelas",
            accessorKey: "mapel" as keyof LearningMaterial,
            cell: (item: LearningMaterial) => (
                <div>
                    <div className="text-gray-900 font-medium">{item.mapel}</div>
                    {item.kelas && <div className="text-xs text-gray-500 font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded w-fit mt-1">Kelas {item.kelas}</div>}
                </div>
            )
        },
        {
            header: "Tanggal Dibuat",
            accessorKey: "created_at" as keyof LearningMaterial,
            cell: (item: LearningMaterial) => (
                <div className="text-gray-500 text-xs">
                    {formatDate(item.created_at)}
                </div>
            )
        },
        {
            header: "Aksi",
            cell: (item: LearningMaterial) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => setViewingMaterial(item)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors"
                        title="Lihat Detail"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <Link
                        to={`/admin/learning/edit/${item.id}`}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-green-600 transition-colors"
                        title="Edit Materi"
                    >
                        <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600 transition-colors"
                        title="Hapus Materi"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
            className: "text-right"
        }
    ];

    return (
        <div className="space-y-6">


            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <DataTable
                    data={filteredMaterials}
                    columns={columns}
                    searchKeys={['title', 'mapel']}
                    searchValue={search}
                    onSearchChange={setSearch}
                    pageSize={10}
                    filterContent={
                        <div className="flex items-center gap-2">
                            <select
                                className="w-full md:w-auto rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                            >
                                <option value="all">Semua Tipe</option>
                                <option value="rpp">Modul Ajar</option>
                                <option value="slide">Slide Presentasi</option>
                                <option value="modul">Bahan Bacaan / E-Book</option>
                            </select>
                            <Link to="/admin/learning/create">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 h-9">
                                    <Plus className="w-4 h-4 mr-1" /> Tambah
                                </Button>
                            </Link>
                        </div>
                    }
                />
            )}

            {/* View Modal */}
            {viewingMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                {getIcon(viewingMaterial.type)}
                                {viewingMaterial.title}
                            </h3>
                            <button onClick={() => setViewingMaterial(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Tipe</p>
                                    <p className="font-bold text-gray-900 uppercase">{viewingMaterial.type}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Mapel</p>
                                    <p className="font-bold text-gray-900">{viewingMaterial.mapel}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Kelas</p>
                                    <p className="font-bold text-gray-900">{viewingMaterial.kelas || '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Semester</p>
                                    <p className="font-bold text-gray-900">{viewingMaterial.semester || '-'}</p>
                                </div>
                            </div>

                            {viewingMaterial.content && (
                                <div className="space-y-2">
                                    <h4 className="font-bold text-gray-900 text-sm">Konten / Deskripsi:</h4>
                                    <div
                                        className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-xl border border-gray-100"
                                        dangerouslySetInnerHTML={{ __html: viewingMaterial.content }}
                                    />
                                </div>
                            )}

                            {viewingMaterial.file_url && (
                                <div className="space-y-2">
                                    <h4 className="font-bold text-gray-900 text-sm">Pratinjau Materi:</h4>
                                    <div className="h-[400px] w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                        <FileViewer
                                            url={viewingMaterial.file_url}
                                            title={viewingMaterial.title}
                                            className="h-full border-0"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-50 flex justify-end">
                            <Button onClick={() => setViewingMaterial(null)}>Tutup</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
