import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Book, Globe, Gamepad2, ExternalLink, Library } from 'lucide-react';
import { referenceService } from '../../../services/resourcesService';
import type { Reference } from '../../../types';
import { DataTable } from '../../../components/ui/DataTable';
import { toast } from 'react-hot-toast';

export function AdminReferences() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [refs, setRefs] = useState<Reference[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Referensi Belajar',
                description: 'Kelola daftar referensi buku, simulator, dan link belajar.',
                icon: <Library className="w-6 h-6" />
            });
        }
        loadData();
    }, [setPageHeader]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await referenceService.getAll();
            setRefs(data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat referensi');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus referensi ini?')) return;
        try {
            await referenceService.delete(id);
            toast.success('Referensi dihapus');
            loadData();
        } catch (error) {
            toast.error('Gagal menghapus');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Buku': return <Book className="w-5 h-5 text-blue-500" />;
            case 'Simulator': return <Globe className="w-5 h-5 text-green-500" />;
            case 'Game': return <Gamepad2 className="w-5 h-5 text-purple-500" />;
            default: return <Book className="w-5 h-5" />;
        }
    };

    const filteredRefs = refs.filter(ref => {
        if (filterType === 'all') return true;
        return ref.type === filterType;
    });

    const columns = [
        {
            header: 'Judul Referensi',
            accessorKey: 'title' as keyof Reference,
            cell: (item: Reference) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        {getIcon(item.type)}
                    </div>
                    <span className="font-bold text-gray-900">{item.title}</span>
                </div>
            )
        },
        {
            header: 'Tipe',
            accessorKey: 'type' as keyof Reference,
            cell: (item: Reference) => (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium border border-gray-200">{item.type}</span>
            )
        },
        {
            header: 'Link / File',
            accessorKey: 'link_url' as keyof Reference,
            cell: (item: Reference) => (
                <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                    {item.link_url?.substring(0, 30)}... <ExternalLink className="w-3 h-3" />
                </a>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right',
            cell: (item: Reference) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                        title="Hapus"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">


            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <DataTable
                        data={filteredRefs}
                        columns={columns}
                        searchKeys={['title', 'type']}
                        pageSize={10}
                        filterContent={
                            <div className="flex items-center gap-2">
                                <select
                                    className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 h-9"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="all">Semua Tipe</option>
                                    <option value="Buku">Buku</option>
                                    <option value="Simulator">Simulator</option>
                                    <option value="Game">Game</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                                <Link to="/admin/references/create">
                                    <Button className="h-9">
                                        <Plus className="w-4 h-4 mr-2" /> Tambah Referensi
                                    </Button>
                                </Link>
                            </div>
                        }
                    />
                )}
            </div>
        </div>
    );
}
