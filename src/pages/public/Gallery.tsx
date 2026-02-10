import { useState, useEffect } from 'react';
import { getFileUrl } from '../../lib/api';
import { galleryService, type GalleryImage } from '../../services/galleryService';
import { Loader2, Image as ImageIcon } from 'lucide-react';

export function Gallery() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const data = await galleryService.getAll();
                setImages(data);
            } catch (error) {
                console.error('Error fetching gallery:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGallery();
    }, []);

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900">Galeri Kegiatan</h1>
                <p className="text-gray-500 mt-2">Dokumentasi berbagai kegiatan MGMP Informatika Wonosobo.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            ) : images.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Belum ada foto dalam galeri.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((item) => (
                        <div
                            key={item.id}
                            className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
                        >
                            <img
                                src={getFileUrl(item.image_url)}
                                alt={item.caption}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <p className="text-white text-sm font-medium line-clamp-2">{item.caption}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
