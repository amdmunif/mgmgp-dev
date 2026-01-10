import { Facebook, Instagram, Mail, Youtube, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="bg-gray-900 border-t border-gray-800 text-gray-300">
            <div className="w-full mx-auto max-w-screen-xl p-8 lg:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                            <span className="self-center text-2xl font-bold whitespace-nowrap text-white">MGMP<span className="text-primary-500">Informatika</span></span>
                        </Link>
                        <p className="text-sm leading-relaxed text-gray-400 max-w-sm">
                            Wadah kolaborasi dan pengembangan profesionalisme Guru Informatika Kabupaten Wonosobo. Bersama membangun masa depan pendidikan teknologi.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all duration-300">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all duration-300">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all duration-300">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Tautan Cepat</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/" className="hover:text-primary-400 transition-colors">Beranda</Link></li>
                            <li><Link to="/profile" className="hover:text-primary-400 transition-colors">Tentang Kami</Link></li>
                            <li><Link to="/news" className="hover:text-primary-400 transition-colors">Berita Terkini</Link></li>
                            <li><Link to="/events" className="hover:text-primary-400 transition-colors">Agenda Kegiatan</Link></li>
                            <li><Link to="/gallery" className="hover:text-primary-400 transition-colors">Galeri Foto</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Hubungi Kami</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start">
                                <MapPin className="w-5 h-5 mr-3 text-primary-500 flex-shrink-0" />
                                <span>SMP Negeri 1 Wonosobo,<br />Jl. P. Diponegoro No. 12</span>
                            </li>
                            <li className="flex items-center">
                                <Mail className="w-5 h-5 mr-3 text-primary-500 flex-shrink-0" />
                                <a href="mailto:info@mgmp-informatika.id" className="hover:text-primary-400 transition-colors">info@mgmp-informatika.id</a>
                            </li>
                            <li className="flex items-center">
                                <Phone className="w-5 h-5 mr-3 text-primary-500 flex-shrink-0" />
                                <span>+62 812-3456-7890</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <span className="mb-4 md:mb-0">© 2024 MGMP Informatika Wonosobo. All Rights Reserved.</span>
                    <div className="flex space-x-6">
                        <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
