import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ArrowRight, Calendar, BookOpen, Users, MapPin, Mail, Phone, Send, Loader2 } from 'lucide-react';
import { api, getFileUrl } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import type { NewsArticle, Event } from '../../types';

export function Home() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [stats, setStats] = useState({
        members: 0,
        materials: 0,
        events: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [newsRes, eventsRes, statsRes] = await Promise.all([
                    api.get<NewsArticle[]>('/news'),
                    api.get<Event[]>('/events'),
                    api.get<any>('/stats')
                ]);

                setNews(newsRes.slice(0, 3));
                setEvents(eventsRes.slice(0, 3));
                setStats({
                    members: statsRes.members || 0,
                    materials: statsRes.materials || 0,
                    events: statsRes.events || 0
                });
            } catch (error) {
                console.error('Error fetching landing data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-16 pb-16">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-primary-900 to-primary-700 text-white py-24 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                <div className="max-w-screen-xl mx-auto relative z-10">
                    <div className="max-w-3xl space-y-6">
                        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                            Membangun Generasi <span className="text-accent-400">Digital</span> yang Unggul
                        </h1>
                        <p className="text-xl md:text-2xl text-primary-100">
                            Wadah kolaborasi dan pengembangan profesionalisme guru Informatika Kabupaten Wonosobo.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link to="/register">
                                <Button size="lg" className="text-lg px-8 bg-accent-500 hover:bg-accent-600 text-white border-none">
                                    Gabung Sekarang <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Link to="/events">
                                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white backdrop-blur-sm">
                                    Lihat Agenda
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="max-w-screen-xl mx-auto px-4 -mt-10 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-center space-x-4">
                        <div className="p-3 bg-primary-100 rounded-lg text-primary-600">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.members || 0}+</h3>
                            <p className="text-gray-500">Anggota Aktif</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-center space-x-4">
                        <div className="p-3 bg-accent-100 rounded-lg text-accent-600">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.events || 0}+</h3>
                            <p className="text-gray-500">Kegiatan</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-center space-x-4">
                        <div className="p-3 bg-green-100 rounded-lg text-green-600">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.materials || 0}+</h3>
                            <p className="text-gray-500">Modul Pembelajaran</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features/Services Preview */}
            <section className="max-w-screen-xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Layanan Unggulan</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">Kami menyediakan berbagai fasilitas untuk mendukung pengembangan kompetensi guru dan kualitas pembelajaran siswa.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'Pelatihan Berkala', desc: 'Workshop dan seminar rutin untuk update teknologi terbaru.', icon: '🎯' },
                        { title: 'Bank Soal', desc: 'Akses ribuan soal latihan dan ujian standard.', icon: '📚' },
                        { title: 'Generator RPP', desc: 'Buat perangkat pembelajaran dengan mudah dan cepat.', icon: '⚡' },
                        { title: 'Komunitas', desc: 'Diskusi dan berbagi praktik baik antar sesama guru.', icon: '🤝' },
                    ].map((item, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                            <p className="text-gray-500">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Latest News Section */}
            <section className="bg-gray-50 py-16">
                <div className="max-w-screen-xl mx-auto px-4">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Berita Terbaru</h2>
                            <p className="text-gray-600">Informasi terkini seputar dunia pendidikan dan teknologi.</p>
                        </div>
                        <Link to="/news">
                            <Button variant="outline">Lihat Semua Berita</Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {news.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="h-48 overflow-hidden relative">
                                    <img
                                        src={getFileUrl(item.image_url)}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {item.category && (
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm text-primary-700">
                                            {item.category}
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> {formatDate(item.created_at)}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                                        <Link to={`/news/${item.id}`}>{item.title}</Link>
                                    </h3>
                                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">{item.content}</p>
                                    <Link to={`/news/${item.id}`} className="text-primary-600 font-semibold text-sm hover:underline flex items-center">
                                        Baca Selengkapnya <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                        {news.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">Belum ada berita terbaru.</div>}
                    </div>
                </div>
            </section>

            {/* Upcoming Events Section */}
            <section className="max-w-screen-xl mx-auto px-4">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Agenda Kegiatan</h2>
                        <p className="text-gray-600">Jangan lewatkan kegiatan menarik yang akan datang.</p>
                    </div>
                    <Link to="/events">
                        <Button variant="outline">Lihat Semua Agenda</Button>
                    </Link>
                </div>

                <div className="space-y-6">
                    {events.map((event) => (
                        <div key={event.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row group">
                            <div className="md:w-1/4 h-48 md:h-auto overflow-hidden relative">
                                <img
                                    src={getFileUrl(event.image_url)}
                                    alt={event.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute top-4 left-4 bg-primary-600 text-white px-4 py-2 rounded-lg text-center shadow-md">
                                    <span className="block text-xl font-bold">{new Date(event.date).getDate()}</span>
                                    <span className="text-xs uppercase">{new Date(event.date).toLocaleString('id-ID', { month: 'short' })}</span>
                                </div>
                            </div>
                            <div className="p-6 md:w-3/4 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.location}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${event.is_registration_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {event.is_registration_open ? 'Pendaftaran Buka' : 'Ditutup'}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                                        <Link to={`/events/${event.id}`}>{event.title}</Link>
                                    </h3>
                                    <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                                </div>
                                <div className="flex justify-end">
                                    <Link to={`/events/${event.id}`}>
                                        <Button size="sm">Detail Acara</Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && <div className="text-center py-12 text-gray-400">Belum ada agenda kegiatan mendatang.</div>}
                </div>
            </section>

            {/* Contact Section */}
            <section className="bg-primary-900 text-white py-16 mt-16 rounded-3xl mx-4 lg:mx-auto max-w-screen-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Mail className="w-64 h-64 transform rotate-12" />
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 px-8 md:px-16 items-center">
                    <div>
                        <h2 className="text-3xl font-bold mb-6">Hubungi Kami</h2>
                        <p className="text-primary-100 mb-8 text-lg">
                            Ada pertanyaan atau ingin berkolaborasi? Jangan ragu untuk menghubungi kami. Tim kami siap membantu Anda.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-primary-200">Alamat</p>
                                    <p className="font-semibold">SMP Negeri 1 Wonosobo, Jl. P. Diponegoro No. 1</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-primary-200">Email</p>
                                    <p className="font-semibold">info@mgmp-informatika-wsb.org</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-primary-200">WhatsApp</p>
                                    <p className="font-semibold">+62 812-3456-7890</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 text-gray-900 shadow-xl">
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="Nama Anda" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="email@contoh.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pesan</label>
                                <textarea rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="Tulis pesan Anda disini..."></textarea>
                            </div>
                            <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white">
                                <Send className="w-4 h-4 mr-2" /> Kirim Pesan
                            </Button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}
