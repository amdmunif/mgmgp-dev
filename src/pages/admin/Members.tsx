import { useState, useEffect } from 'react';
import { memberService, type Profile } from '../../services/memberService';
import { useOutletContext } from 'react-router-dom';
import {
    ShieldCheck,
    Crown,
    User,
    Mail,
    XCircle,
    Pencil,
    X,
    Eye,
    Filter,
    Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getFileUrl } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DataTable } from '../../components/ui/DataTable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function AdminMembers() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('All');
    const [filterPremium, setFilterPremium] = useState('All');

    // Edit/View State
    const [editingMember, setEditingMember] = useState<Profile | null>(null);
    const [viewingMember, setViewingMember] = useState<Profile | null>(null);
    const [editForm, setEditForm] = useState({ nama: '', email: '', role: 'Anggota', is_active: 0 });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Manajemen Anggota',
                description: 'Kelola data anggota dan hak akses pengguna.',
                icon: <Users className="w-6 h-6" />
            });
        }
        fetchMembers();
    }, [setPageHeader]);

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

    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

    // Derived state for counts
    const inactiveCount = members.filter(m => Number(m.is_active) === 0).length;

    const filteredMembers = members
        .filter(m => {
            // First filter by Tab (Active vs Inactive)
            const isActive = Number(m.is_active) === 1;
            if (activeTab === 'active' && !isActive) return false;
            if (activeTab === 'inactive' && isActive) return false;

            // Then filter by Role
            if (filterRole !== 'All' && m.role !== filterRole) return false;

            // Then filter by Premium
            const isPremium = m.premium_until && new Date(m.premium_until) > new Date();
            if (filterPremium === 'Premium' && !isPremium) return false;
            if (filterPremium === 'Reguler' && isPremium) return false;

            return true;
        })
        .sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

    const handleActivate = async (member: Profile) => {
        if (!confirm(`Aktifkan akun ${member.nama}?`)) return;
        try {
            await memberService.update(member.id, { is_active: 1 });
            toast.success('Anggota berhasil diaktifkan');
            fetchMembers();
        } catch (error) {
            toast.error('Gagal mengaktifkan anggota');
        }
    };

    // ... existing handlers ...

    const handleEdit = (member: Profile) => {
        setEditingMember(member);
        setEditForm({
            nama: member.nama || '',
            email: member.email || '',
            role: member.role || 'Anggota',
            is_active: Number(member.is_active) === 1 ? 1 : 0
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus member ini?')) return;
        try {
            await memberService.delete(id);
            toast.success('Anggota dihapus');
            fetchMembers();
        } catch (error) {
            toast.error('Gagal menghapus anggota');
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;
        setIsSaving(true);
        try {
            await memberService.update(editingMember.id, {
                nama: editForm.nama,
                email: editForm.email,
                role: editForm.role as 'Admin' | 'Anggota' | 'Pengurus',
                is_active: Number(editForm.is_active)
            });
            toast.success('Anggota berhasil diupdate');
            fetchMembers();
            setEditingMember(null);
        } catch (error) {
            console.error(error);
            toast.error('Gagal update anggota');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = () => {
        if (filteredMembers.length === 0) {
            return toast.error('Tidak ada data untuk diekspor');
        }

        const dataToExport = filteredMembers.map(m => ({
            'Nama': m.nama,
            'Email': m.email,
            'Role': m.role,
            'Status': Number(m.is_active) === 1 ? 'Aktif' : 'Pending',
            'Tipe Akun': (m.premium_until && new Date(m.premium_until) > new Date()) ? 'Premium' : 'Reguler',
            'Tanggal Bergabung': m.created_at ? format(new Date(m.created_at), 'yyyy-MM-dd') : '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Anggota");

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, `Data_Anggota_MGMP_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
        toast.success('Data berhasil diekspor');
    };

    // Enhanced columns with Activate shortcut for Inactive tab
    const columns = [
        // ... Photo, Name, Role ...
        {
            header: 'Foto',
            accessorKey: 'foto_profile' as keyof Profile,
            className: 'w-16',
            cell: (member: Profile) => (
                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                    {member.foto_profile ? (
                        <img src={getFileUrl(member.foto_profile)} alt={member.nama} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                            {member.nama ? member.nama.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Nama',
            accessorKey: 'nama' as keyof Profile,
            cell: (member: Profile) => (
                <div>
                    <p className="font-semibold text-gray-900">{member.nama || 'Tanpa Nama'}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Mail className="w-3 h-3" />
                        {member.email}
                    </div>
                </div>
            )
        },
        {
            header: 'Role',
            accessorKey: 'role' as keyof Profile,
            cell: (member: Profile) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${member.role === 'Admin'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                    {member.role === 'Admin' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {member.role || 'Anggota'}
                </span>
            )
        },
        {
            header: 'Status',
            accessorKey: 'is_active' as keyof Profile,
            cell: (member: Profile) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${Number(member.is_active) === 1
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                    {Number(member.is_active) === 1 ? 'Aktif' : 'Pending'}
                </span>
            )
        },
        {
            header: 'Langganan',
            accessorKey: 'premium_until' as keyof Profile,
            cell: (member: Profile) => (
                <div className="flex flex-col gap-1">
                    {(member.premium_until && new Date(member.premium_until) > new Date()) ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                            <Crown className="w-3 h-3 fill-amber-600" /> Premium
                        </span>
                    ) : (
                        <span className="text-xs text-gray-500">Reguler</span>
                    )}
                </div>
            )
        },
        {
            header: 'Bergabung',
            accessorKey: 'created_at' as keyof Profile,
            cell: (member: Profile) => (
                <span className="text-sm text-gray-500">
                    {member.created_at ? format(new Date(member.created_at), 'd MMM yyyy', { locale: id }) : '-'}
                </span>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right',
            cell: (member: Profile) => (
                <div className="flex items-center justify-end gap-2">
                    {activeTab === 'inactive' && (
                        <button
                            onClick={() => handleActivate(member)}
                            className="p-2 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors"
                            title="Aktifkan Anggota"
                        >
                            <ShieldCheck className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => setViewingMember(member)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                        title="Lihat Detail"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleEdit(member)}
                        className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit Anggota"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(member.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                        title="Hapus User"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    const FilterContent = (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="All">Semua Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Anggota">Anggota</option>
                    <option value="Pengurus">Pengurus</option>
                </select>
            </div>
            <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-gray-500" />
                <select
                    value={filterPremium}
                    onChange={(e) => setFilterPremium(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="All">Semua Status Akun</option>
                    <option value="Premium">Premium</option>
                    <option value="Reguler">Reguler</option>
                </select>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={fetchMembers}>Refresh</Button>
                <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">Export Data</Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === 'active'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Anggota Aktif
                </button>
                <button
                    onClick={() => setActiveTab('inactive')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 flex items-center gap-2 ${activeTab === 'inactive'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Verifikasi Anggota
                    {inactiveCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center">
                            {inactiveCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Data Table */}
            {loading ? (
                <div className="p-8 text-center text-gray-500">Memuat data...</div>
            ) : (
                <DataTable
                    data={filteredMembers}
                    columns={columns}
                    searchKeys={['nama', 'email']}
                    pageSize={10}
                    filterContent={FilterContent}
                />
            )}

            {/* View Modal */}
            {viewingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Detail Anggota</h2>
                            <button onClick={() => setViewingMember(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                                    {viewingMember.foto_profile ? (
                                        <img src={getFileUrl(viewingMember.foto_profile)} alt={viewingMember.nama} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-xl">
                                            {viewingMember.nama ? viewingMember.nama.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{viewingMember.nama}</h3>
                                    <p className="text-sm text-gray-500">{viewingMember.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 mb-1">Role</p>
                                    <p className="font-medium text-gray-900">{viewingMember.role}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Status</p>
                                    <p className="font-medium text-gray-900">{Number(viewingMember.is_active) ? 'Aktif' : 'Non-Aktif'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Bergabung</p>
                                    <p className="font-medium text-gray-900">{viewingMember.created_at ? new Date(viewingMember.created_at).toLocaleDateString() : '-'}</p>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <Button onClick={() => setViewingMember(null)}>Tutup</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Edit Anggota</h2>
                            <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={editForm.nama}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, nama: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status Akun</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={Number(editForm.is_active) === 1}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))}
                                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    />
                                    <label htmlFor="isActive" className="text-sm text-gray-700">Aktifkan Anggota</label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role / Hak Akses</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                                >
                                    <option value="Anggota">Anggota Reguler</option>
                                    <option value="Admin">Administrator</option>
                                    <option value="Pengurus">Pengurus</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingMember(null)}>Batal</Button>
                                <Button type="submit" className="flex-1" disabled={isSaving}>
                                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
