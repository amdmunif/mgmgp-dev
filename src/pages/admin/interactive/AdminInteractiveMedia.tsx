import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Code2, Play, Pencil, Trash2, X, ExternalLink, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../../components/ui/button';
import { DataTable } from '../../../components/ui/DataTable';
import { interactiveMediaService, type InteractiveMediaItem } from '../../../services/interactiveMediaService';
import { getFileUrl } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';

const CATEGORIES = [
    'Simulasi',
    'Visualisasi Materi',
    'Kuis Interaktif',
    'Game Edukasi',
    'Alat Bantu Ajar',
    'Lainnya'
];

function formatFileSize(bytes?: number) {
    if (!bytes || bytes <= 0) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface OutletContextType {
    setPageHeader?: (header: { title: string; description?: string; icon?: ReactNode }) => void;
}

export function AdminInteractiveMedia() {
    const { setPageHeader } = useOutletContext<OutletContextType>() || {};
    const [items, setItems] = useState<InteractiveMediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filterMapel, setFilterMapel] = useState('all');
    const [filterKelas, setFilterKelas] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');

    // Modal form states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InteractiveMediaItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        mapel: 'Informatika',
        kelas: 'Semua',
        semester: 'Semua',
        category: 'Simulasi',
        file_url: '',
        file_name: '',
        file_size: 0
    });

    // Preview modal state
    const [previewItem, setPreviewItem] = useState<InteractiveMediaItem | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Media Pembelajaran Interaktif',
                description: 'Kelola file media interaktif berbasis HTML untuk anggota.',
                icon: <Code2 className="w-6 h-6" />
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
            toast.error('Gagal memuat daftar media interaktif');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchMapel = filterMapel === 'all' || item.mapel === filterMapel;
            const matchKelas = filterKelas === 'all' || item.kelas === filterKelas;
            const matchCat = filterCategory === 'all' || item.category === filterCategory;
            return matchMapel && matchKelas && matchCat;
        });
    }, [items, filterMapel, filterKelas, filterCategory]);

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({
            title: '',
            description: '',
            mapel: 'Informatika',
            kelas: 'Semua',
            semester: 'Semua',
            category: 'Simulasi',
            file_url: '',
            file_name: '',
            file_size: 0
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: InteractiveMediaItem) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            description: item.description || '',
            mapel: item.mapel || 'Informatika',
            kelas: item.kelas || 'Semua',
            semester: item.semester || 'Semua',
            category: item.category || 'Simulasi',
            file_url: item.file_url,
            file_name: item.file_name || item.file_url.split('/').pop() || '',
            file_size: Number(item.file_size || 0)
        });
        setIsModalOpen(true);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'html' && ext !== 'htm') {
            toast.error('Mohon pilih file dengan format .html atau .htm');
            e.target.value = '';
            return;
        }

        setUploadingFile(true);
        try {
            const res = await interactiveMediaService.uploadHtmlFile(file);
            const cleanName = file.name.replace(/\.(html|htm)$/i, '').replace(/[-_]/g, ' ');
            setFormData(prev => ({
                ...prev,
                title: prev.title || cleanName,
                file_url: res.url,
                file_name: res.original_name || file.name,
                file_size: res.size || file.size
            }));
            toast.success('File HTML berhasil diunggah');
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengunggah file HTML');
        } finally {
            setUploadingFile(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            toast.error('Judul media wajib diisi');
            return;
        }
        if (!formData.file_url) {
            toast.error('Silakan pilih dan unggah file HTML terlebih dahulu');
            return;
        }

        setSaving(true);
        try {
            if (editingItem) {
                await interactiveMediaService.update(editingItem.id, formData);
                toast.success('Media interaktif diperbarui');
            } else {
                await interactiveMediaService.create(formData);
                toast.success('Media interaktif berhasil ditambahkan');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Gagal menyimpan media interaktif';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item: InteractiveMediaItem) => {
        if (!confirm(`Hapus media "${item.title}"?`)) return;
        try {
            await interactiveMediaService.delete(item.id);
            toast.success('Media interaktif dihapus');
            loadData();
        } catch {
            toast.error('Gagal menghapus media');
        }
    };

    const columns = [
        {
            header: 'Judul Media',
            accessorKey: 'title' as keyof InteractiveMediaItem,
            cell: (item: InteractiveMediaItem) => (
                <div className="py-0.5">
                    <div className="font-semibold text-gray-900">{item.title}</div>
                    {item.description && (
                        <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</div>
                    )}
                    <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-2">
                        <span>{item.file_name || item.file_url.split('/').pop()}</span>
                        {item.file_size ? <span>• {formatFileSize(Number(item.file_size))}</span> : null}
                    </div>
                </div>
            )
        },
        {
            header: 'Kategori',
            accessorKey: 'category' as keyof InteractiveMediaItem,
            cell: (item: InteractiveMediaItem) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {item.category || 'Simulasi'}
                </span>
            )
        },
        {
            header: 'Mapel & Kelas',
            accessorKey: 'mapel' as keyof InteractiveMediaItem,
            cell: (item: InteractiveMediaItem) => (
                <div className="text-xs space-y-1">
                    <div className="font-medium text-gray-800">{item.mapel}</div>
                    <div className="text-gray-500">
                        {item.kelas && item.kelas !== 'Semua' ? `Kelas ${item.kelas}` : 'Semua Kelas'}
                        {item.semester && item.semester !== 'Semua' ? ` • Smt ${item.semester}` : ''}
                    </div>
                </div>
            )
        },
        {
            header: 'Tanggal',
            accessorKey: 'created_at' as keyof InteractiveMediaItem,
            cell: (item: InteractiveMediaItem) => (
                <div className="text-xs text-gray-500">
                    <div>{formatDate(item.created_at)}</div>
                    <div className="text-[11px] text-gray-400">Oleh {item.creator_name || 'Admin'}</div>
                </div>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right w-40',
            cell: (item: InteractiveMediaItem) => (
                <div className="flex items-center justify-end gap-1.5">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                        onClick={() => {
                            setIsFullscreen(false);
                            setPreviewItem(item);
                        }}
                        title="Jalankan Media"
                    >
                        <Play className="w-3.5 h-3.5 mr-1" /> Jalankan
                    </Button>
                    <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                        title="Edit"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Hapus"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {loading ? (
                <div className="flex justify-center p-12 bg-white rounded-xl border border-gray-200">
                    <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                </div>
            ) : (
                <DataTable
                    data={filteredItems}
                    columns={columns}
                    searchKeys={['title', 'description', 'mapel', 'category']}
                    pageSize={10}
                    filterContent={
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                className="rounded-lg border border-gray-200 py-1.5 px-3 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="all">Semua Kategori</option>
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <select
                                className="rounded-lg border border-gray-200 py-1.5 px-3 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={filterMapel}
                                onChange={(e) => setFilterMapel(e.target.value)}
                            >
                                <option value="all">Semua Mapel</option>
                                <option value="Informatika">Informatika</option>
                                <option value="KKA">KKA</option>
                                <option value="Umum">Umum</option>
                            </select>
                            <select
                                className="rounded-lg border border-gray-200 py-1.5 px-3 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={filterKelas}
                                onChange={(e) => setFilterKelas(e.target.value)}
                            >
                                <option value="all">Semua Kelas</option>
                                <option value="7">Kelas 7</option>
                                <option value="8">Kelas 8</option>
                                <option value="9">Kelas 9</option>
                            </select>
                            <Button
                                size="sm"
                                onClick={openCreateModal}
                                className="bg-blue-600 hover:bg-blue-700 text-white h-9"
                            >
                                <Plus className="w-4 h-4 mr-1.5" /> Unggah HTML
                            </Button>
                        </div>
                    }
                />
            )}

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-xl border border-gray-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">
                                {editingItem ? 'Edit Media Interaktif' : 'Unggah Media Interaktif (HTML)'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    File HTML <span className="text-red-500">*</span>
                                </label>
                                <div className="border border-gray-300 border-dashed rounded-lg p-3.5 bg-gray-50">
                                    <input
                                        type="file"
                                        accept=".html,.htm,text/html"
                                        onChange={handleFileSelect}
                                        disabled={uploadingFile}
                                        className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-200 file:text-xs file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
                                    />
                                    {uploadingFile && (
                                        <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah file...
                                        </div>
                                    )}
                                    {formData.file_url && !uploadingFile && (
                                        <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2.5 py-1.5 flex items-center justify-between">
                                            <span className="truncate font-medium">
                                                Terpilih: {formData.file_name || formData.file_url.split('/').pop()}
                                            </span>
                                            {formData.file_size > 0 && (
                                                <span className="text-green-600 shrink-0 ml-2">
                                                    ({formatFileSize(formData.file_size)})
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Judul Media <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: Simulasi Konversi Bilangan Biner"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                                    <select
                                        value={formData.mapel}
                                        onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Informatika">Informatika</option>
                                        <option value="KKA">KKA</option>
                                        <option value="Umum">Umum</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                                    <select
                                        value={formData.kelas}
                                        onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Semua">Semua Kelas</option>
                                        <option value="7">Kelas 7</option>
                                        <option value="8">Kelas 8</option>
                                        <option value="9">Kelas 9</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Semua">Semua Semester</option>
                                        <option value="1">Semester 1 (Ganjil)</option>
                                        <option value="2">Semester 2 (Genap)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Keterangan / Petunjuk Singkat <span className="text-gray-400 font-normal">(Opsional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Catatan penggunaan atau ringkasan materi..."
                                />
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-white"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving || uploadingFile}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {saving ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Simpan Media'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Interactive HTML Player Modal */}
            {previewItem && (
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
                                    {previewItem.title}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {previewItem.mapel} • {previewItem.kelas !== 'Semua' ? `Kelas ${previewItem.kelas}` : 'Semua Kelas'} • {previewItem.category}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href={getFileUrl(previewItem.file_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button size="sm" variant="outline" className="h-8 text-xs bg-white">
                                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Tab Baru
                                    </Button>
                                </a>
                                <button
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded-lg"
                                    title={isFullscreen ? 'Perkecil' : 'Layar Penuh'}
                                >
                                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setPreviewItem(null)}
                                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Tutup"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-white relative overflow-hidden">
                            <iframe
                                src={getFileUrl(previewItem.file_url)}
                                title={previewItem.title}
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

