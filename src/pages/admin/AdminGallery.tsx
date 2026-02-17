import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Trash2, Loader2, Camera, X, Image as ImageIcon } from 'lucide-react';
import { galleryService } from '../../services/galleryService';
import type { GalleryImage } from '../../services/galleryService';
import { toast } from 'react-hot-toast';
import { api, getFileUrl } from '../../lib/api';
import { Button } from '../../components/ui/button';

export function AdminGallery() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newImage, setNewImage] = useState({ image_url: '', caption: '', event_id: '' });

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Manajemen Galeri',
                description: 'Kelola koleksi foto kegiatan MGMP.',
                icon: <ImageIcon className="w-6 h-6" />
            });
        }
        fetchImages();
    }, [setPageHeader]);

    const fetchImages = async () => {
        try {
            const data = await galleryService.getAll();
            setImages(data);
        } catch (error) {
            toast.error('Gagal mengambil data galeri');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post<any>('/upload', formData);
            setNewImage({ ...newImage, image_url: res.url });
            toast.success('Gambar berhasil diunggah');
        } catch (error) {
            toast.error('Gagal mengunggah gambar');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newImage.image_url) return toast.error('Silakan unggah gambar terlebih dahulu');

        try {
            await api.post('/gallery', newImage);
            toast.success('Gambar ditambahkan ke galeri');
            setIsAddModalOpen(false);
            setNewImage({ image_url: '', caption: '', event_id: '' });
            fetchImages();
        } catch (error) {
            toast.error('Gagal menambahkan ke galeri');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus gambar ini dari galeri?')) return;
        try {
            await api.delete(`/gallery/${id}`);
            toast.success('Gambar dihapus');
            setImages(images.filter(img => img.id !== id));
        } catch (error) {
            toast.error('Gagal menghapus gambar');
        }
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
            <div className="flex items-center justify-end">
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Foto
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {images.map((image) => (
                    <div key={image.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                        <img
                            src={getFileUrl(image.image_url)}
                            alt={image.caption}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                            <p className="text-white text-sm font-medium mb-4 line-clamp-2">{image.caption}</p>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => image.id && handleDelete(image.id)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Hapus
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">Tambah Foto Baru</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Gambar</label>
                                <div className="relative group aspect-video rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors overflow-hidden flex flex-col items-center justify-center">
                                    {newImage.image_url ? (
                                        <>
                                            <img src={getFileUrl(newImage.image_url)} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button type="button" size="sm" variant="outline" className="bg-white" onClick={() => setNewImage({ ...newImage, image_url: '' })}>
                                                    Ganti Gambar
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-xs text-gray-500">Klik untuk unggah foto</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Caption / Keterangan</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={newImage.caption}
                                    onChange={(e) => setNewImage({ ...newImage, caption: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Tulis keterangan foto..."
                                />
                            </div>
                            <div className="pt-2">
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-10 rounded-xl">
                                    Simpan ke Galeri
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
