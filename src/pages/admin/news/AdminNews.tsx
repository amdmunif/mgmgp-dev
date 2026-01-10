import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { contentManagementService } from '../../../services/contentManagementService';
import type { NewsArticle } from '../../../types';
import { Link } from 'react-router-dom';

export function AdminNews() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Berita</h1>
                <Link to="/admin/news/create">
                    <Button><Plus className="w-4 h-4 mr-2" /> Tulis Berita</Button>
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Judul</th>
                            <th className="px-6 py-4">Kategori</th>
                            <th className="px-6 py-4">Tanggal</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && <tr><td colSpan={4} className="p-8 text-center">Loading...</td></tr>}
                        {!loading && news.length === 0 && <tr><td colSpan={4} className="p-8 text-center">Belum ada berita.</td></tr>}
                        {!loading && news.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{item.title}</td>
                                <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{item.category}</span></td>
                                <td className="px-6 py-4 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
