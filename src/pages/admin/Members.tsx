import { useState, useEffect } from 'react';
import { memberService, type Profile, type DuplicatePair } from '../../services/memberService';
import { useOutletContext, useLocation } from 'react-router-dom';
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
    Users,
    CheckCircle2,
    AlertCircle,
    Key
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getFileUrl } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';

import { DataTable } from '../../components/ui/DataTable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function AdminMembers() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const location = useLocation();
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('All');
    const [filterPremium, setFilterPremium] = useState('All');
    const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
    const [loadingDuplicates, setLoadingDuplicates] = useState(false);

    // Edit/View State
    const [editingMember, setEditingMember] = useState<Profile | null>(null);
    const [viewingMember, setViewingMember] = useState<Profile | null>(null);
    const [editForm, setEditForm] = useState({ nama: '', email: '', role: 'Anggota', is_active: 0 });
    const [primarySelections, setPrimarySelections] = useState<Record<number, 'id1' | 'id2'>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Tab: default dari location state jika ada
    const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'duplicates'>(
        location.state?.tab === 'inactive' ? 'inactive' : 'active'
    );

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

    const fetchDuplicates = async () => {
        setLoadingDuplicates(true);
        try {
            const data = await memberService.getDuplicates();
            setDuplicates(data || []);
        } catch (error) {
            console.error('Error fetching duplicates:', error);
            toast.error('Gagal mengambil data duplikat');
        } finally {
            setLoadingDuplicates(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'duplicates') {
            fetchDuplicates();
        }
    }, [activeTab]);

    // Derived state for counts
    const inactiveCount = members.filter(m => Number(m.is_active) === 0).length;

    // Helper: cek kelengkapan data anggota
    const isDataComplete = (m: Profile): boolean => {
        return !!(m.nama && m.asal_sekolah && m.no_hp && m.pendidikan_terakhir && m.jurusan && m.status_kepegawaian);
    };

    const getMissingFields = (m: Profile): string[] => {
        const missing: string[] = [];
        if (!m.nama) missing.push('Nama');
        if (!m.asal_sekolah) missing.push('Asal Sekolah');
        if (!m.no_hp) missing.push('No. HP');
        if (!m.pendidikan_terakhir) missing.push('Pendidikan');
        if (!m.jurusan) missing.push('Jurusan');
        if (!m.status_kepegawaian) missing.push('Status Kepegawaian');
        return missing;
    };

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

    const handleResetPassword = async (member: Profile) => {
        const newPassword = window.prompt(`Masukkan password baru untuk ${member.nama}:`);
        if (!newPassword) return;

        const toastId = toast.loading('Sedang mereset password...');
        try {
            await memberService.resetPassword(member.id, newPassword);
            toast.success('Password berhasil direset dan dikirim ke email', { id: toastId });
        } catch (error: any) {
            toast.error(error.message || 'Gagal mereset password', { id: toastId });
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
            'Hadir (Event)': m.attendance_count || 0
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Anggota");

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, `Data_Anggota_MGMP_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
        toast.success('Data berhasil diekspor');
    };

    const handleMergeDuplicates = () => {
        setActiveTab('duplicates');
    };

    const handleManualMerge = async (id1: string, id2: string) => {
        if (!confirm('Apakah Anda yakin ingin menggabungkan data ini? (Tindakan ini tidak dapat dibatalkan, Data 2 akan dihapus dan email akan dikirim)')) return;
        
        const toastId = toast.loading('Sedang memproses penggabungan...');
        try {
            await memberService.mergeDuplicate(id1, id2);
            toast.success('Berhasil menggabungkan data', { id: toastId });
            fetchDuplicates();
            fetchMembers(); // refresh list members also
        } catch (error) {
            toast.error('Gagal menggabungkan data.', { id: toastId });
            console.error(error);
        }
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
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{member.nama || 'Tanpa Nama'}</p>
                        {Number(member.is_new) === 1 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">Baru</span>
                        )}
                    </div>
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
            header: 'Hadir',
            accessorKey: 'attendance_count' as keyof Profile,
            cell: (member: Profile) => (
                <span className="text-sm font-medium text-gray-700">
                    {member.attendance_count || 0} Event
                </span>
            )
        },
        {
            header: 'Data Lengkap',
            accessorKey: 'asal_sekolah' as keyof Profile,
            className: 'w-32 text-center',
            cell: (member: Profile) => {
                const complete = isDataComplete(member);
                const missing = getMissingFields(member);
                return (
                    <div className="flex justify-center">
                        {complete ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                <CheckCircle2 className="w-3 h-3" /> Lengkap
                            </span>
                        ) : (
                            <span
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200 cursor-help"
                                title={`Belum lengkap: ${missing.join(', ')}`}
                            >
                                <AlertCircle className="w-3 h-3" /> Belum ({missing.length})
                            </span>
                        )}
                    </div>
                );
            }
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
                        onClick={() => handleResetPassword(member)}
                        className="p-2 hover:bg-yellow-50 rounded-lg text-gray-400 hover:text-yellow-600 transition-colors"
                        title="Reset Password"
                    >
                        <Key className="w-4 h-4" />
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
        <div className="flex flex-col md:flex-row gap-4 items-center">
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
            <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={handleMergeDuplicates} className="h-9 border-blue-200 text-blue-700 hover:bg-blue-50">Gabungkan Duplikat</Button>
                <Button variant="outline" size="sm" onClick={fetchMembers} className="h-9">Refresh</Button>
                <Button onClick={handleExport} size="sm" className="bg-green-600 hover:bg-green-700 h-9">Export Data</Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">


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
                <button
                    onClick={() => setActiveTab('duplicates')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 flex items-center gap-2 ${activeTab === 'duplicates'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Data Duplikat
                </button>
            </div>

            {/* Data Table */}
            {activeTab !== 'duplicates' ? (
                loading ? (
                    <div className="p-8 text-center text-gray-500">Memuat data...</div>
                ) : (
                    <DataTable
                        data={filteredMembers}
                        columns={columns}
                        searchKeys={['nama', 'email']}
                        pageSize={10}
                        filterContent={FilterContent}
                    />
                )
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-orange-50 border border-orange-100 p-4 rounded-lg">
                        <div className="flex items-start gap-3 text-orange-800">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold">Sistem Penggabungan Data (Merge)</h3>
                                <p className="text-sm mt-1">Data berikut terdeteksi ganda berdasarkan kesamaan Email, No HP, atau Nama & Asal Sekolah. Silakan klik <strong>Gabungkan</strong> untuk menyatukan data 2 ke data 1. Data 1 (sebelah kiri) akan dipertahankan sebagai akun utama.</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchDuplicates} className="shrink-0 bg-white hover:bg-orange-100 text-orange-700 border-orange-300">
                            Refresh Data
                        </Button>
                    </div>

                    {loadingDuplicates ? (
                        <div className="p-8 text-center text-gray-500">Memuat data duplikat...</div>
                    ) : duplicates.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-500">
                            <CheckCircle2 className="w-12 h-12 mx-auto text-green-400 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Semua Bersih!</h3>
                            <p>Tidak ditemukan data anggota yang ganda di dalam sistem.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {duplicates.map((dup, index) => {
                                const selectedPrimary = primarySelections[index] || 'id1';
                                const isPrimary1 = selectedPrimary === 'id1';
                                
                                return (
                                <div key={index} className="flex flex-col p-5 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-blue-300 transition-colors">
                                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                                        <h4 className="font-semibold text-gray-900">Pilih Akun Utama</h4>
                                        <p className="text-xs text-gray-500">Akun yang tidak dipilih akan dihapus dan datanya digabungkan ke akun utama.</p>
                                    </div>
                                    <div className="flex flex-col xl:flex-row items-center gap-6">
                                        
                                        {/* Data 1 */}
                                        <label className={`flex-1 w-full p-4 rounded-lg border-2 cursor-pointer transition-all ${isPrimary1 ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-gray-50 opacity-70 hover:opacity-100'}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="radio" 
                                                        name={`primary_${index}`} 
                                                        checked={isPrimary1}
                                                        onChange={() => setPrimarySelections(prev => ({ ...prev, [index]: 'id1' }))}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isPrimary1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                                                        {isPrimary1 ? 'AKUN UTAMA' : 'AKAN DIHAPUS'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPrimary1 ? 'bg-blue-100' : 'bg-gray-200'}`}>
                                                    <User className={`w-5 h-5 ${isPrimary1 ? 'text-blue-600' : 'text-gray-500'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 truncate">{dup.nama1 || '-'}</h4>
                                                    <p className="text-sm text-gray-600 truncate">{dup.sekolah1 || '-'}</p>
                                                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                                                        <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {dup.email1}</p>
                                                        <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> {dup.attendance1} Kehadiran</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </label>

                                        {/* Gabungkan Action (Center) */}
                                        <div className="flex flex-col items-center justify-center shrink-0">
                                            <Button 
                                                onClick={() => handleManualMerge(
                                                    selectedPrimary === 'id1' ? dup.id1 : dup.id2, 
                                                    selectedPrimary === 'id1' ? dup.id2 : dup.id1
                                                )}
                                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md flex-col h-auto py-3 px-6"
                                            >
                                                <span className="text-sm font-bold uppercase tracking-wider">Gabungkan</span>
                                            </Button>
                                        </div>

                                        {/* Data 2 */}
                                        <label className={`flex-1 w-full p-4 rounded-lg border-2 cursor-pointer transition-all ${!isPrimary1 ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-gray-50 opacity-70 hover:opacity-100'}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="radio" 
                                                        name={`primary_${index}`} 
                                                        checked={!isPrimary1}
                                                        onChange={() => setPrimarySelections(prev => ({ ...prev, [index]: 'id2' }))}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${!isPrimary1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                                                        {!isPrimary1 ? 'AKUN UTAMA' : 'AKAN DIHAPUS'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!isPrimary1 ? 'bg-blue-100' : 'bg-gray-200'}`}>
                                                    <User className={`w-5 h-5 ${!isPrimary1 ? 'text-blue-600' : 'text-gray-500'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 truncate">{dup.nama2 || '-'}</h4>
                                                    <p className="text-sm text-gray-600 truncate">{dup.sekolah2 || '-'}</p>
                                                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                                                        <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {dup.email2}</p>
                                                        <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> {dup.attendance2} Kehadiran</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </label>

                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* View Modal */}
            {viewingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">Detail Anggota</h2>
                            <button onClick={() => setViewingMember(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Body (Scrollable) */}
                        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                                    {viewingMember.foto_profile ? (
                                        <img src={getFileUrl(viewingMember.foto_profile)} alt={viewingMember.nama} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-2xl">
                                            {viewingMember.nama ? viewingMember.nama.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{viewingMember.nama}</h3>
                                    <p className="text-gray-500">{viewingMember.email}</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border mt-2 ${Number(viewingMember.is_active) === 1
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                        {Number(viewingMember.is_active) === 1 ? 'Aktif' : 'Pending'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Informasi Pribadi & Pekerjaan</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 mb-1">Asal Sekolah</p>
                                        <p className="font-medium text-gray-900">{viewingMember.asal_sekolah || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Pendidikan Terakhir</p>
                                        <p className="font-medium text-gray-900">{viewingMember.pendidikan_terakhir || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Jurusan</p>
                                        <p className="font-medium text-gray-900">{viewingMember.jurusan || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Status Kepegawaian</p>
                                        <p className="font-medium text-gray-900">{viewingMember.status_kepegawaian || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">No. HP / WhatsApp</p>
                                        <p className="font-medium text-gray-900">{viewingMember.no_hp || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Ukuran Baju</p>
                                        <p className="font-medium text-gray-900">{viewingMember.ukuran_baju || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Informasi Mengajar</h4>
                                <div className="grid grid-cols-1 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 mb-1">Mata Pelajaran Ampu</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(() => {
                                                try {
                                                    const mapel = viewingMember.mapel
                                                        ? (typeof viewingMember.mapel === 'string' ? JSON.parse(viewingMember.mapel) : viewingMember.mapel)
                                                        : [];
                                                    return Array.isArray(mapel) && mapel.length > 0
                                                        ? mapel.map((m: string, idx: number) => (
                                                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{m}</span>
                                                        ))
                                                        : <span className="text-gray-400">-</span>;
                                                } catch (e) { return <span className="text-gray-400">-</span> }
                                            })()}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Kelas Ampu</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(() => {
                                                try {
                                                    const kelas = viewingMember.kelas
                                                        ? (typeof viewingMember.kelas === 'string' ? JSON.parse(viewingMember.kelas) : viewingMember.kelas)
                                                        : [];
                                                    return Array.isArray(kelas) && kelas.length > 0
                                                        ? kelas.map((k: string, idx: number) => (
                                                            <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">{k}</span>
                                                        ))
                                                        : <span className="text-gray-400">-</span>;
                                                } catch (e) { return <span className="text-gray-400">-</span> }
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Informasi Akun</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 mb-1">Role / Hak Akses</p>
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${viewingMember.role === 'Admin'
                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                            : 'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}>
                                            {viewingMember.role || 'Anggota'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Status Langganan</p>
                                        {(viewingMember.premium_until && new Date(viewingMember.premium_until) > new Date()) ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                <Crown className="w-3 h-3 fill-amber-600" /> Premium
                                            </span>
                                        ) : (
                                            <span className="text-gray-500 font-medium">Reguler</span>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500 mb-1">Jumlah Kehadiran Event</p>
                                        <p className="font-medium text-gray-900">{viewingMember.attendance_count || 0} Event</p>
                                    </div>
                                </div>
                            </div>

                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 px-6 border-t border-gray-100 shrink-0 flex justify-end bg-gray-50">
                            <Button onClick={() => setViewingMember(null)}>Tutup</Button>
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
