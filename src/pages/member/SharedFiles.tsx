import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    FolderOpen,
    Plus,
    Download,
    Eye,
    Pencil,
    Trash2,
    FileText,
    FileSpreadsheet,
    Code2,
    Archive,
    Image as ImageIcon,
    File as FileIcon,
    X,
    ExternalLink,
    Maximize2,
    Minimize2,
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/DataTable';
import { FileViewer } from '../../components/ui/FileViewer';
import { sharedFileService, type SharedFileItem } from '../../services/sharedFileService';
import { authService } from '../../services/authService';
import { getFileUrl } from '../../lib/api';
import { formatDate } from '../../lib/utils';

const CATEGORIES = [
    'Modul/Bahan Ajar',
    'Soal',
    'Administrasi Guru',
    'Media HTML',
    'Lainnya'
];

function formatFileSize(bytes?: number) {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileGroupFromExt(ext?: string, fallbackType?: string): string {
    const cleanExt = (ext || '').toLowerCase().replace('.', '');
    if (cleanExt === 'pdf') return 'pdf';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'csv', 'rtf'].includes(cleanExt)) return 'office';
    if (['html', 'htm'].includes(cleanExt)) return 'html';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(cleanExt)) return 'archive';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(cleanExt)) return 'image';
    return fallbackType || 'other';
}

interface OutletContextType {
    setPageHeader?: (header: { title: string; description?: string; icon?: ReactNode }) => void;
}

interface CurrentUser {
    id: string;
    nama?: string;
    role?: string;
}

export function SharedFiles() {
    const { setPageHeader } = useOutletContext<OutletContextType>() || {};
    const [files, setFiles] = useState<SharedFileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    // Filter states
    const [filterOwner, setFilterOwner] = useState<'all' | 'mine'>('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterMapel, setFilterMapel] = useState('all');
    const [filterKelas, setFilterKelas] = useState('all');
    const [filterFileType, setFilterFileType] = useState('all');

    // Upload / Edit modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFile, setEditingFile] = useState<SharedFileItem | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Modul/Bahan Ajar',
        mapel: 'Informatika',
        kelas: 'Semua',
        file_url: '',
        file_name: '',
        file_type: 'other',
        file_ext: '',
        file_size: 0
    });

    // Preview modal state
    const [previewItem, setPreviewItem] = useState<SharedFileItem | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Berbagi File Anggota',
                description: 'Repositori berbagi perangkat ajar, soal, administrasi, dan media antar anggota MGMP.',
                icon: <FolderOpen className="w-6 h-6 text-blue-600" />
            });
        }
        authService.getCurrentUser().then(data => {
            if (data) setCurrentUser(data.profile || data.user);
        });
        loadFiles();
    }, [setPageHeader]);

    const loadFiles = async () => {
        setLoading(true);
        try {
            const data = await sharedFileService.getAll();
            setFiles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            const msg = error instanceof Error ? error.message : 'Gagal memuat daftar file';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const myFilesCount = useMemo(() => {
        if (!currentUser?.id) return 0;
        return files.filter(f => f.user_id === currentUser.id).length;
    }, [files, currentUser]);

    const filteredFiles = useMemo(() => {
        return files.filter(item => {
            if (filterOwner === 'mine' && currentUser?.id && item.user_id !== currentUser.id) {
                return false;
            }
            if (filterCategory !== 'all' && item.category !== filterCategory) {
                return false;
            }
            if (filterMapel !== 'all' && item.mapel !== filterMapel) {
                return false;
            }
            if (filterKelas !== 'all' && item.kelas !== filterKelas && item.kelas !== 'Semua') {
                return false;
            }
            if (filterFileType !== 'all') {
                const ext = item.file_ext || item.file_url.split('.').pop() || '';
                const group = getFileGroupFromExt(ext, item.file_type);
                if (group !== filterFileType) return false;
            }
            return true;
        });
    }, [files, filterOwner, filterCategory, filterMapel, filterKelas, filterFileType, currentUser]);

    const canManageFile = (item: SharedFileItem) => {
        if (!currentUser) return false;
        if (item.user_id === currentUser.id) return true;
        return ['Admin', 'Super Admin', 'Pengurus'].includes(currentUser.role || '');
    };

    const openUploadModal = () => {
        setEditingFile(null);
        setFormData({
            title: '',
            description: '',
            category: 'Modul/Bahan Ajar',
            mapel: 'Informatika',
            kelas: 'Semua',
            file_url: '',
            file_name: '',
            file_type: 'other',
            file_ext: '',
            file_size: 0
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: SharedFileItem) => {
        setEditingFile(item);
        const ext = item.file_ext || item.file_url.split('.').pop() || '';
        setFormData({
            title: item.title,
            description: item.description || '',
            category: item.category || 'Modul/Bahan Ajar',
            mapel: item.mapel || 'Informatika',
            kelas: item.kelas || 'Semua',
            file_url: item.file_url,
            file_name: item.file_name || item.file_url.split('/').pop() || '',
            file_type: getFileGroupFromExt(ext, item.file_type),
            file_ext: ext,
            file_size: Number(item.file_size || 0)
        });
        setIsModalOpen(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const res = await sharedFileService.uploadFile(file);
            const ext = (res.ext || file.name.split('.').pop() || '').toLowerCase();
            const group = getFileGroupFromExt(ext);
            const defaultTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

            setFormData(prev => ({
                ...prev,
                title: prev.title || defaultTitle,
                category: group === 'html' && prev.category === 'Modul/Bahan Ajar' ? 'Media HTML' : prev.category,
                file_url: res.url,
                file_name: res.original_name || file.name,
                file_type: group,
                file_ext: ext,
                file_size: res.size || file.size
            }));
            toast.success('File berhasil dipilih');
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengunggah file');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            toast.error('Judul file wajib diisi');
            return;
        }
        if (!formData.file_url) {
            toast.error('Silakan pilih file terlebih dahulu');
            return;
        }

        setSaving(true);
        try {
            if (editingFile) {
                await sharedFileService.update(editingFile.id, formData);
                toast.success('Data file diperbarui');
            } else {
                await sharedFileService.create(formData);
                toast.success('File berhasil dibagikan');
            }
            setIsModalOpen(false);
            loadFiles();
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Gagal menyimpan file';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item: SharedFileItem) => {
        if (!confirm(`Hapus file "${item.title}"?`)) return;
        try {
            await sharedFileService.delete(item.id);
            toast.success('File berhasil dihapus');
            loadFiles();
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Gagal menghapus file';
            toast.error(msg);
        }
    };

    const renderFileIcon = (item: SharedFileItem) => {
        const ext = (item.file_ext || item.file_url.split('.').pop() || '').toLowerCase();
        const group = getFileGroupFromExt(ext, item.file_type);

        if (group === 'pdf') {
            return (
                <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-red-600" />
                </div>
            );
        }
        if (group === 'html') {
            return (
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Code2 className="w-5 h-5 text-indigo-600" />
                </div>
            );
        }
        if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
            return (
                <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                </div>
            );
        }
        if (group === 'office') {
            return (
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                </div>
            );
        }
        if (group === 'archive') {
            return (
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                    <Archive className="w-5 h-5 text-amber-600" />
                </div>
            );
        }
        if (group === 'image') {
            return (
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-emerald-600" />
                </div>
            );
        }
        return (
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                <FileIcon className="w-5 h-5 text-gray-600" />
            </div>
        );
    };

    const columns = [
        {
            header: 'Nama File',
            accessorKey: 'title' as keyof SharedFileItem,
            cell: (item: SharedFileItem) => {
                const ext = (item.file_ext || item.file_url.split('.').pop() || '').toUpperCase();
                return (
                    <div className="flex items-start gap-3 py-0.5">
                        {renderFileIcon(item)}
                        <div className="min-w-0">
                            <div className="font-semibold text-gray-900 text-sm">{item.title}</div>
                            {item.description && (
                                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                                {ext && (
                                    <span className="font-mono font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                        {ext}
                                    </span>
                                )}
                                {item.file_size ? <span>{formatFileSize(Number(item.file_size))}</span> : null}
                                {item.file_name && (
                                    <span className="truncate max-w-[180px] hidden sm:inline">• {item.file_name}</span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Kategori & Mapel',
            accessorKey: 'category' as keyof SharedFileItem,
            cell: (item: SharedFileItem) => (
                <div className="space-y-1">
                    <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {item.category}
                    </span>
                    <div className="text-xs text-gray-600">
                        <span className="font-medium text-gray-800">{item.mapel}</span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span>{item.kelas && item.kelas !== 'Semua' ? `Kelas ${item.kelas}` : 'Semua Kelas'}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Pengunggah',
            accessorKey: 'uploader_name' as keyof SharedFileItem,
            cell: (item: SharedFileItem) => (
                <div className="text-xs">
                    <div className="font-medium text-gray-800">{item.uploader_name || 'Anggota'}</div>
                    {item.uploader_school && (
                        <div className="text-[11px] text-gray-500 truncate max-w-[180px]">{item.uploader_school}</div>
                    )}
                    <div className="text-[11px] text-gray-400 mt-0.5">{formatDate(item.created_at)}</div>
                </div>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right w-44',
            cell: (item: SharedFileItem) => {
                const ext = (item.file_ext || item.file_url.split('.').pop() || '').toLowerCase();
                const group = getFileGroupFromExt(ext, item.file_type);
                const canPreview = ['pdf', 'html', 'office', 'image'].includes(group);

                return (
                    <div className="flex items-center justify-end gap-1.5">
                        {canPreview && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-xs bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                onClick={() => {
                                    setIsFullscreen(false);
                                    setPreviewItem(item);
                                }}
                                title={group === 'html' ? 'Jalankan HTML' : 'Lihat Pratinjau'}
                            >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                {group === 'html' ? 'Buka' : 'Lihat'}
                            </Button>
                        )}
                        <a
                            href={getFileUrl(item.file_url)}
                            download={item.file_name || item.title}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => sharedFileService.recordDownload(item.id)}
                        >
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-xs bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                                title="Unduh File"
                            >
                                <Download className="w-3.5 h-3.5" />
                            </Button>
                        </a>
                        {canManageFile(item) && (
                            <>
                                <button
                                    onClick={() => openEditModal(item)}
                                    className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                                    title="Edit File"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(item)}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Hapus File"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-4">
            {/* Top Bar: Owner Filter Tabs + Upload Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFilterOwner('all')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            filterOwner === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Semua File ({files.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterOwner('mine')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            filterOwner === 'mine'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        File Saya ({myFilesCount})
                    </button>
                </div>

                <Button
                    size="sm"
                    onClick={openUploadModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-9"
                >
                    <Plus className="w-4 h-4 mr-1.5" /> Unggah File
                </Button>
            </div>

            {/* DataTable with Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 text-sm">Memuat daftar file...</div>
                ) : (
                    <DataTable
                        data={filteredFiles}
                        columns={columns}
                        searchKeys={['title', 'description', 'uploader_name', 'uploader_school', 'category', 'file_name']}
                        pageSize={12}
                        filterContent={
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value="all">Semua Kategori</option>
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>

                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filterMapel}
                                    onChange={(e) => setFilterMapel(e.target.value)}
                                >
                                    <option value="all">Semua Mapel</option>
                                    <option value="Informatika">Informatika</option>
                                    <option value="KKA">KKA</option>
                                    <option value="Umum">Umum</option>
                                </select>

                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filterKelas}
                                    onChange={(e) => setFilterKelas(e.target.value)}
                                >
                                    <option value="all">Semua Kelas</option>
                                    <option value="7">Kelas 7</option>
                                    <option value="8">Kelas 8</option>
                                    <option value="9">Kelas 9</option>
                                </select>

                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filterFileType}
                                    onChange={(e) => setFilterFileType(e.target.value)}
                                >
                                    <option value="all">Semua Tipe File</option>
                                    <option value="pdf">PDF</option>
                                    <option value="office">Word / Excel / PPT</option>
                                    <option value="html">File HTML</option>
                                    <option value="archive">ZIP / RAR</option>
                                    <option value="image">Gambar</option>
                                </select>
                            </div>
                        }
                    />
                )}
            </div>

            {/* Upload / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-xl border border-gray-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">
                                {editingFile ? 'Edit Data File' : 'Unggah File Bersama'}
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
                                    Pilih File <span className="text-red-500">*</span>
                                </label>
                                <div className="border border-gray-300 border-dashed rounded-lg p-3.5 bg-gray-50">
                                    <input
                                        type="file"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-200 file:text-xs file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1.5">
                                        Mendukung PDF, Word, Excel, PPT, HTML, ZIP/RAR, atau Gambar.
                                    </p>
                                    {uploading && (
                                        <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah file...
                                        </div>
                                    )}
                                    {formData.file_url && !uploading && (
                                        <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2.5 py-1.5 flex items-center justify-between">
                                            <span className="truncate font-medium">
                                                {formData.file_name || formData.file_url.split('/').pop()}
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
                                    Judul File <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: Latihan Soal STS Informatika Kelas 7"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Keterangan Singkat <span className="text-gray-400 font-normal">(Opsional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Tambahkan deskripsi atau catatan singkat mengenai file ini..."
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
                                    disabled={saving || uploading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {saving ? 'Menyimpan...' : editingFile ? 'Simpan Perubahan' : 'Bagikan File'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 md:p-4">
                    <div
                        className={`bg-white flex flex-col overflow-hidden shadow-2xl border border-gray-200 transition-all ${
                            isFullscreen
                                ? 'w-screen h-screen rounded-none'
                                : 'w-full max-w-5xl h-[90vh] rounded-xl'
                        }`}
                    >
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
                            <div className="min-w-0 pr-4">
                                <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">
                                    {previewItem.title}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {previewItem.category} • {previewItem.mapel} • Oleh {previewItem.uploader_name || 'Anggota'}
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
                                <a
                                    href={getFileUrl(previewItem.file_url)}
                                    download={previewItem.file_name || previewItem.title}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => sharedFileService.recordDownload(previewItem.id)}
                                >
                                    <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                                        <Download className="w-3.5 h-3.5 mr-1.5" /> Unduh
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

                        <div className="flex-1 bg-gray-100 overflow-hidden relative">
                            <FileViewer
                                url={previewItem.file_url}
                                title={previewItem.title}
                                className="h-full border-0 rounded-none"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

