import { useState, useEffect } from 'react';
import { api, getFileUrl } from '../../lib/api';
import { Maximize2, X, Loader2, Image as ImageIcon } from 'lucide-react';
import type { Event } from '../../types';

export function Gallery() {
    const [images, setImages] = useState<{ id: string, url: string, caption: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<{ id: string, url: string, caption: string } | null>(null);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                // Since no gallery table, we use images from events
                const events = await api.get<Event[]>('/events');
                const galleryItems = events
                    .filter(e => e.image_url)
                    .map(e => ({
                        id: e.id,
                        url: getFileUrl(e.image_url),
                        caption: e.title
                    }));
                setImages(galleryItems);
            } catch (error) {
                console.error('Error fetching gallery:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGallery();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900">Galeri Kegiatan</h1>
                <p className="text-gray-500 mt-2">Dokumentasi momen-momen kegiatan MGMP Informatik Wonosobo.</p>
            </div>

            {images.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Belum ada foto kegiatan tersedia.</p>
                </div>
            ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {images.map((item) => (
                        <div key={item.id} className="relative group break-inside-avoid rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-white cursor-pointer" onClick={() => setSelectedImage(item)}>
                            <img src={item.url} alt={item.caption} className="w-full h-auto" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                <p className="text-white font-medium text-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{item.caption}</p>
                                <div className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors backdrop-blur-sm">
                                    <Maximize2 className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 transition-colors z-50 bg-black/20 rounded-full"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <div className="relative max-w-5xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
                        <img
                            src={selectedImage.url}
                            alt={selectedImage.caption}
                            className="w-full h-full object-contain rounded-lg shadow-2xl"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white rounded-b-lg">
                            <p className="text-lg font-medium text-center">{selectedImage.caption}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
