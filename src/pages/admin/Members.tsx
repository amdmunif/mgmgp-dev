import { useState, useEffect } from 'react';
import { memberService, type Profile } from '../../services/memberService';
import {
    Search,
    Filter,
    ShieldCheck,
    ShieldAlert,
    Crown,
    User,
    Mail,
    XCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function AdminMembers() {
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'Admin' | 'Member'>('all');

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const data = await memberService.getAll();
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async (id: string, currentRole: string) => {
        if (!confirm('Apakah Anda yakin ingin mengubah role member ini?')) return;

        const newRole = currentRole === 'Admin' ? 'Member' : 'Admin';
        try {
            await memberService.updateRole(id, newRole);
            fetchMembers(); // Refresh
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Gagal mengubah role');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus member ini? Tindakan ini tidak dapat dibatalkan.')) return;

        try {
            await memberService.delete(id);
            fetchMembers();
        } catch (error) {
            console.error('Error deleting member:', error);
            alert('Gagal menghapus member');
        }
    };

    const filteredMembers = members.filter(member => {
        const matchesSearch =
            member.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || member.role === filterRole;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Anggota</h1>
                    <p className="text-gray-500">Kelola data anggota dan hak akses pengguna.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchMembers}>Refresh</Button>
                    <Button>Export Data</Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                        className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value as any)}
                    >
                        <option value="all">Semua Role</option>
                        <option value="Admin">Admin</option>
                        <option value="Member">Member</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Anggota</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bergabung</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Tidak ada anggota yang ditemukan.</td>
                                </tr>
                            ) : (
                                filteredMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                    {member.nama ? member.nama.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{member.nama || 'Tanpa Nama'}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <Mail className="w-3 h-3" />
                                                        {member.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${member.role === 'Admin'
                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                {member.role === 'Admin' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                {member.role || 'Member'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {member.subscription_status === 'premium' ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                                                        <Crown className="w-3 h-3 fill-amber-600" /> Premium
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-500">Reguler</span>
                                                )}
                                                {member.premium_until && (
                                                    <span className="text-[10px] text-gray-400">
                                                        Exp: {format(new Date(member.premium_until), 'd MMM yyyy')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {member.created_at ? format(new Date(member.created_at), 'd MMM yyyy', { locale: id }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handlePromote(member.id, member.role)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-purple-600 transition-colors"
                                                    title={member.role === 'Admin' ? "Turunkan jadi Member" : "Jadikan Admin"}
                                                >
                                                    {member.role === 'Admin' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(member.id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Hapus User"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Simple for now) */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                    <p>Menampilkan {filteredMembers.length} anggota</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>Previous</Button>
                        <Button variant="outline" size="sm" disabled>Next</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
