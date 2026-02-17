import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Newspaper, Tag, Calendar, Eye, Pencil } from 'lucide-react';
import { contentManagementService } from '../../../services/contentManagementService';
import type { NewsArticle } from '../../../types';
import { Link, useOutletContext } from 'react-router-dom';
import { DataTable } from '../../../components/ui/DataTable';

export function AdminNews() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Manajemen Berita',
                description: 'Publikasikan informasi dan pengumuman terbaru.',
                icon: <Newspaper className="w-6 h-6" />
            });
        }
        loadData();
    }, [setPageHeader]);

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

    const columns = [
        {
            header: 'Berita',
            accessorKey: 'title' as keyof NewsArticle,
            cell: (item: NewsArticle) => (
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0 overflow-hidden border border-gray-200">
                        {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Newspaper className="w-6 h-6" />
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 line-clamp-1">{item.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">{item.content.replace(/<[^>]*>?/gm, '').substring(0, 100)}...</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Kategori',
            accessorKey: 'category' as keyof NewsArticle,
            cell: (item: NewsArticle) => (
                <span className="inline-flex items-center w-fit px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wide border border-blue-100">
                    <Tag className="w-3 h-3 mr-1" /> {item.category}
                </span>
            )
        },
        {
            header: 'Waktu',
            accessorKey: 'created_at' as keyof NewsArticle,
            cell: (item: NewsArticle) => (
                <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right',
            cell: (item: NewsArticle) => (
                <div className="flex items-center justify-end gap-2">
                    <Link
                        to={`/news/${item.id}`}
                        target="_blank"
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Lihat Berita"
                    >
                        <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                        to={`/admin/news/edit/${item.id}`}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                        title="Edit Berita"
                    >
                        <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Hapus Berita"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-end items-center">
                <Link to="/admin/news/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                        <Plus className="w-4 h-4 mr-2" /> Tulis Berita
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <DataTable
                        data={news}
                        columns={columns}
                        searchKeys={['title', 'category']}
                        pageSize={10}
                    />
                )}
            </div>
        </div>
    );
}
