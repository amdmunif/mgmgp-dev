import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { curriculumService } from '../../../services/curriculumService';
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, Save } from 'lucide-react';
import type { TPData } from '../../../types';

export function TPManager() {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [tps, setTps] = useState<TPData[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Filters
    const [filterMapel, setFilterMapel] = useState<'Informatika' | 'KKA'>('Informatika');
    const [filterKelas, setFilterKelas] = useState<string>('7');
    const [filterSemester, setFilterSemester] = useState<string>('Ganjil');

    // Form State
    const [formData, setFormData] = useState<Partial<TPData>>({});
    const [editingId, setEditingId] = useState<string | null>(null);

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
            mapel: filterMapel,
            kelas: filterKelas as any,
            semester: filterSemester as any,
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
                    <h1 className="text-2xl font-bold text-gray-900">
                        {editingId ? 'Edit Tujuan Pembelajaran' : 'Tambah Tujuan Pembelajaran'}
                    </h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    value={formData.mapel}
                                    onChange={e => setFormData({ ...formData, mapel: e.target.value as any })}
                                    required
                                >
                                    <option value="Informatika">Informatika</option>
                                    <option value="KKA">KKA</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    value={formData.semester}
                                    onChange={e => setFormData({ ...formData, semester: e.target.value as any })}
                                    required
                                >
                                    <option value="Ganjil">Ganjil</option>
                                    <option value="Genap">Genap</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kode TP</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    value={formData.code || ''}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="Contoh: 7.1.1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lingkup Materi</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    value={formData.materi || ''}
                                    onChange={e => setFormData({ ...formData, materi: e.target.value })}
                                    placeholder="Contoh: Berpikir Komputasional"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Pembelajaran</label>
                            <textarea
                                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-32"
                                value={formData.tujuan || ''}
                                onChange={e => setFormData({ ...formData, tujuan: e.target.value })}
                                placeholder="Tuliskan deskripsi Tujuan Pembelajaran..."
                                required
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Simpan
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Tujuan Pembelajaran (TP)</h1>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah TP
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4 flex-wrap">
                <select
                    className="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={filterMapel}
                    onChange={e => setFilterMapel(e.target.value as any)}
                >
                    <option value="Informatika">Informatika</option>
                    <option value="KKA">KKA</option>
                </select>
                <select
                    className="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={filterKelas}
                    onChange={e => setFilterKelas(e.target.value)}
                >
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                </select>
                <select
                    className="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={filterSemester}
                    onChange={e => setFilterSemester(e.target.value)}
                >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                </select>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : tps.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        Belum ada data TP untuk filter yang dipilih.
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 w-32">Kode</th>
                                <th className="px-6 py-3 w-1/4">Lingkup Materi</th>
                                <th className="px-6 py-3">Tujuan Pembelajaran</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tps.map(tp => (
                                <tr key={tp.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{tp.code || '-'}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{tp.materi}</td>
                                    <td className="px-6 py-4 text-gray-600">{tp.tujuan}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(tp)}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tp.id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
