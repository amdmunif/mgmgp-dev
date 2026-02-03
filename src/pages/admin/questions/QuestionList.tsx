import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Search, Gamepad2, FileText } from 'lucide-react';
import { questionService } from '../../../services/questionService';
import type { QuestionBank } from '../../../types';

export function AdminQuestions() {
    const [questions, setQuestions] = useState<QuestionBank[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        mapel: '',
        category: 'Latihan',
        is_premium: true,
        file: null as File | null
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await questionService.getAll();
            setQuestions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus soal ini?')) return;
        try {
            await questionService.delete(id);
            loadData();
        } catch (error) {
            alert('Gagal menghapus');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.mapel || !formData.file) {
            alert('Mohon lengkapi data (Judul, Mapel, File)');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Upload File
            const fileUrl = await questionService.uploadFile(formData.file);

            // 2. Create Question
            await questionService.create({
                title: formData.title,
                mapel: formData.mapel,
                category: formData.category,
                file_url: fileUrl,
                is_premium: formData.is_premium ? 1 : 0,
                game_data: null // Optional for now
            });

            // 3. Reset & Reload
            setIsModalOpen(false);
            setFormData({
                title: '',
                mapel: '',
                category: 'Latihan',
                is_premium: true,
                file: null
            });
            loadData();
            alert('Soal berhasil ditambahkan');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan soal');
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = questions.filter(q => q.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Bank Soal</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah Soal
                </Button>
            </div>

            {/* Existing Search & Table */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cari soal..."
                        className="pl-10 w-full rounded-md border border-gray-300 py-2"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 font-medium text-gray-600">
                        <tr>
                            <th className="px-6 py-4">Judul</th>
                            <th className="px-6 py-4">Kategori</th>
                            <th className="px-6 py-4">Mapel</th>
                            <th className="px-6 py-4">Premium</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        )}
                        {!loading && filtered.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Belum ada soal.</td></tr>
                        )}
                        {!loading && filtered.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{item.title}</td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                    {item.category === 'TTS' || item.category === 'Wordsearch' ? <Gamepad2 className="w-4 h-4 text-purple-500" /> : <FileText className="w-4 h-4 text-blue-500" />}
                                    {item.category}
                                </td>
                                <td className="px-6 py-4">{item.mapel}</td>
                                <td className="px-6 py-4">
                                    {item.is_premium ? <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Premium</span> : <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Free</span>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Tambah Soal Baru</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Soal</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={formData.mapel}
                                    onChange={e => setFormData({ ...formData, mapel: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="Latihan">Latihan</option>
                                    <option value="Ujian">Ujian</option>
                                    <option value="TTS">TTS</option>
                                    <option value="Wordsearch">Wordsearch</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">File Soal (PDF/Doc)</label>
                                <input
                                    type="file"
                                    required
                                    accept=".pdf,.doc,.docx"
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    onChange={e => setFormData({ ...formData, file: e.target.files ? e.target.files[0] : null })}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isPremium"
                                    checked={formData.is_premium}
                                    onChange={e => setFormData({ ...formData, is_premium: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <label htmlFor="isPremium" className="text-sm text-gray-700">Konten Premium</label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'Menyimpan...' : 'Simpan Soal'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
