import { useParams, Link } from 'react-router-dom';
import { MOCK_EVENTS } from '../../lib/mock';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Calendar, MapPin, ArrowLeft, Clock, Share2, ExternalLink, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { authService } from '../../services/authService';

export function EventDetail() {
    const { id } = useParams<{ id: string }>();
    const event = MOCK_EVENTS.find(e => e.id === id);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        authService.getCurrentUser().then(session => {
            setIsAuthenticated(!!session?.user);
        });
    }, []);

    if (!event) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Event tidak ditemukan</h2>
                <Link to="/events">
                    <Button>Kembali ke Agenda</Button>
                </Link>
            </div>
        );
    }

    // Dummy logic for event time, assuming 08:00 - 16:00 if not specified
    const startTime = "08:00";
    const endTime = "16:00 WIB";

    return (
        <div className="bg-gray-50 min-h-screen pb-16">
            {/* Header Image */}
            <div className="h-64 md:h-96 w-full relative">
                <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="max-w-4xl w-full px-4 text-white">
                        <Link to="/events" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Agenda
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-bold mb-4">{event.title}</h1>
                        <div className="flex flex-wrap gap-6 text-lg">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-accent-400" />
                                <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-accent-400" />
                                <span>{event.location}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tentang Kegiatan</h2>
                        <div className="prose text-gray-600 leading-relaxed">
                            {event.description.split('\n').map((paragraph, index) => (
                                <p key={index} className="mb-4">{paragraph}</p>
                            ))}
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                            </p>
                            <h3>Materi yang akan dipelajari:</h3>
                            <ul>
                                <li>Pengenalan Konsep Dasar</li>
                                <li>Implementasi Praktis di Kelas</li>
                                <li>Evaluasi dan Asesmen</li>
                                <li>Tanya Jawab dan Diskusi</li>
                            </ul>
                        </div>
                    </div>

                    {/* Gallery Preview Loop (Mock) */}
                    <div className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Dokumentasi Terkait</h2>
                        <p className="text-gray-500 text-sm mb-4">Foto kegiatan sebelumnya atau terkait.</p>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-200 aspect-square rounded-lg"></div>
                            <div className="bg-gray-200 aspect-square rounded-lg"></div>
                            <div className="bg-gray-200 aspect-square rounded-lg"></div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-primary-600 sticky top-24">
                        <h3 className="font-bold text-gray-900 text-lg mb-4">Informasi Pendaftaran</h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Waktu Pelaksanaan</p>
                                    <p className="font-medium text-gray-900">{startTime} - {endTime}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Lokasi Detail</p>
                                    <p className="font-medium text-gray-900">{event.location}</p>
                                    <a href="#" className="text-xs text-primary-600 hover:underline flex items-center mt-1">
                                        Lihat di Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Restricted Logic */}
                        {!event.is_registration_open ? (
                            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center font-medium">
                                Pendaftaran Telah Ditutup
                            </div>
                        ) : isAuthenticated ? (
                            <div className="space-y-3">
                                <Button className="w-full text-lg h-12 shadow-primary-500/20 hover:shadow-primary-500/40">
                                    Daftar Sekarang
                                </Button>
                                <p className="text-xs text-center text-gray-500">
                                    Kuota terbatas. Pendaftaran ditutup H-1 kegiatan.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Link to="/login">
                                    <Button variant="outline" className="w-full text-lg h-12 border-primary-600 text-primary-600 hover:bg-primary-50">
                                        <Lock className="w-4 h-4 mr-2" /> Login untuk Mendaftar
                                    </Button>
                                </Link>
                                <p className="text-xs text-center text-gray-500">
                                    Silakan login atau daftar akun untuk mengikuti event ini.
                                </p>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center">
                            <Button variant="ghost" className="text-gray-500 w-full">
                                <Share2 className="w-4 h-4 mr-2" /> Bagikan Event
                            </Button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-xl p-6 text-white">
                        <h3 className="font-bold text-lg mb-2">Butuh Bantuan?</h3>
                        <p className="text-primary-100 text-sm mb-4">Jika Anda memiliki pertanyaan seputar event ini, silakan hubungi panitia.</p>
                        <Button variant="outline" className="w-full border-white text-white hover:bg-white/10 hover:text-white bg-transparent">
                            Hubungi Panitia
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
