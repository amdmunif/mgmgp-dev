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
    ShieldAlert,
    TrendingUp
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
    // Initialize all groups as expanded by default
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
        const initialStates: Record<string, boolean> = {};
        menuGroups.forEach(group => {
            initialStates[group.title] = true;
        });
        return initialStates;
    });

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

    // Ensure active group is expanded if somehow closed
    useEffect(() => {
        const currentGroup = menuGroups.find(group =>
            group.items.some(item => location.pathname === item.path)
        );
        if (currentGroup && !expandedGroups[currentGroup.title]) {
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
        <div className={cn("flex items-center gap-3", mobile ? "w-full p-4 bg-gray-800/50 rounded-xl mb-4" : "")}>
            <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-white flex items-center justify-center text-blue-700 font-bold border border-white/20 shadow-sm overflow-hidden shrink-0">
                    {user?.foto_profile ? (
                        <img src={getFileUrl(user.foto_profile)} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span>{user?.email?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 border-2 border-slate-900" title="Admin">
                    <Crown className="w-3 h-3" />
                </div>
            </div>

            <div className={cn("flex-1 min-w-0", mobile ? "block" : "hidden md:block")}>
                <p className={cn("text-sm font-bold truncate", mobile ? "text-white" : "text-gray-900")}>{user?.nama || 'Administrator'}</p>
                {!mobile && <p className="text-xs text-gray-500 font-medium">Super Admin</p>}
                {mobile && <p className="text-xs text-gray-400">Kelola Sistem</p>}
            </div>

            {!mobile && (
                <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-200", isProfileOpen ? "transform rotate-180" : "")} />
            )}
        </div>
    );

    const menuGroups = [
        {
            title: "Utama",
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
                { icon: TrendingUp, label: 'Statistik & Laporan', path: '/admin/stats' },
                { icon: Mail, label: 'Pesan Masuk', path: '/admin/messages' },
                { icon: ShieldAlert, label: 'Log Aktivitas', path: '/admin/logs' },
            ]
        },
        {
            title: "Pengguna",
            items: [
                { icon: Users, label: 'Data Anggota', path: '/admin/members' },
                { icon: UserCheck, label: 'Kontributor', path: '/admin/contributors' },
                { icon: Crown, label: 'Langganan Premium', path: '/admin/premium' },
            ]
        },
        {
            title: "Edukasi",
            items: [
                { icon: BookOpen, label: 'Materi Pembelajaran', path: '/admin/learning' },
                { icon: FileText, label: 'Bank Soal (CBT)', path: '/admin/questions' },
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
                { icon: Settings, label: 'Keamanan Akun', path: '/admin/settings' },
            ]
        }
    ];

    if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-medium animate-pulse">Menyiapkan Panel Admin...</p>
        </div>
    </div>;

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row font-sans text-slate-900">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-all duration-300 ease-in-out transform flex flex-col shadow-2xl h-screen overflow-hidden",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Sidebar Header */}
                <div className="h-20 flex items-center px-6 border-b border-white/5 bg-slate-900 shrink-0 relative overflow-hidden group/header-top">
                    {/* Decorative Background for Header */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover/header-top:bg-blue-500/20 transition-all duration-700" />

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
                            <Crown className="w-5 h-5 drop-shadow-sm" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-white leading-tight">MGMP Admin</h2>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-black">Panel Kontrol</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-7 overflow-y-auto scrollbar-hide">
                    {/* Mobile Only Profile */}
                    <div className="md:hidden px-1">
                        <UserProfileSection mobile={true} />
                    </div>

                    {menuGroups.map((group, groupIndex) => {
                        const isExpanded = !!expandedGroups[group.title];
                        const hasActive = group.items.some(item => location.pathname === item.path);

                        return (
                            <div key={groupIndex} className="space-y-1.5">
                                <button
                                    onClick={() => toggleGroup(group.title)}
                                    className={cn(
                                        "w-full px-4 flex items-center justify-between py-1 group/header transition-all duration-300",
                                        hasActive ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em]">{group.title}</span>
                                    <div className={cn(
                                        "p-1 rounded-md transition-all duration-300 transform",
                                        isExpanded ? "bg-white/5 text-white rotate-0" : "group-hover/header:bg-white/5 rotate-0"
                                    )}>
                                        <ChevronDown className={cn(
                                            "w-3.5 h-3.5 transition-transform duration-300",
                                            isExpanded ? "transform rotate-180" : ""
                                        )} />
                                    </div>
                                </button>

                                <div className={cn(
                                    "space-y-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden px-1",
                                    isExpanded ? "max-h-[600px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
                                )}>
                                    {group.items.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                                    isActive
                                                        ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30 ring-1 ring-white/10"
                                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                                )}
                                                onClick={() => setIsSidebarOpen(false)}
                                            >
                                                <item.icon className={cn(
                                                    "w-4 h-4 transition-all duration-300",
                                                    isActive ? "text-white scale-110 drop-shadow-md" : "group-hover:text-blue-400 group-hover:scale-110"
                                                )} />
                                                <span className={cn(
                                                    "text-sm tracking-wide flex-1 font-medium transition-colors duration-300",
                                                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                                )}>{item.label}</span>

                                                {item.path === '/admin/members' && badges.members > 0 && (
                                                    <span className={cn(
                                                        "text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg transition-colors duration-300",
                                                        isActive ? "bg-white text-blue-600" : "bg-blue-600 text-white"
                                                    )}>{badges.members}</span>
                                                )}
                                                {item.path === '/admin/premium' && badges.premium > 0 && (
                                                    <span className={cn(
                                                        "text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg transition-colors duration-300",
                                                        isActive ? "bg-white text-orange-600" : "bg-orange-600 text-white"
                                                    )}>{badges.premium}</span>
                                                )}

                                                {/* Active Indicator Light */}
                                                {isActive && (
                                                    <div className="absolute top-1/2 -left-3 w-4 h-4 bg-blue-400 rounded-full blur-md opacity-20 -translate-y-1/2" />
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
                        className="md:hidden flex items-center gap-3 px-5 py-3.5 w-full text-red-500 hover:bg-red-500/10 rounded-2xl mt-8 transition-all duration-300 border border-transparent hover:border-red-500/20 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-black text-[11px] uppercase tracking-[0.2em]">Logout Sistem</span>
                    </button>

                    <div className="pt-10 pb-6 text-center px-4 border-t border-white/5">
                        <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase opacity-60">
                            &copy; {new Date().getFullYear()} MGMP Informatika
                        </p>
                        <p className="text-[9px] text-slate-600 font-mono mt-1 font-medium italic">MGMP Admin Platform v2.2.0</p>
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50/30 relative">
                {/* Top Desktop Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 shadow-sm z-40">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center">
                            {/* Mobile Branding (Logo + Text) */}
                            <div className="lg:hidden flex items-center gap-2.5 ml-1">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-9 h-9 object-contain" />
                                ) : (
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                                        <Crown className="w-5 h-5" />
                                    </div>
                                )}
                                <span className="font-extrabold text-xl tracking-tight text-slate-900">MGMP Admin</span>
                            </div>

                            <div className="hidden lg:block">
                                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    {(() => {
                                        let activeLabel = 'Dashboard';
                                        let ActiveIcon = LayoutDashboard;
                                        menuGroups.forEach(group => {
                                            const item = group.items.find(i => i.path === location.pathname);
                                            if (item) {
                                                activeLabel = item.label;
                                                ActiveIcon = item.icon;
                                            }
                                        });
                                        return (
                                            <>
                                                <ActiveIcon className="w-5 h-5 text-blue-600" />
                                                {activeLabel}
                                            </>
                                        );
                                    })()}
                                </h1>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Sistem Manajemen MGMP Terintegrasi</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="hidden xl:flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                            <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-blue-600 shadow-sm">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-600 tracking-tight">
                                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>

                        {/* Desktop Right: User Profile Dropdown */}
                        <div className="hidden lg:block relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className={cn(
                                    "flex items-center gap-2 p-1.5 px-1.5 rounded-2xl transition-all duration-300 border focus:outline-none",
                                    isProfileOpen ? "bg-gray-50 border-gray-200 shadow-sm ring-4 ring-blue-50" : "bg-transparent border-transparent hover:bg-gray-50 hover:border-gray-200"
                                )}
                            >
                                <UserProfileSection mobile={false} />
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-gray-100 py-2.5 animate-in fade-in zoom-in-95 slide-in-from-top-4 z-50 overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-50 mb-1.5 bg-slate-50 relative overflow-hidden group/dd-header">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover/dd-header:bg-blue-500/10 transition-colors duration-500" />
                                        <div className="relative z-10">
                                            <p className="text-sm font-black text-slate-900 truncate">{user?.nama}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[9px] bg-blue-600 text-white px-2.5 py-1 rounded-lg font-black tracking-widest flex items-center gap-1.5 shadow-sm">
                                                    <Crown className="w-3 h-3" /> ADMIN
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-2 font-medium truncate italic">{user?.email}</p>
                                        </div>
                                    </div>

                                    <div className="px-2.5 space-y-0.5">
                                        <Link
                                            to="/admin/settings"
                                            className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-white flex items-center justify-center transition-colors">
                                                <UserCircle className="w-4 h-4" />
                                            </div>
                                            Pengaturan Akun
                                        </Link>

                                        <Link
                                            to="/member"
                                            className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-all group"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-white flex items-center justify-center transition-colors">
                                                <User className="w-4 h-4" />
                                            </div>
                                            Area Anggota
                                        </Link>
                                    </div>

                                    <div className="h-px bg-slate-100 my-2 mx-5" />

                                    <div className="px-2.5">
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 px-3.5 py-3 text-sm font-black text-red-600 hover:bg-red-50 rounded-xl transition-all group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-red-100/50 group-hover:bg-white flex items-center justify-center transition-colors">
                                                <LogOut className="w-4 h-4" />
                                            </div>
                                            LOGOUT KELUAR
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative scrollbar-hide">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:32px_32px]" />

                    <div className="relative z-10 max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
