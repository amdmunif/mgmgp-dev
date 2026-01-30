import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { authService } from '../../services/authService';
import {
    LayoutDashboard,
    FileText,
    Calendar,
    Users,
    LogOut,
    Settings,
    Crown,
    Menu,
    Gamepad2, // Added
    X,
    BookOpen,
    Terminal, // Added
    Book, // Added
    Globe
} from 'lucide-react';
import { cn } from '../../lib/utils';
// import { Button } from '../../components/ui/button';

export function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<any>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [badges, setBadges] = useState({ members: 0, premium: 0 });

    useEffect(() => {
        // Initial check
        authService.getCurrentUser().then((data) => {
            if (!data?.user) {
                navigate('/login');
            } else {
                setUser(data.user);
            }
        });

        // Load Settings for Logo
        import('../../services/settingsService').then(m => {
            m.settingsService.getSettings().then(settings => {
                if (settings.logo_url) setLogoUrl(settings.logo_url);
            });
        });

        // Fetch Badges
        const fetchBadges = async () => {
            const { count: members } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', false);
            const { count: premium } = await supabase.from('premium_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            setBadges({ members: members || 0, premium: premium || 0 });
        };
        fetchBadges();

        // Subscription
        const { data: { subscription } } = authService.onAuthStateChange((user) => {
            if (!user) navigate('/login');
            setUser(user);
        });



        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };

    const UserProfileSection = ({ mobile = false }: { mobile?: boolean }) => (
        <div className={cn("flex items-center gap-3", mobile ? "w-full p-4 bg-gray-800 rounded-lg mb-4" : "")}>
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold border-2 border-white/10 shadow-sm overflow-hidden shrink-0">
                    <span>{user?.email?.charAt(0).toUpperCase()}</span>
                </div>
            </div>

            <div className={cn("flex-1 min-w-0", mobile ? "block" : "hidden md:block")}>
                <p className={cn("text-sm font-bold truncate", mobile ? "text-white" : "text-gray-900")}>{user?.nama || 'Administrator'}</p>
                {!mobile && <p className="text-xs text-gray-500">Super Admin</p>}
                {mobile && <p className="text-xs text-gray-400">Manage System</p>}
            </div>

            {/* Dropdown Trigger for Desktop */}
            {!mobile && (
                <Users className="w-4 h-4 text-gray-500" />
            )}
        </div>
    );

    const menuGroups = [
        {
            title: "Utama",
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
            ]
        },
        {
            title: "Menu Anggota",
            items: [
                { icon: Users, label: 'Kelola Anggota', path: '/admin/members' },
                { icon: Crown, label: 'Kelola Langganan', path: '/admin/premium' },
            ]
        },
        {
            title: "Fitur Premium",
            items: [
                { icon: BookOpen, label: 'Kelola Pembelajaran', path: '/admin/learning' },
                { icon: FileText, label: 'Bank Soal', path: '/admin/questions' },
                { icon: Gamepad2, label: 'Bank Games', path: '/admin/games' },
                { icon: Terminal, label: 'Prompt Library', path: '/admin/prompts' },
            ]
        },
        {
            title: "Manajemen Konten",
            items: [
                { icon: Book, label: 'Referensi CP/TP', path: '/admin/references' },
                { icon: Calendar, label: 'Acara & Kegiatan', path: '/admin/events' },
                { icon: FileText, label: 'Berita', path: '/admin/news' },
            ]
        },
        {
            title: "Administrasi",
            items: [
                { icon: FileText, label: 'Generator Surat', path: '/admin/letters' },
            ]
        },
        {
            title: "Sistem",
            items: [
                { icon: Globe, label: 'Pengaturan Web', path: '/admin/web-settings' },
                { icon: Settings, label: 'Akun Admin', path: '/admin/settings' },
            ]
        }
    ];

    if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-transform duration-300 ease-in-out transform flex flex-col shadow-2xl h-screen",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Sidebar Header */}
                <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-900 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Crown className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-white">MGMP Admin</h2>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Panel Kontrol</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-hide">
                    {/* Mobile Only Profile */}
                    <div className="md:hidden">
                        <UserProfileSection mobile={true} />
                    </div>

                    {menuGroups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{group.title}</p>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                                isActive
                                                    ? "bg-blue-600/10 text-blue-400 font-semibold"
                                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                            )}
                                            onClick={() => setIsSidebarOpen(false)}
                                        >
                                            <item.icon className={cn(
                                                "w-5 h-5 transition-transform duration-300",
                                                isActive ? "text-blue-500 scale-110" : "group-hover:text-white group-hover:scale-110"
                                            )} />
                                            <span className="text-sm tracking-wide flex-1">{item.label}</span>

                                            {item.path === '/admin/members' && badges.members > 0 && (
                                                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{badges.members}</span>
                                            )}
                                            {item.path === '/admin/premium' && badges.premium > 0 && (
                                                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{badges.premium}</span>
                                            )}

                                            {isActive && (
                                                <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 rounded-r-full" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleLogout}
                        className="md:hidden flex items-center gap-3 px-4 py-3.5 w-full text-red-400 hover:bg-slate-800 rounded-xl mt-4"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium text-sm">Logout</span>
                    </button>

                    <div className="pt-6 pb-2 text-center md:text-left px-4">
                        <p className="text-[10px] text-slate-600">
                            &copy; {new Date().getFullYear()} MGMP Informatika
                        </p>
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50 relative">
                {/* Top Desktop Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center">
                            {/* Mobile Branding (Logo + Text) */}
                            <div className="md:hidden flex items-center gap-2 ml-2">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                                ) : (
                                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                                        <Crown className="w-5 h-5" />
                                    </div>
                                )}
                                <span className="font-bold text-lg text-gray-900">MGMP Admin</span>
                            </div>

                            <div className="hidden md:block">
                                <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                                    {(() => {
                                        let activeLabel = 'Dashboard';
                                        menuGroups.forEach(group => {
                                            const item = group.items.find(i => i.path === location.pathname);
                                            if (item) activeLabel = item.label;
                                        });
                                        return activeLabel;
                                    })()}
                                </h1>
                                <p className="text-sm text-gray-400 font-medium">Selamat Datang di Panel Admin MGMP</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 border border-gray-100 text-gray-500">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div className="w-px h-8 bg-gray-200 hidden md:block" />
                        <span className="text-sm font-semibold text-gray-600 hidden md:block">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>

                        {/* Desktop Right: User Dropdown */}
                        <div className="hidden md:block relative ml-4" ref={profileRef}>
                            {/* Desktop Right: User Dropdown (Non-clickable, Custom Style) */}
                            <div className="hidden md:flex items-center gap-3 ml-4 bg-white rounded-lg p-1 pr-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                    {user?.nama?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900 leading-tight">{user?.nama || 'Administrator MGMP'}</span>
                                    <span className="text-xs text-gray-500">Super Admin</span>
                                </div>
                                <div className="ml-2">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    {/* Icon placeholder as per request for visual, though not clickable */}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:20px_20px]" />

                    <div className="relative z-10 animate-fade-in">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
