import { Link } from 'react-router-dom';
import { useState } from 'react';
import { MOCK_NEWS } from '../../lib/mock';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Calendar, User, Search } from 'lucide-react';

export function News() {
    const [search, setSearch] = useState('');

    const filteredNews = MOCK_NEWS.filter(news =>
        news.title.toLowerCase().includes(search.toLowerCase()) ||
        news.content.toLowerCase().includes(search.toLowerCase())
    );

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
                {filteredNews.map((news) => (
                    <div key={news.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                        <div className="h-48 overflow-hidden relative">
                            <img src={news.image_url} alt={news.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                        </div>
                        <div className="p-5 flex-grow flex flex-col">
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(news.created_at)}</span>
                                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {news.author.name}</span>
                            </div>
                            <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900 line-clamp-2">{news.title}</h5>
                            <p className="mb-4 font-normal text-gray-700 line-clamp-3 text-sm">{news.content}</p>
                            <div className="mt-auto pt-4">
                                <Link to={`/news/${news.id}`}>
                                    <Button variant="outline" className="w-full">Baca Selengkapnya</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
