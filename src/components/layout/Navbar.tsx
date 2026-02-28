import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LayoutDashboard } from 'lucide-react';
import { authService } from '../../services/authService';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const navigation = [
        { name: 'Beranda', href: '/' },
        { name: 'Tentang', href: '/profile' },
        { name: 'Berita', href: '/news' },
        { name: 'Agenda', href: '/events' },
        { name: 'Galeri', href: '/gallery' },
    ];

    const [user, setUser] = useState<any>(null);
    const [logoUrl, setLogoUrl] = useState('');

    useEffect(() => {
        authService.getCurrentUser().then(data => {
            if (data?.profile) setUser(data.profile);
        });

        // Load Settings
        import('../../services/settingsService').then(m => {
            m.settingsService.getSettings().then(settings => {
                if (settings.logo_url || settings.app_logo) {
                    setLogoUrl(settings.logo_url || settings.app_logo || '');
                }
            });
        });

        // Listen for auth changes
        const { data: { subscription } } = authService.onAuthStateChange(async (userSession) => {
            if (userSession) {
                const { profile } = await authService.getCurrentUser() || {};
                setUser(profile);
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const isActive = (path: string) => location.pathname === path;
    const isAdminOrPengurus = user?.role === 'Admin' || user?.role === 'Pengurus';

    return (
        <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 bg-white/80 backdrop-blur-md">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                    {logoUrl && <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain" />}
                    <span className="self-center text-2xl font-bold whitespace-nowrap text-primary-900">MGMP<span className="text-primary-500">Informatika</span></span>
                </Link>
                <div className="flex md:order-2 space-x-3 md:space-x-3 rtl:space-x-reverse">
                    <div className="hidden md:flex space-x-3">
                        {user ? (
                            <div className="flex gap-3">
                                <Link to={isAdminOrPengurus ? "/admin" : "/member"}>
                                    <Button variant="default" size="sm" className="bg-primary-900 hover:bg-primary-800">
                                        <LayoutDashboard className="w-4 h-4 mr-2" />
                                        {isAdminOrPengurus ? 'Area Admin' : 'Area Anggota'}
                                    </Button>
                                </Link>
                                <Link to={isAdminOrPengurus ? "/admin" : "/member/profile"}>
                                    <Button variant="outline" size="sm">
                                        <User className="w-4 h-4 mr-2" />
                                        {user.nama?.split(' ')[0] || (isAdminOrPengurus ? 'Administrator' : 'User')}
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="default" size="sm">
                                        <User className="w-4 h-4 mr-2" />
                                        Login Anggota
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button variant="outline" size="sm">
                                        Daftar
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        type="button"
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
                        aria-expanded={isOpen}
                    >
                        <span className="sr-only">Open main menu</span>
                        <div className={cn("transition-transform duration-300", isOpen ? "rotate-90" : "rotate-0")}>
                            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </div>
                    </button>
                </div >
                <div
                    className={cn(
                        "items-center justify-between w-full md:flex md:w-auto md:order-1 overflow-hidden transition-all duration-300 ease-in-out",
                        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
                    )}
                >
                    <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent">
                        {navigation.map((item) => (
                            <li key={item.name}>
                                <Link
                                    to={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "block py-2 px-3 rounded md:p-0 transition-colors",
                                        isActive(item.href)
                                            ? "text-primary-600 font-bold"
                                            : "text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:hover:text-primary-600"
                                    )}
                                    aria-current={isActive(item.href) ? "page" : undefined}
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                        {/* Mobile Only Login/Register */}
                        <li className="mt-4 pt-4 border-t border-gray-200 md:hidden flex flex-col gap-3">
                            <Link to="/login" className="w-full" onClick={() => setIsOpen(false)}>
                                <Button variant="default" size="sm" className="w-full justify-start">
                                    <User className="w-4 h-4 mr-2" />
                                    Login Anggota
                                </Button>
                            </Link>
                            <Link to="/register" className="w-full" onClick={() => setIsOpen(false)}>
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                    Daftar Sekarang
                                </Button>
                            </Link>
                        </li>
                    </ul>
                </div>
            </div >
        </nav >
    );
}
