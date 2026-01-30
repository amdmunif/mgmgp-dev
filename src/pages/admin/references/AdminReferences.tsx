import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Search, Book, Globe, Gamepad2, ExternalLink } from 'lucide-react';
import { referenceService } from '../../../services/resourcesService';
import type { Reference } from '../../../types';

export function AdminReferences() {
    const [refs, setRefs] = useState<Reference[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await referenceService.getAll();
            setRefs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus referensi ini?')) return;
        try {
            await referenceService.delete(id);
            loadData();
        } catch (error) {
            alert('Gagal menghapus');
        }
    };

    const filtered = refs.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

    const getIcon = (type: string) => {
        switch (type) {
            case 'Buku': return <Book className="w-5 h-5 text-blue-500" />;
            case 'Simulator': return <Globe className="w-5 h-5 text-green-500" />;
            case 'Game': return <Gamepad2 className="w-5 h-5 text-purple-500" />;
            default: return <Book className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Referensi Belajar</h1>
                    <p className="text-gray-500">Kelola daftar referensi buku, simulator, dan link belajar.</p>
                </div>
                <Link to="/admin/references/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" /> Tambah Referensi
                    </Button>
                </Link>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cari referensi..."
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
                            <th className="px-6 py-4">Judul Referensi</th>
                            <th className="px-6 py-4">Tipe</th>
                            <th className="px-6 py-4">Link / File</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Belum ada referensi.</td></tr>
                        ) : (
                            filtered.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                {getIcon(item.type)}
                                            </div>
                                            {item.title}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">{item.type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-blue-600">
                                        <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                            {item.link_url?.substring(0, 30)}... <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </td>
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
