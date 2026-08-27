import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Loader2, Camera, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { projectService } from '../../services/projectService';
import type { MemberProject } from '../../services/projectService';
import { toast } from 'react-hot-toast';
import { api, getFileUrl } from '../../lib/api';
import { Button } from '../../components/ui/button';

export function MemberProjects() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [projects, setProjects] = useState<MemberProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: '', description: '', link_url: '', image_url: '' });

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Karya Saya',
                description: 'Kelola portofolio dan karya inovatif Anda.',
                icon: <Camera className="w-6 h-6" />
            });
        }
        fetchProjects();
    }, [setPageHeader]);

    const fetchProjects = async () => {
        try {
            const data = await projectService.getMyProjects();
            setProjects(data);
        } catch (error) {
            toast.error('Gagal mengambil data karya');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await api.post<any>('/upload', uploadData);
            setFormData({ ...formData, image_url: res.url });
            toast.success('Gambar berhasil diunggah');
        } catch (error) {
            toast.error('Gagal mengunggah gambar');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await projectService.update(editingId, formData);
                toast.success('Karya berhasil diperbarui');
            } else {
                await projectService.create(formData);
                toast.success('Karya berhasil ditambahkan');
            }
            setIsModalOpen(false);
            fetchProjects();
        } catch (error) {
            toast.error('Terjadi kesalahan saat menyimpan karya');
        }
    };

    const handleEdit = (project: MemberProject) => {
        setFormData({
            title: project.title,
            description: project.description || '',
            link_url: project.link_url,
            image_url: project.image_url || ''
        });
        setEditingId(project.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus karya ini?')) return;
        try {
            await projectService.delete(id);
            toast.success('Karya berhasil dihapus');
            fetchProjects();
        } catch (error) {
            toast.error('Gagal menghapus karya');
        }
    };

    const openModal = () => {
        setFormData({ title: '', description: '', link_url: '', image_url: '' });
        setEditingId(null);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div>
                    <h2 className="font-semibold text-blue-900">Portofolio Karya</h2>
                    <p className="text-sm text-blue-700/80">Karya yang diunggah akan divalidasi sebelum tampil di halaman publik.</p>
                </div>
                <Button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                    <Plus className="w-4 h-4 mr-2" /> Unggah Karya
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <div key={project.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                        {project.image_url ? (
                            <div className="aspect-video relative overflow-hidden bg-gray-50 border-b border-gray-100">
                                <img 
                                    src={getFileUrl(project.image_url)} 
                                    alt={project.title} 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm backdrop-blur-md ${
                                        project.status === 'approved' ? 'bg-green-100/90 text-green-700 border border-green-200' :
                                        project.status === 'rejected' ? 'bg-red-100/90 text-red-700 border border-red-200' :
                                        'bg-yellow-100/90 text-yellow-700 border border-yellow-200'
                                    }`}>
                                        {project.status === 'approved' ? 'Disetujui' : project.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-video bg-gradient-to-br from-blue-50 text-blue-200 to-indigo-50 border-b border-gray-100 flex items-center justify-center relative">
                                <Camera className="w-12 h-12" />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm backdrop-blur-md ${
                                        project.status === 'approved' ? 'bg-green-100/90 text-green-700 border border-green-200' :
                                        project.status === 'rejected' ? 'bg-red-100/90 text-red-700 border border-red-200' :
                                        'bg-yellow-100/90 text-yellow-700 border border-yellow-200'
                                    }`}>
                                        {project.status === 'approved' ? 'Disetujui' : project.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{project.title}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{project.description}</p>
                            
                            <a href={project.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 flex items-center hover:underline text-sm font-medium mb-4">
                                Kunjungi Link <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                            
                            <div className="pt-4 border-t border-gray-100">
                                <Button 
                                    onClick={() => handleEdit(project)} 
                                    variant="outline" 
                                    className="w-full h-9 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                                >
                                    <Edit2 className="w-4 h-4 mr-2" /> Kelola Karya
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {projects.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                        <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-700 mb-1">Belum ada karya</h3>
                        <p className="text-gray-500 mb-6">Mulai unggah karya inovatif Anda sekarang!</p>
                        <Button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                            <Plus className="w-4 h-4 mr-2" /> Unggah Karya Pertama
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal Upload/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-gray-900">{editingId ? 'Edit Karya' : 'Unggah Karya Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Gambar/Thumbnail</label>
                                    <div className="relative group aspect-video rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors overflow-hidden flex flex-col items-center justify-center">
                                        {formData.image_url ? (
                                            <>
                                                <img src={getFileUrl(formData.image_url)} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button type="button" size="sm" variant="outline" className="bg-white" onClick={() => setFormData({ ...formData, image_url: '' })}>
                                                        Ganti Gambar
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-6">
                                                <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-xs text-gray-500 font-medium mb-1">Klik untuk unggah thumbnail</p>
                                                <p className="text-[10px] text-gray-400">Rekomendasi rasio 16:9 (Opsional)</p>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Judul Karya <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Contoh: Aplikasi Pembelajaran Interaktif"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Link URL <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="url"
                                        value={formData.link_url}
                                        onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Deskripsi (Opsional)</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Jelaskan secara singkat tentang karya ini..."
                                    />
                                </div>
                            </div>
                            <div className="p-4 px-6 border-t border-gray-100 shrink-0 bg-gray-50 flex gap-3">
                                {editingId && (
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => handleDelete(editingId)} 
                                        className="h-10 px-3 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white h-10">
                                    Batal
                                </Button>
                                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10">
                                    {editingId ? 'Simpan Perubahan' : 'Unggah Karya'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
