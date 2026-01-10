import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Search, Gamepad2, FileText } from 'lucide-react';
import { questionService } from '../../../services/questionService';
import type { QuestionBank } from '../../../types';

export function AdminQuestions() {
    const [questions, setQuestions] = useState<QuestionBank[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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

    const filtered = questions.filter(q => q.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Bank Soal</h1>
                <Button>
                    <Plus className="w-4 h-4 mr-2" /> Tambah Soal
                </Button>
            </div>

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
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        )}
                        {!loading && filtered.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Belum ada soal.</td></tr>
                        )}
                        {!loading && filtered.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{item.title}</td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                    {item.category === 'TTS' || item.category === 'Wordsearch' ? <Gamepad2 className="w-4 h-4 text-purple-500" /> : <FileText className="w-4 h-4 text-blue-500" />}
                                    {item.category}
                                </td>
                                <td className="px-6 py-4">{item.mapel}</td>
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
        </div>
    );
}
