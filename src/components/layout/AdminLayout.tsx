import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { authService } from '../../services/authService';
import {
    LayoutDashboard,
    FileText,
    Calendar,
    Users,
    User, // Re-added
    LogOut,
    Settings,
    Crown,
    Menu,
    Gamepad2,
    X,
    BookOpen,
    Terminal,
    Book,
    Globe,
    ChevronDown,
    UserCircle,
    UserCheck,
    ImageIcon,
    Mail,
    ShieldAlert
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getFileUrl } from '../../lib/api';
// import { Button } from '../../components/ui/button';

export function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<any>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [badges, setBadges] = useState({ members: 0, premium: 0 });
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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
            try {
                const stats = await api.get<any>('/stats');
                setBadges({
                    members: stats.pendingMembers || 0,
                    premium: stats.pendingPremium || 0
                });
            } catch (e) {
                console.error("Failed to fetch badges", e);
            }
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

    // Handle Auto-expansion when location changes
    useEffect(() => {
        const currentGroup = menuGroups.find(group =>
            group.items.some(item => location.pathname === item.path)
        );
        if (currentGroup) {
            setExpandedGroups(prev => ({
                ...prev,
                [currentGroup.title]: true
            }));
        }
    }, [location.pathname]);

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };

    const UserProfileSection = ({ mobile = false }: { mobile?: boolean }) => (
        <div className={cn("flex items-center gap-3", mobile ? "w-full p-4 bg-gray-800 rounded-lg mb-4" : "")}>
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm overflow-hidden shrink-0">
                    {user?.foto_profile ? (
                        <img src={getFileUrl(user.foto_profile)} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span>{user?.email?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 border-2 border-white" title="Admin">
                    <Crown className="w-3 h-3" />
                </div>
            </div>

            <div className={cn("flex-1 min-w-0", mobile ? "block" : "hidden md:block")}>
                <p className={cn("text-sm font-bold truncate", mobile ? "text-white" : "text-gray-900")}>{user?.nama || 'Administrator'}</p>
                {!mobile && <p className="text-xs text-gray-500">Super Admin</p>}
                {mobile && <p className="text-xs text-gray-400">Manage System</p>}
            </div>

            {/* Dropdown Trigger for Desktop */}
            {!mobile && (
                <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform duration-200", isProfileOpen ? "transform rotate-180" : "")} />
            )}
        </div>
    );

    const menuGroups = [
        {
            title: "Utama",
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
                { icon: Mail, label: 'Pesan Masuk', path: '/admin/messages' },
                { icon: ShieldAlert, label: 'Log Aktivitas', path: '/admin/logs' },
            ]
        },
        {
            title: "Pengguna",
            items: [
                { icon: Users, label: 'Anggota', path: '/admin/members' },
                { icon: UserCheck, label: 'Kontributor', path: '/admin/contributors' },
                { icon: Crown, label: 'Langganan', path: '/admin/premium' },
            ]
        },
        {
            title: "Edukasi",
            items: [
                { icon: BookOpen, label: 'Pembelajaran', path: '/admin/learning' },
                { icon: FileText, label: 'Bank Soal', path: '/admin/questions' },
                { icon: Gamepad2, label: 'Bank Games', path: '/admin/games' },
                { icon: Terminal, label: 'Prompt Library', path: '/admin/prompts' },
                { icon: Book, label: 'Bank Referensi', path: '/admin/references' },
            ]
        },
        {
            title: "Konten Publik",
            items: [
                { icon: Calendar, label: 'Acara & Kegiatan', path: '/admin/events' },
                { icon: FileText, label: 'Berita & Artikel', path: '/admin/news' },
                { icon: ImageIcon, label: 'Galeri Foto', path: '/admin/gallery' },
            ]
        },
        {
            title: "Sistem & Alat",
            items: [
                { icon: FileText, label: 'Generator Surat', path: '/admin/letters' },
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
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-transform duration-300 ease-in-out transform flex flex-col shadow-2xl h-screen",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-hide">
                    {/* Mobile Only Profile */}
                    <div className="md:hidden">
                        <UserProfileSection mobile={true} />
                    </div>

                    {menuGroups.map((group, groupIndex) => {
                        const isExpanded = !!expandedGroups[group.title];
                        const hasActive = group.items.some(item => location.pathname === item.path);

                        return (
                            <div key={groupIndex} className="space-y-1">
                                <button
                                    onClick={() => toggleGroup(group.title)}
                                    className={cn(
                                        "w-full px-4 flex items-center justify-between py-2 group/header mb-1 hover:bg-slate-800/50 rounded-lg transition-colors",
                                        hasActive ? "text-blue-400" : "text-slate-500"
                                    )}
                                >
                                    <p className="text-[10px] font-bold uppercase tracking-wider">{group.title}</p>
                                    <ChevronDown className={cn(
                                        "w-3.5 h-3.5 transition-transform duration-300",
                                        isExpanded ? "transform rotate-180" : ""
                                    )} />
                                </button>

                                <div className={cn(
                                    "space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                                    isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                )}>
                                    {group.items.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 group relative overflow-hidden ml-2 mr-2",
                                                    isActive
                                                        ? "bg-blue-600/15 text-blue-400 font-semibold"
                                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                                )}
                                                onClick={() => setIsSidebarOpen(false)}
                                            >
                                                <item.icon className={cn(
                                                    "w-4 h-4 transition-transform duration-300",
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
                        );
                    })}

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
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shadow-sm z-40">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center">
                            {/* Mobile Branding (Logo + Text) */}
                            <div className="lg:hidden flex items-center gap-2 ml-2">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                                ) : (
                                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                                        <Crown className="w-5 h-5" />
                                    </div>
                                )}
                                <span className="font-bold text-lg text-gray-900">MGMP Admin</span>
                            </div>

                            <div className="hidden lg:block">
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

                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 border border-gray-100 text-gray-500">
                            <Calendar className="w-5 h-5" />
                        </div>

                        <span className="text-sm font-semibold text-gray-600 hidden lg:block ml-2">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>

                        {/* Desktop Right: User Profile Dropdown */}
                        <div className="hidden lg:block relative ml-2" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 p-1 pl-3 pr-2 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 focus:outline-none"
                            >
                                <UserProfileSection mobile={false} />
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-50 mb-1 bg-gray-50/50">
                                        <p className="text-sm font-bold text-gray-900 truncate">{user?.nama}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit">
                                                <Crown className="w-3 h-3" /> ADMINISTRATOR
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 truncate">{user?.email}</p>
                                    </div>

                                    <Link
                                        to="/admin/settings"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <UserCircle className="w-4 h-4" /> Edit Profil
                                    </Link>

                                    <Link
                                        to="/member"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <User className="w-4 h-4" /> Member Area
                                    </Link>

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
                    </div>
                </header>

                <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 relative">
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
