import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Search, Terminal } from 'lucide-react';
import { promptService } from '../../../services/resourcesService';
import type { Prompt } from '../../../types';

export function AdminPrompts() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await promptService.getAll();
            setPrompts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus prompt ini?')) return;
        try {
            await promptService.delete(id);
            loadData();
        } catch (error) {
            alert('Gagal menghapus');
        }
    };

    const filtered = prompts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Prompt Library</h1>
                    <p className="text-gray-500">Kelola koleksi prompt AI untuk member.</p>
                </div>
                <Link to="/admin/prompts/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" /> Tambah Prompt
                    </Button>
                </Link>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cari prompt..."
                        className="pl-10 w-full rounded-lg border border-gray-300 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-200 font-semibold text-gray-600">
                        <tr>
                            <th className="px-6 py-4">Judul Prompt</th>
                            <th className="px-6 py-4">Kategori</th>
                            <th className="px-6 py-4">Deskripsi</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Belum ada prompt.</td></tr>
                        ) : (
                            filtered.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                                                <Terminal className="w-5 h-5" />
                                            </div>
                                            {item.title}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">{item.category}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{item.description}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
