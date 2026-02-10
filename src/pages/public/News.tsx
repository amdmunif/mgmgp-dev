import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api, getFileUrl } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Calendar, User, Search, Loader2 } from 'lucide-react';
import type { NewsArticle } from '../../types';

export function News() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const data = await api.get<NewsArticle[]>('/news');
                setNews(data);
            } catch (error) {
                console.error('Error fetching news:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    const filteredNews = news.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.content.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Berita & Artikel</h1>
                    <p className="text-gray-500 mt-2">Update kegiatan dan informasi terbaru MGMP.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                        <Search className="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full ps-10 p-2.5"
                        placeholder="Cari berita..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredNews.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                        <div className="h-48 overflow-hidden relative">
                            <img
                                src={getFileUrl(item.image_url)}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            />
                            {item.category && (
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm text-primary-700">
                                    {item.category}
                                </div>
                            )}
                        </div>
                        <div className="p-5 flex-grow flex flex-col">
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(item.created_at)}</span>
                                {item.author && (
                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.author.name}</span>
                                )}
                            </div>
                            <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900 line-clamp-2">{item.title}</h5>
                            <p className="mb-4 font-normal text-gray-700 line-clamp-3 text-sm">{item.content}</p>
                            <div className="mt-auto pt-4">
                                <Link to={`/news/${item.id}`}>
                                    <Button variant="outline" className="w-full">Baca Selengkapnya</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
                {!loading && filteredNews.length === 0 && (
                    <div className="col-span-3 text-center py-12 text-gray-400">
                        Tidak ada berita yang ditemukan.
                    </div>
                )}
            </div>
        </div>
    );
}
