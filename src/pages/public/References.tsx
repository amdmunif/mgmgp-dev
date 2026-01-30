import { useState, useEffect } from 'react';
import { Book, Globe, Gamepad2, ExternalLink, Search } from 'lucide-react';
import { referenceService } from '../../services/resourcesService';
import type { Reference } from '../../types';

export function References() {
    const [refs, setRefs] = useState<Reference[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await referenceService.getAll();
            setRefs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Buku': return <Book className="w-6 h-6 text-blue-500" />;
            case 'Simulator': return <Globe className="w-6 h-6 text-green-500" />;
            case 'Game': return <Gamepad2 className="w-6 h-6 text-purple-500" />;
            default: return <Book className="w-6 h-6" />;
        }
    };

    const filteredRefs = refs.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Bank Referensi</h1>
                <p className="text-gray-500 mt-2">Buku digital, simulator interaktif, dan game edukasi terkurasi.</p>
            </div>

            <div className="max-w-md mx-auto mb-10 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Cari referensi (Buku, Simulator)..."
                    className="pl-12 w-full rounded-full border border-gray-200 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-gray-500">Memuat referensi...</div>
                ) : filteredRefs.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl">
                        <Book className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Belum ada referensi tersedia.</p>
                    </div>
                ) : (
                    refs.map((item) => (
                        <a
                            key={item.id}
                            href={item.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all group block"
                        >
                            <div className="aspect-video bg-gray-100 relative overflow-hidden flex items-center justify-center">
                                {item.cover_image ? (
                                    <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                    getIcon(item.type)
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <ExternalLink className="w-8 h-8 text-white drop-shadow-md" />
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase">{item.type}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">{item.title}</h3>
                                {item.description && <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>}
                            </div>
                        </a>
                    ))
                )}
            </div>
        </div>
    );
}
