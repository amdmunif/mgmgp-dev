import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Gamepad2, ExternalLink, Pencil, X, Loader2 } from 'lucide-react';
import { gameService } from '../../../services/gameService';
import type { Game } from '../../../types';
import { DataTable } from '../../../components/ui/DataTable';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

export function AdminGames() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingGame, setEditingGame] = useState<Game | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await gameService.getAll();
            setGames(data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data game');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus game ini?')) return;
        try {
            await gameService.delete(id);
            toast.success('Game berhasil dihapus');
            loadData();
        } catch (error) {
            toast.error('Gagal menghapus game');
        }
    };

    const handleUpdate = async (data: Partial<Game>) => {
        if (!editingGame) return;
        try {
            await gameService.update(editingGame.id, data);
            toast.success('Game berhasil diupdate');
            setEditingGame(null);
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengupdate game');
        }
    };

    const columns = [
        {
            header: 'Judul Game',
            accessorKey: 'title' as keyof Game,
            cell: (item: Game) => (
                <div className="flex items-center gap-3 font-medium text-gray-900">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                        <Gamepad2 className="w-5 h-5" />
                    </div>
                    {item.title}
                </div>
            )
        },
        {
            header: 'Link / URL',
            accessorKey: 'link_url' as keyof Game,
            cell: (item: Game) => (
                <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline max-w-[200px] truncate">
                    Link <ExternalLink className="w-3 h-3" />
                </a>
            )
        },
        {
            header: 'Deskripsi',
            accessorKey: 'description' as keyof Game,
            cell: (item: Game) => <div className="text-gray-500 line-clamp-2 max-w-xs">{item.description}</div>
        },
        {
            header: 'Status',
            accessorKey: 'is_premium' as keyof Game,
            cell: (item: Game) => (
                item.is_premium ?
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Premium</span> :
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Free</span>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right',
            cell: (item: Game) => (
                <div className="flex justify-end gap-2">
                    <a
                        href={item.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Mainkan / Lihat"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                        onClick={() => setEditingGame(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit Game"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Hapus Game"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bank Games</h1>
                    <p className="text-gray-500">Kelola daftar game edukasi untuk member.</p>
                </div>
                <Link to="/admin/games/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" /> Tambah Game
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <DataTable
                        data={games}
                        columns={columns}
                        searchKeys={['title', 'description']}
                        pageSize={10}
                    />
                )}
            </div>

            {/* Edit Modal */}
            {editingGame && (
                <EditGameModal
                    game={editingGame}
                    onClose={() => setEditingGame(null)}
                    onSave={handleUpdate}
                />
            )}
        </div>
    );
}

function EditGameModal({ game, onClose, onSave }: { game: Game, onClose: () => void, onSave: (data: Partial<Game>) => Promise<void> }) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            title: game.title,
            description: game.description,
            link_url: game.link_url,
            is_premium: game.is_premium
        }
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Edit Game</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit((data) => onSave(data))} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Game</label>
                        <input
                            {...register('title', { required: 'Judul wajib diisi' })}
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                        <input
                            {...register('link_url', { required: 'Link wajib diisi' })}
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                        {errors.link_url && <p className="text-red-500 text-xs mt-1">{errors.link_url.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                        <textarea
                            {...register('description')}
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 h-24 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="edit_is_premium"
                            {...register('is_premium')}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="edit_is_premium" className="text-sm text-gray-700">Premium Content</label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
