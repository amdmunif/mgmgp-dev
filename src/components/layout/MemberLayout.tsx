import { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import {
    LayoutDashboard,
    User,
    LogOut,
    Menu,
    X,
    Gamepad2,
    Terminal,
    BookOpen,
    Crown
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function MemberLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        // Check current auth status
        authService.getCurrentUser().then((data) => {
            if (!data?.user) {
                navigate('/login');
            } else {
                // Prefer profile if available for role check
                setUser(data.profile || data.user);
            }
        });

        const { data: { subscription } } = authService.onAuthStateChange(async (session) => {
            if (!session) {
                navigate('/login');
            } else {
                const { profile } = await authService.getCurrentUser() || {};
                setUser(profile || session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/member' },
        { icon: User, label: 'Identitas Diri', path: '/member/profile' },
        { icon: Gamepad2, label: 'Bank Soal (Games)', path: '/member/questions' },
        { icon: Terminal, label: 'Prompt Library', path: '/member/prompts' },
        { icon: BookOpen, label: 'Referensi Belajar', path: '/member/references' },
    ];

    if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed md:static inset-y-0 left-0 z-50 w-64 bg-white text-gray-800 border-r border-gray-200 transition-transform duration-200 ease-in-out transform flex flex-col shadow-lg font-sans",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center shadow-md">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">Member Area</h2>
                            <p className="text-xs text-gray-500 font-medium tracking-wide">MGMP Informatika</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500 hover:bg-gray-100 p-1 rounded transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User Info Capsule (Optional visual element) */}
                <div className="px-6 py-4">
                    <div className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs ring-2 ring-white">
                            {user.email?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-gray-900 truncate">{user.user_metadata?.nama || 'Member'}</p>
                            <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2">
                    <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium",
                                location.pathname === item.path
                                    ? "bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <item.icon className={cn(
                                "w-4 h-4 transition-colors",
                                location.pathname === item.path ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"
                            )} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-gray-100">
                    {/* Admin Link if capable */}
                    {['Admin', 'Pengurus'].includes(user?.role) && (
                        <Link
                            to="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 mb-2 w-full text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors text-sm font-bold border border-primary-200"
                        >
                            <Crown className="w-4 h-4" />
                            Admin Dashboard
                        </Link>
                    )}

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                    <p className="text-[10px] text-center text-gray-300 mt-4">v2.0.0 MGMP App</p>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="bg-white border-b border-gray-200 py-3 px-4 md:hidden flex items-center justify-between shadow-sm z-30">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center">
                            <span className="font-bold text-xs">M</span>
                        </div>
                        <span className="font-bold text-gray-900">Member Area</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Menu className="w-5 h-5" />
                    </button>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 p-4 md:p-8">
                    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
