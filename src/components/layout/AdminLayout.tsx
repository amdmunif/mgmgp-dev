import { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import {
    LayoutDashboard,
    FileText,
    Calendar,
    Users,
    User, // Added missing import
    LogOut,
    Settings,
    Crown,
    Menu,
    Gamepad2, // Added
    X,
    BookOpen
} from 'lucide-react';
import { cn } from '../../lib/utils';
// import { Button } from '../../components/ui/button';

export function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        // Initial check
        authService.getCurrentUser().then((data) => {
            if (!data?.user) {
                navigate('/login');
            } else {
                setUser(data.user);
            }
        });

        // Subscription
        const { data: { subscription } } = authService.onAuthStateChange((user) => {
            if (!user) navigate('/login');
            setUser(user);
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: BookOpen, label: 'Perangkat Ajar', path: '/admin/learning' },
        { icon: Gamepad2, label: 'Bank Soal', path: '/admin/questions' }, // Added
        { icon: Users, label: 'Anggota', path: '/admin/members' },
        { icon: Calendar, label: 'Agenda', path: '/admin/events' },
        { icon: Crown, label: 'Premium', path: '/admin/premium' },
        { icon: FileText, label: 'Surat', path: '/admin/letters' },
        { icon: Settings, label: 'Pengaturan', path: '/admin/settings' },
    ];

    if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed md:static inset-y-0 left-0 z-50 w-64 bg-primary-900 text-white border-r border-primary-800 transition-transform duration-200 ease-in-out transform flex flex-col shadow-2xl",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-6 flex items-center justify-between border-b border-primary-800">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                            <Crown className="w-5 h-5" />
                        </div>
                        MGMP Admin
                    </h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white hover:bg-primary-800 p-1 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                location.pathname === item.path
                                    ? "bg-primary-700 text-white shadow-md border border-primary-600/50"
                                    : "text-primary-100 hover:bg-primary-800 hover:text-white"
                            )}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", location.pathname === item.path ? "text-primary-200" : "text-primary-400 group-hover:text-white")} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-primary-800 bg-primary-950/30">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg">
                            {user?.email?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{user?.email?.split('@')[0]}</p>
                            <p className="text-xs text-primary-300 truncate">Administrator</p>
                        </div>
                    </div>
                </div>
                {/* Switch to Member View */}
                <Link
                    to="/member"
                    className="flex items-center gap-3 px-4 py-2 mb-2 text-primary-200 hover:bg-primary-800 hover:text-white rounded-lg w-full transition-colors text-sm font-medium"
                >
                    <User className="w-4 h-4" />
                    Switch to Member
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-red-300 hover:bg-red-500/10 hover:text-red-200 rounded-lg w-full transition-colors text-sm font-medium">
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <h1 className="font-bold text-lg">MGMP Dashboard</h1>
                    <button onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
