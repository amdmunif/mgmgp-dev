import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api, getFileUrl } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Calendar, User, ArrowLeft, Share2, Loader2 } from 'lucide-react';
import type { NewsArticle } from '../../types';

export function NewsDetail() {
    const { id } = useParams<{ id: string }>();
    const [news, setNews] = useState<NewsArticle | null>(null);
    const [others, setOthers] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNewsDetail = async () => {
            try {
                const [detailRes, listRes] = await Promise.all([
                    api.get<NewsArticle>(`/news/${id}`),
                    api.get<NewsArticle[]>('/news')
                ]);
                setNews(detailRes);
                setOthers(listRes.filter(n => n.id !== id).slice(0, 2));
            } catch (error) {
                console.error('Error fetching news detail:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNewsDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!news) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Berita tidak ditemukan</h2>
                <Link to="/news">
                    <Button>Kembali ke Berita</Button>
                </Link>
            </div>
        );
    }

    return (
        <article className="max-w-4xl mx-auto px-4 py-12">
            <Link to="/news" className="inline-flex items-center text-gray-500 hover:text-primary-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar Berita
            </Link>

            <div className="mb-8">
                {news.category && (
                    <span className="inline-block px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-4">
                        {news.category}
                    </span>
                )}
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">{news.title}</h1>

                <div className="flex flex-wrap items-center gap-6 text-gray-500 border-b border-gray-100 pb-8">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        <span>{formatDate(news.created_at)}</span>
                    </div>
                    {news.author && (
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            <span>{news.author.name}</span>
                        </div>
                    )}
                    <Button variant="ghost" size="sm" className="ml-auto text-gray-500">
                        <Share2 className="w-4 h-4 mr-2" /> Bagikan
                    </Button>
                </div>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden mb-10 shadow-lg">
                <img
                    src={getFileUrl(news.image_url)}
                    alt={news.title}
                    className="w-full h-full object-cover"
                />
            </div>

            <div
                className="prose prose-lg md:prose-xl max-w-none prose-headings:text-gray-900 prose-headings:font-extrabold prose-p:text-gray-600 prose-img:rounded-2xl prose-img:shadow-md prose-a:text-blue-600 prose-strong:text-gray-900"
                dangerouslySetInnerHTML={{
                    __html: news.content.replace(/src="uploads\//g, `src="${getFileUrl('/uploads/')}`)
                }}
            />

            {others.length > 0 && (
                <div className="mt-16 pt-10 border-t border-gray-100">
                    <h3 className="text-2xl font-bold mb-6">Berita Lainnya</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {others.map(item => (
                            <Link key={item.id} to={`/news/${item.id}`} className="group block bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                                <h4 className="font-bold text-gray-900 group-hover:text-primary-600 mb-2">{item.title}</h4>
                                <p className="text-sm text-gray-500">{formatDate(item.created_at)}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </article>
    );
}
