import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import {
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    Gamepad2,
    Terminal,
    BookOpen,
    Crown,
    UserCircle,
    Lock,
    Calendar,
    ChevronDown,
    FileText,
    FileQuestion,
    Book,
    Clock
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function MemberLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string>('');
    const sidebarRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check current auth status
        authService.getCurrentUser().then((data) => {
            if (!data?.user) {
                navigate('/login');
            } else {
                setUser(data.profile || data.user);
            }
        });

        // Load Settings for Logo
        import('../../services/settingsService').then(m => {
            m.settingsService.getSettings().then(settings => {
                if (settings.logo_url) setLogoUrl(settings.logo_url);
            });
        });

        const { data: { subscription } } = authService.onAuthStateChange(async (session) => {
            if (!session) {
                navigate('/login');
            } else {
                const { profile } = await authService.getCurrentUser() || {};
                setUser(profile || session.user);
            }
        });

        // Close dropdowns on outside click
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && window.innerWidth < 768) {
                // Optional: Close sidebar on click outside on mobile
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            subscription.unsubscribe();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [navigate]);

    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };

    // Check premium status
    const isPremium = user?.premium_until && new Date(user.premium_until) > new Date();
    // Check if expired (was premium, now passed)
    const isExpired = user?.premium_until && new Date(user.premium_until) <= new Date();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/member' },
        { icon: Calendar, label: 'Acara (Event)', path: '/member/events' },
        { icon: FileText, label: 'Referensi CP/TP', path: '/member/cptp' },
        { icon: FileQuestion, label: 'Bank Soal', path: '/member/questions', premium: true },
        { icon: Gamepad2, label: 'Bank Games', path: '/member/games', premium: true },
        { icon: Book, label: 'Modul Ajar', path: '/member/modules', premium: true },
        { icon: Terminal, label: 'Prompt Library', path: '/member/prompts', premium: true },
        { icon: BookOpen, label: 'Referensi Belajar', path: '/member/references', premium: true },
        // Mobile Only Items
        { icon: UserCircle, label: 'Edit Profil', path: '/member/profile', className: 'md:hidden' },
        ...(user?.role === 'Admin' || user?.role === 'Pengurus' ? [{ icon: LayoutDashboard, label: 'Admin Dashboard', path: '/admin', className: 'md:hidden text-primary-600' }] : []),

        // Upgrade needs to be at the bottom
        { icon: Crown, label: 'Upgrade Premium', path: '/member/upgrade' },
    ].filter(item => {
        // Hide Upgrade button if user is already Premium
        if (item.path === '/member/upgrade' && isPremium) return false;
        return true;
    });

    if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    const UserProfileSection = ({ mobile = false }) => (
        <div className={cn("flex items-center gap-3", mobile ? "w-full p-4 bg-gray-50 rounded-lg mb-4" : "")}>
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-white shadow-sm overflow-hidden shrink-0">
                    {user?.foto_profile ? (
                        <img src={user.foto_profile} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span>{user?.email?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                {isPremium && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white rounded-full p-0.5 border-2 border-white" title="Premium Member">
                        <Crown className="w-3 h-3" />
                    </div>
                )}
            </div>

            <div className={cn("flex-1 min-w-0", mobile ? "block" : "hidden md:block")}>
                <p className="text-sm font-bold text-gray-900 truncate">{user?.nama || 'Member'}</p>
                {/* Show status on both mobile and desktop (in dropdown trigger) now? No, user asked for it IN dropdown content */}
                {mobile && <p className="text-xs text-gray-500">{isPremium ? 'Premium Member' : 'Reguler Member'}</p>}
            </div>

            {/* Dropdown Trigger for Desktop */}
            {!mobile && (
                <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform duration-200", isProfileOpen ? "transform rotate-180" : "")} />
            )}
        </div>
    );

    // Get current page label
    const currentPage = menuItems.find(item => item.path === location.pathname) || { label: 'Member Area' };

    // Hardcode label for sub-pages or unknown paths
    const getPageTitle = () => {
        if (location.pathname === '/member/profile') return 'Edit Profil';
        return currentPage.label;
    };

    return (
        <div className="min-h-screen bg-gray-100 flex pb-16 md:pb-0">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside ref={sidebarRef} className={cn(
                "fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out transform flex flex-col",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-6 flex items-center gap-3 border-b border-gray-100 h-16">
                    {/* Logo + Text */}
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shrink-0">
                            <BookOpen className="w-5 h-5" />
                        </div>
                    )}
                    <span className="font-bold text-lg text-primary-900">MGMP Member</span>

                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500 hover:bg-gray-100 p-1 rounded ml-auto">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {/* Mobile Only: User Profile inside Menu */}
                    <div className="md:hidden mb-6">
                        <UserProfileSection mobile={true} />
                    </div>

                    {menuItems.map((item) => {
                        const isLocked = item.premium && !isPremium;
                        // Handle hidden items (for responsive)
                        // @ts-ignore
                        const extraClass = item.className || "";

                        return (
                            <Link
                                key={item.path}
                                to={isLocked ? '/member/upgrade' : item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                                    extraClass,
                                    location.pathname === item.path
                                        ? "bg-primary-50 text-primary-700 font-medium"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                    isLocked && "opacity-60 cursor-not-allowed hover:bg-transparent hover:text-gray-600"
                                )}
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <item.icon className={cn("w-5 h-5 flex-shrink-0", location.pathname === item.path ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600")} />
                                <span className="flex-1 truncate">{item.label}</span>
                                {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                            </Link>
                        );
                    })}

                    {/* Mobile Only Logout (at bottom of nav) */}
                    <button
                        onClick={handleLogout}
                        className="md:hidden flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium mt-2"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        Logout
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-100 md:hidden">
                    <p className="text-[10px] text-center text-gray-300">v2.0.0 MGMP App</p>
                </div>

                {/* Desktop Only: Footer credits */}
                <div className="hidden md:block p-4 border-t border-gray-100">
                    <p className="text-[10px] text-center text-gray-300">v2.0.0 MGMP App</p>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header (Desktop & Mobile) */}
                <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between shadow-sm z-30 h-16">
                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Mobile Hamburger */}
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Mobile Branding (Logo + Text) */}
                        <div className="md:hidden flex items-center gap-2 mr-2">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shrink-0">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                            )}
                            <span className="font-bold text-lg text-primary-900">MGMP Member</span>
                        </div>

                        {/* Page Title in Header (Hidden on mobile if user wants Branding, or maybe kept? User said "pastikan ada tulisan MGMP Member". Let's hide page title on mobile or show small?
                           Let's hide Page Title on mobile to make room for Branding, or keep it if space allows. Safe bet: Show Branding on mobile as requested. Page Title can be in content or separate.
                           Wait, usually mobile headers are "Hamburger | Logo + AppName". Page title is secondary.
                           Existing code showed Page Title on mobile: `<h1 ...>{getPageTitle()}</h1>`.
                           I will hide Page Title on mobile and show Branding instead.
                        */}
                        <h1 className="hidden md:block text-lg md:text-xl font-bold text-gray-800 truncate">{getPageTitle()}</h1>
                    </div>

                    {/* Desktop Right: User Dropdown */}
                    <div className="hidden md:block relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 p-1 pl-3 pr-2 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                        >
                            <UserProfileSection mobile={false} />
                        </button>

                        {/* Dropdown Menu */}
                        {isProfileOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-3 border-b border-gray-50 mb-1 bg-gray-50/50">
                                    <p className="text-sm font-bold text-gray-900 truncate">{user?.nama}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {isPremium ? (
                                            <span className="text-[10px] bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit">
                                                <Crown className="w-3 h-3" /> PREMIUM MEMBER
                                            </span>
                                        ) : (
                                            <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium w-fit">REGULER MEMBER</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 truncate">{user?.email}</p>
                                </div>

                                <Link
                                    to="/member/profile"
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <UserCircle className="w-4 h-4" /> Edit Profil
                                </Link>

                                {['Admin', 'Pengurus'].includes(user?.role) && (
                                    <Link
                                        to="/admin"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 font-medium"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                                    </Link>
                                )}

                                <div className="h-px bg-gray-100 my-1" />

                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 p-4 md:p-8">
                    {/* Expired Notification */}
                    {isExpired && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-red-900">Masa Aktif Premium Berakhir</h3>
                                    <p className="text-sm text-red-700">Layanan premium Anda telah habis. Perpanjang sekarang untuk akses penuh kembali.</p>
                                </div>
                            </div>
                            <div className="flex w-full md:w-auto">
                                <Button size="sm" onClick={() => navigate('/member/upgrade')} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white border-none shadow-sm whitespace-nowrap">
                                    Perpanjang Premium
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
