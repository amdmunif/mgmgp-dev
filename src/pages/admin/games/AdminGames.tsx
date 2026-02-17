import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Gamepad2, Pencil, X, Loader2, Copy, Eye } from 'lucide-react';
import { gameService } from '../../../services/gameService';
import type { Game } from '../../../types';
import { DataTable } from '../../../components/ui/DataTable';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

export function AdminGames() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingGame, setViewingGame] = useState<Game | null>(null);
    const [editingGame, setEditingGame] = useState<Game | null>(null);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Bank Games',
                description: 'Kelola daftar game edukasi untuk member.',
                icon: <Gamepad2 className="w-6 h-6" />
            });
        }
        loadData();
    }, [setPageHeader]);

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
            // Ensure is_premium is sent as 1 or 0
            const payload = {
                id: editingGame.id, // Add ID to body just in case
                ...data,
                is_premium: 1
            };
            console.log('Sending Update Payload:', payload);
            await gameService.update(editingGame.id, payload as any);
            toast.success('Game berhasil diupdate');
            setEditingGame(null);
            // Force reload to verify DB persistence
            setTimeout(() => window.location.reload(), 500);
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
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(item.link_url);
                        toast.success('Link disalin!');
                    }}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-purple-200 w-full max-w-[200px]"
                    title="Klik untuk menyalin"
                >
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.link_url}</span>
                </button>
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
                    <button
                        onClick={() => setViewingGame(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Lihat Detail"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
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


            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <DataTable
                        data={games}
                        columns={columns}
                        searchKeys={['title', 'description']}
                        pageSize={10}
                        filterContent={
                            <Link to="/admin/games/create">
                                <Button className="h-9">
                                    <Plus className="w-4 h-4 mr-2" /> Tambah Game
                                </Button>
                            </Link>
                        }
                    />
                )}
            </div>

            {/* View Modal */}
            {viewingGame && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Detail Game</h2>
                            <button onClick={() => setViewingGame(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                    <Gamepad2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{viewingGame.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {viewingGame.is_premium ?
                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Premium</span> :
                                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-semibold">Free</span>
                                        }
                                        <span className="text-xs text-gray-500">{viewingGame.plays_count} plays</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Deskripsi</h4>
                                <p className="text-gray-600 text-sm leading-relaxed">{viewingGame.description}</p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Link Game</h4>
                                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <code className="text-xs text-blue-600 flex-1 truncate">{viewingGame.link_url}</code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(viewingGame.link_url);
                                            toast.success('Link disalin');
                                        }}
                                        className="p-1.5 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setViewingGame(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Tutup
                                </button>
                                <a
                                    href={viewingGame.link_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1"
                                >
                                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                                        <Gamepad2 className="w-4 h-4 mr-2" /> Mainkan
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
            is_premium: Number(game.is_premium) === 1
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
