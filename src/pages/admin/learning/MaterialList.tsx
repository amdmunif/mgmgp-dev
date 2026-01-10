import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Plus, Search, FileText, BookOpen, Presentation, File } from 'lucide-react';
import { learningService } from '../../../services/learningService';
import type { LearningMaterial, MaterialType } from '../../../types';
import { formatDate } from '../../../lib/utils'; // Assuming utils

export function AdminMaterials() {
    const [materials, setMaterials] = useState<LearningMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<MaterialType | 'all'>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadMaterials();
    }, [filterType]);

    const loadMaterials = async () => {
        setLoading(true);
        try {
            const type = filterType === 'all' ? undefined : filterType;
            const data = await learningService.getAll(type);
            setMaterials(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;
        try {
            await learningService.delete(id);
            loadMaterials();
        } catch (error) {
            console.error(error);
            alert('Gagal menghapus materi');
        }
    };

    const getIcon = (type: MaterialType) => {
        switch (type) {
            case 'cp': return <BookOpen className="w-5 h-5 text-blue-500" />;
            case 'tp': return <FileText className="w-5 h-5 text-green-500" />;
            case 'rpp': return <File className="w-5 h-5 text-orange-500" />;
            case 'slide': return <Presentation className="w-5 h-5 text-purple-500" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.mapel.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Perangkat Ajar</h1>
                    <p className="text-gray-500">Kelola CP, TP, RPP, dan Slide Presentasi</p>
                </div>
                <Link to="/admin/learning/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" /> Tambah Materi
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cari judul materi..."
                        className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                >
                    <option value="all">Semua Tipe</option>
                    <option value="cp">Capaian Pembelajaran (CP)</option>
                    <option value="tp">Tujuan Pembelajaran (TP)</option>
                    <option value="rpp">Modul Ajar / RPP</option>
                    <option value="slide">Slide Presentasi</option>
                </select>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Materi</th>
                            <th className="px-6 py-4">Tipe</th>
                            <th className="px-6 py-4">Mapel / Kelas</th>
                            <th className="px-6 py-4">Tanggal Dibuat</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : filteredMaterials.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Belum ada materi. Silakan tambah baru.</td></tr>
                        ) : (
                            filteredMaterials.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{item.title}</div>
                                        {item.is_premium && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">Premium</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getIcon(item.type)}
                                            <span className="capitalize">{item.type.toUpperCase()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900">{item.mapel}</div>
                                        {item.kelas && <div className="text-xs text-gray-500">Kelas {item.kelas}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {formatDate(item.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-600 hover:text-red-800 font-medium text-xs bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                                        >
                                            Hapus
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
