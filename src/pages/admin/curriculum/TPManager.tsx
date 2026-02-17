import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { curriculumService } from '../../../services/curriculumService';
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, Save, Filter, ListChecks } from 'lucide-react';
import type { TPData } from '../../../types';
import { DataTable } from '../../../components/ui/DataTable';
import { useOutletContext } from 'react-router-dom';

export function TPManager() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [view, setView] = useState<'list' | 'form'>('list');
    const [tps, setTps] = useState<TPData[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Filters
    const [filterMapel, setFilterMapel] = useState<string>('all');
    const [filterKelas, setFilterKelas] = useState<string>('all');
    const [filterSemester, setFilterSemester] = useState<string>('all');

    // Form State
    const [formData, setFormData] = useState<Partial<TPData>>({});
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Tujuan Pembelajaran (TP)',
                description: 'Kelola Tujuan Pembelajaran (TP) untuk Bank Soal dan Rapor.',
                icon: <ListChecks className="w-6 h-6" />
            });
        }
    }, [setPageHeader]);

    useEffect(() => {
        if (view === 'list') {
            fetchTPs();
        }
    }, [view, filterMapel, filterKelas, filterSemester]);

    const fetchTPs = async () => {
        setLoading(true);
        try {
            const data = await curriculumService.getTPs({
                mapel: filterMapel,
                kelas: filterKelas,
                semester: filterSemester
            });
            setTps(data);
        } catch (error) {
            console.error(error);
            alert('Gagal mengambil data TP');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setFormData({
            mapel: filterMapel !== 'all' ? filterMapel as any : 'Informatika',
            kelas: filterKelas !== 'all' ? filterKelas as any : '7',
            semester: filterSemester !== 'all' ? filterSemester as any : 'Ganjil',
            code: '',
            materi: '',
            tujuan: ''
        });
        setEditingId(null);
        setView('form');
    };

    const handleEdit = (tp: TPData) => {
        setFormData(tp);
        setEditingId(tp.id);
        setView('form');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus TP ini?')) return;
        try {
            await curriculumService.deleteTP(id);
            fetchTPs();
        } catch (error) {
            console.error(error);
            alert('Gagal menghapus TP');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await curriculumService.updateTP(editingId, formData);
            } else {
                await curriculumService.createTP(formData as any);
            }
            alert('Data TP berhasil disimpan');
            setView('list');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan data TP');
        } finally {
            setSaving(false);
        }
    };

    if (view === 'form') {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => setView('list')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-4xl mx-auto">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-800">
                            {editingId ? 'Edit Data TP' : 'Input Data TP Baru'}
                        </h2>
                        <p className="text-gray-500 mt-1">Silakan lengkapi data Tujuan Pembelajaran di bawah ini.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Metadata Sidebar */}
                        <div className="space-y-6 lg:col-span-1">
                            <div className="bg-gray-50/50 p-6 rounded-xl border border-dashed border-gray-200 space-y-6">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Konfigurasi
                                </h3>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Mata Pelajaran</label>
                                    <select
                                        className="w-full rounded-lg border-gray-300 bg-white py-2.5 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700"
                                        value={formData.mapel}
                                        onChange={e => setFormData({ ...formData, mapel: e.target.value as any })}
                                        required
                                    >
                                        <option value="Informatika">Informatika</option>
                                        <option value="KKA">Koding dan Kecerdasan Artifisial (KKA)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Kelas</label>
                                    <select
                                        className="w-full rounded-lg border-gray-300 bg-white py-2.5 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700"
                                        value={formData.kelas}
                                        onChange={e => setFormData({ ...formData, kelas: e.target.value as any })}
                                        required
                                    >
                                        <option value="7">Kelas 7</option>
                                        <option value="8">Kelas 8</option>
                                        <option value="9">Kelas 9</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Semester</label>
                                    <select
                                        className="w-full rounded-lg border-gray-300 bg-white py-2.5 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700"
                                        value={formData.semester}
                                        onChange={e => setFormData({ ...formData, semester: e.target.value as any })}
                                        required
                                    >
                                        <option value="Ganjil">Semester Ganjil</option>
                                        <option value="Genap">Semester Genap</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <label className="block text-xs font-semibold text-blue-700 uppercase mb-2">Petunjuk</label>
                                <ul className="text-xs text-blue-600 space-y-1 list-disc pl-4">
                                    <li>Kode TP: <b>[Kelas].[No]</b> (Misal: 7.1)</li>
                                    <li>Lingkup materi: Topik utama</li>
                                    <li>Deskripsi: Harus operasional</li>
                                </ul>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="lg:col-span-3 space-y-6">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Kode TP <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-gray-300 py-2.5 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                                            value={formData.code || ''}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="7.1.1"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Lingkup Materi <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-gray-300 py-2.5 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.materi || ''}
                                            onChange={e => setFormData({ ...formData, materi: e.target.value })}
                                            placeholder="Contoh: Berpikir Komputasional"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi Tujuan Pembelajaran <span className="text-red-500">*</span></label>
                                    <textarea
                                        className="w-full rounded-lg border-gray-300 py-3 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-40 leading-relaxed resize-y shadow-sm"
                                        value={formData.tujuan || ''}
                                        onChange={e => setFormData({ ...formData, tujuan: e.target.value })}
                                        placeholder="Peserta didik mampu..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 mt-8">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setView('list')}
                                    className="px-6"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Simpan Data
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">


            {/* Filters */}
            {/* List */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <DataTable
                    data={tps}
                    columns={[
                        {
                            header: 'Kode',
                            accessorKey: 'code',
                            className: 'w-32',
                            cell: (tp: TPData) => <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{tp.code || '-'}</span>
                        },
                        {
                            header: 'Lingkup Materi',
                            accessorKey: 'materi',
                            className: 'w-1/4 font-medium text-gray-900'
                        },
                        {
                            header: 'Tujuan Pembelajaran',
                            accessorKey: 'tujuan',
                            cell: (tp: TPData) => <div className="text-gray-600 line-clamp-2">{tp.tujuan}</div>
                        },
                        {
                            header: 'Aksi',
                            className: 'text-right w-32',
                            cell: (tp: TPData) => (
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => handleEdit(tp)}
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tp.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    searchKeys={['code', 'materi', 'tujuan']}
                    pageSize={10}
                    filterContent={
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700 mr-2">Filter:</span>

                            <select
                                className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                                value={filterMapel}
                                onChange={e => setFilterMapel(e.target.value as any)}
                            >
                                <option value="all">Semua Mapel</option>
                                <option value="Informatika">Informatika</option>
                                <option value="KKA">Koding & Kecerdasan Artifisial</option>
                            </select>

                            <select
                                className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                                value={filterKelas}
                                onChange={e => setFilterKelas(e.target.value)}
                            >
                                <option value="all">Semua Kelas</option>
                                <option value="7">Kelas 7</option>
                                <option value="8">Kelas 8</option>
                                <option value="9">Kelas 9</option>
                            </select>

                            <select
                                className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                                value={filterSemester}
                                onChange={e => setFilterSemester(e.target.value)}
                            >
                                <option value="all">Semua Semester</option>
                                <option value="Ganjil">Semester Ganjil</option>
                                <option value="Genap">Semester Genap</option>
                            </select>
                            <Button onClick={handleCreate} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 h-9 ml-2">
                                <Plus className="w-4 h-4 mr-1" />
                                Tambah TP
                            </Button>
                        </div>
                    }
                />
            )}
        </div>
    );
}
