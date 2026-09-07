import React, { useState, useEffect, useCallback } from 'react';
import { 
    School, Plus, PlusCircle, Search, MapPin, 
    Trash2, CheckCircle2, RefreshCw, 
    Loader2, ShieldAlert, X, Building2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { authService } from '../../services/authService';
import { schoolService } from '../../services/schoolService';
import { KECAMATAN_LIST, type SchoolItem, addSchoolToCache } from '../../data/schoolsData';

export function AdminSchools() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    const [schools, setSchools] = useState<SchoolItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [kecFilter, setKecFilter] = useState('');

    // Form state for adding new school
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ nama: '', kecamatan: '', npsn: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        authService.getCurrentUser().then(data => {
            setCurrentUser(data?.user || null);
            setCheckingAuth(false);
        }).catch(() => {
            setCheckingAuth(false);
        });
    }, []);

    const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin';

    const fetchSchools = useCallback(async () => {
        try {
            setLoading(true);
            const data = await schoolService.getSchools();
            setSchools(data);
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat katalog data sekolah');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!checkingAuth && isAdmin) {
            fetchSchools();
        }
    }, [checkingAuth, isAdmin, fetchSchools]);

    if (checkingAuth) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-sm font-medium text-gray-500">Memeriksa hak akses...</p>
            </div>
        );
    }

    // Role check guard
    if (!isAdmin) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Akses Dibatasi</h2>
                        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                            Halaman Master Data Sekolah hanya dapat diakses oleh Administrator sistem.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const handleCreateSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nama.trim() || !formData.kecamatan.trim()) {
            toast.error('Nama sekolah dan kecamatan wajib diisi');
            return;
        }

        try {
            setSubmitting(true);
            const res = await schoolService.addSchool({
                nama: formData.nama.trim(),
                kecamatan: formData.kecamatan.trim(),
                npsn: formData.npsn.trim() || undefined
            });

            toast.success(res.message || 'Sekolah berhasil ditambahkan ke database');
            addSchoolToCache(res.school);
            setFormData({ nama: '', kecamatan: '', npsn: '' });
            setIsFormOpen(false);
            fetchSchools();
        } catch (err: any) {
            toast.error(err?.message || 'Gagal menyimpan sekolah');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSchool = async (school: SchoolItem) => {
        if (!school.id) return;
        if (!confirm(`Hapus sekolah "${school.nama}" dari database master?`)) return;

        try {
            await schoolService.deleteSchool(school.id);
            toast.success('Sekolah berhasil dihapus');
            fetchSchools();
        } catch (err: any) {
            toast.error(err?.message || 'Gagal menghapus sekolah');
        }
    };

    // Filtered schools
    const filteredSchools = schools.filter(s => {
        const matchesSearch = !search.trim() || 
            s.nama.toLowerCase().includes(search.toLowerCase()) || 
            (s.npsn && s.npsn.toLowerCase().includes(search.toLowerCase()));
        const matchesKec = !kecFilter || s.kecamatan.toLowerCase() === kecFilter.toLowerCase();
        return matchesSearch && matchesKec;
    });

    // Unique kecamatan counts
    const coveredKecamatans = new Set(schools.map(s => s.kecamatan.toLowerCase())).size;

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-indigo-950/20">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
                        <School className="w-3.5 h-3.5" />
                        <span>Katalog Master Sistem</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Kelola Master Sekolah
                    </h1>
                    <p className="text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
                        Katalog data sekolah resmi Kabupaten Wonosobo. Data ini menjadi sumber pilihan otomatis pada formulir pendaftaran dan edit profil anggota.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
                    >
                        {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{isFormOpen ? 'Tutup Formulir' : '+ Tambah Sekolah Baru'}</span>
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                        <School className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sekolah</div>
                        <div className="text-2xl font-black text-gray-900 mt-0.5">{schools.length}</div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kecamatan Terdata</div>
                        <div className="text-2xl font-black text-gray-900 mt-0.5">{coveredKecamatans} / 15</div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Database</div>
                        <div className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Tabel master_schools Aktif</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collapsible Form Card: Tambah Sekolah Baru */}
            {isFormOpen && (
                <div className="bg-white p-6 rounded-2xl border-2 border-indigo-200 shadow-md animate-in fade-in slide-in-from-top-3 duration-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2 text-indigo-900 font-bold text-base">
                            <PlusCircle className="w-5 h-5 text-indigo-600" />
                            <span>Formulir Tambah Sekolah Baru ke Database</span>
                        </div>
                        <button
                            onClick={() => setIsFormOpen(false)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <form onSubmit={handleCreateSchool} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Nama Sekolah Lengkap <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nama}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                                    placeholder="Contoh: SMP IT Bina Insani / SMP Ma'arif ..."
                                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                />
                                <p className="text-[11px] text-gray-400">Gunakan format nama resmi (contoh: SMP Negeri 1 ..., SMP Ma'arif ...)</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Kecamatan <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.kecamatan}
                                    onChange={(e) => setFormData(prev => ({ ...prev, kecamatan: e.target.value }))}
                                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                >
                                    <option value="">-- Pilih Kecamatan --</option>
                                    {KECAMATAN_LIST.map((kec) => (
                                        <option key={kec} value={kec}>Kec. {kec}</option>
                                    ))}
                                    <option value="Lainnya">Lainnya / Luar Wonosobo</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    NPSN <span className="text-gray-400 font-normal">(Opsional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.npsn}
                                    onChange={(e) => setFormData(prev => ({ ...prev, npsn: e.target.value }))}
                                    placeholder="Contoh: 20306796"
                                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsFormOpen(false)}
                                className="h-10 text-xs px-4"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 px-6 rounded-xl shadow-md shadow-indigo-600/20"
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Menyimpan ke Database...</span>
                                    </span>
                                ) : (
                                    <span>Simpan Sekolah ke Database</span>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan nama sekolah atau NPSN..."
                            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="w-56">
                        <select
                            value={kecFilter}
                            onChange={(e) => setKecFilter(e.target.value)}
                            className="w-full py-2 px-3 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
                        >
                            <option value="">Semua Kecamatan ({schools.length})</option>
                            {KECAMATAN_LIST.map((kec) => {
                                const count = schools.filter(s => s.kecamatan.toLowerCase() === kec.toLowerCase()).length;
                                return (
                                    <option key={kec} value={kec}>
                                        Kec. {kec} ({count})
                                    </option>
                                );
                            })}
                            <option value="Lainnya">Lainnya / Luar Wonosobo</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                    {(search || kecFilter) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSearch(''); setKecFilter(''); }}
                            className="text-xs text-gray-500 hover:text-gray-700 h-9"
                        >
                            Reset Filter
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchSchools}
                        className="text-xs h-9 flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Segarkan</span>
                    </Button>
                </div>
            </div>

            {/* Table of Schools */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="text-sm font-medium">Memuat katalog master sekolah...</span>
                    </div>
                ) : filteredSchools.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 space-y-3">
                        <Building2 className="w-12 h-12 mx-auto text-gray-300" />
                        <div className="space-y-1">
                            <p className="text-base font-semibold text-gray-700">Tidak ada sekolah yang cocok</p>
                            <p className="text-xs text-gray-400">Coba ubah kata kunci pencarian atau filter kecamatan.</p>
                        </div>
                        {(search || kecFilter) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setSearch(''); setKecFilter(''); }}
                                className="text-xs"
                            >
                                Tampilkan Semua Sekolah
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/80 text-gray-600 font-semibold border-b border-gray-200 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="py-3.5 px-4 w-16 text-center">#</th>
                                    <th className="py-3.5 px-4 w-32">NPSN</th>
                                    <th className="py-3.5 px-4">Nama Sekolah</th>
                                    <th className="py-3.5 px-4 w-52">Kecamatan</th>
                                    <th className="py-3.5 px-4 w-36 text-center">Status Data</th>
                                    <th className="py-3.5 px-4 w-24 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSchools.map((school, idx) => (
                                    <tr key={school.id || school.nama} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3.5 px-4 text-center text-gray-400 font-mono text-xs">
                                            {idx + 1}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                                            {school.npsn ? (
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200 font-medium">
                                                    {school.npsn}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic text-[11px]">-</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-gray-900">{school.nama}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                                                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>Kec. {school.kecamatan}</span>
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Terverifikasi</span>
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            {school.id ? (
                                                <button
                                                    onClick={() => handleDeleteSchool(school)}
                                                    title="Hapus sekolah ini dari database master"
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <span className="text-gray-300 text-xs italic">Bawaan</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Table Footer */}
                <div className="p-4 bg-slate-50/70 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
                    <div>
                        Menampilkan <span className="font-bold text-gray-800">{filteredSchools.length}</span> dari{' '}
                        <span className="font-bold text-gray-800">{schools.length}</span> total sekolah terdaftar di database
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Seluruh sekolah otomatis terintegrasi ke form pendaftaran & edit profil</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
