import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Search, Newspaper, Tag, Calendar } from 'lucide-react';
import { contentManagementService } from '../../../services/contentManagementService';
import type { NewsArticle } from '../../../types';
import { Link } from 'react-router-dom';

export function AdminNews() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await contentManagementService.getAllNews();
            setNews(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus berita ini?')) return;
        try {
            await contentManagementService.deleteNews(id);
            loadData();
        } catch (error) {
            alert('Gagal menghapus');
        }
    };

    const filteredNews = news.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Berita</h1>
                    <p className="text-gray-500">Publikasikan informasi dan pengumuman terbaru.</p>
                </div>
                <Link to="/admin/news/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"><Plus className="w-4 h-4 mr-2" /> Tulis Berita</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari judul berita..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-500">Berita</th>
                            <th className="px-6 py-4 font-semibold text-gray-500">Kategori & Waktu</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && <tr><td colSpan={3} className="p-8 text-center text-gray-500">Loading...</td></tr>}
                        {!loading && filteredNews.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-gray-500">Belum ada berita.</td></tr>}
                        {!loading && filteredNews.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <Newspaper className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 line-clamp-1">{item.title}</p>
                                            <p className="text-xs text-gray-500 line-clamp-1 mt-1">{item.content.substring(0, 100)}...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="inline-flex items-center w-fit px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wide">
                                            <Tag className="w-3 h-3 mr-1" /> {item.category}
                                        </span>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                        title="Hapus Berita"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
