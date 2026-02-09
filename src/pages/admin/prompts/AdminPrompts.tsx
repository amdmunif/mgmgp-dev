import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Terminal, Pencil, X, Eye, Loader2 } from 'lucide-react';
import { promptService } from '../../../services/resourcesService';
import type { Prompt } from '../../../types';
import { DataTable } from '../../../components/ui/DataTable';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

export function AdminPrompts() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingPrompt, setViewingPrompt] = useState<Prompt | null>(null);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

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
            toast.error('Gagal memuat data prompt');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus prompt ini?')) return;
        try {
            await promptService.delete(id);
            toast.success('Prompt berhasil dihapus');
            loadData();
        } catch (error) {
            toast.error('Gagal menghapus prompt');
        }
    };

    const handleUpdate = async (data: Partial<Prompt>) => {
        if (!editingPrompt) return;
        try {
            await promptService.update(editingPrompt.id, data);
            toast.success('Prompt berhasil diupdate');
            setEditingPrompt(null);
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengupdate prompt');
        }
    };

    const columns = [
        {
            header: 'Judul Prompt',
            accessorKey: 'title' as keyof Prompt,
            cell: (item: Prompt) => (
                <div className="flex items-center gap-3 font-medium text-gray-900">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                        <Terminal className="w-5 h-5" />
                    </div>
                    {item.title}
                </div>
            )
        },
        {
            header: 'Kategori',
            accessorKey: 'category' as keyof Prompt,
            cell: (item: Prompt) => (
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">{item.category}</span>
            )
        },
        {
            header: 'Deskripsi',
            accessorKey: 'description' as keyof Prompt,
            cell: (item: Prompt) => <div className="text-gray-500 line-clamp-2 max-w-xs">{item.description}</div>
        },
        {
            header: 'Status',
            accessorKey: 'is_premium' as keyof Prompt,
            cell: (item: Prompt) => (
                item.is_premium ?
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Premium</span> :
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Free</span>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right',
            cell: (item: Prompt) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setViewingPrompt(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Lihat Detail"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setEditingPrompt(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit Prompt"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Hapus Prompt"
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
                    <h1 className="text-2xl font-bold text-gray-900">Prompt Library</h1>
                    <p className="text-gray-500">Kelola koleksi prompt AI untuk member.</p>
                </div>
                <Link to="/admin/prompts/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" /> Tambah Prompt
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <DataTable
                        data={prompts}
                        columns={columns}
                        searchKeys={['title', 'description', 'category']}
                        pageSize={10}
                    />
                )}
            </div>

            {/* View Modal */}
            {viewingPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">{viewingPrompt.title}</h2>
                            <button onClick={() => setViewingPrompt(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Deskripsi</h3>
                                <p className="text-gray-600">{viewingPrompt.description}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Prompt Content</h3>
                                <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm text-gray-800 whitespace-pre-wrap">
                                    {viewingPrompt.prompt_content}
                                </div>
                            </div>
                            {viewingPrompt.example_result && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Contoh Output</h3>
                                    <div className="p-4 bg-blue-50 text-blue-900 rounded-lg text-sm whitespace-pre-wrap">
                                        {viewingPrompt.example_result}
                                    </div>
                                </div>
                            )}
                            <div className="pt-4 flex justify-end">
                                <Button onClick={() => setViewingPrompt(null)}>Tutup</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingPrompt && (
                <EditPromptModal
                    prompt={editingPrompt}
                    onClose={() => setEditingPrompt(null)}
                    onSave={handleUpdate}
                />
            )}
        </div>
    );
}

function EditPromptModal({ prompt, onClose, onSave }: { prompt: Prompt, onClose: () => void, onSave: (data: Partial<Prompt>) => Promise<void> }) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            title: prompt.title,
            description: prompt.description,
            category: prompt.category,
            prompt_content: prompt.prompt_content,
            example_result: prompt.example_result,
            is_premium: prompt.is_premium
        }
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Edit Prompt</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit((data) => onSave(data))} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Prompt</label>
                        <input
                            {...register('title', { required: 'Judul wajib diisi' })}
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select
                            {...register('category', { required: 'Kategori wajib dipilih' })}
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                            <option value="">Pilih Kategori</option>
                            <option value="Teaching">Teaching / Pendidikan</option>
                            <option value="Coding">Coding / Pemrograman</option>
                            <option value="Writing">Writing / Penulisan</option>
                            <option value="Productivity">Productivity / Produktivitas</option>
                        </select>
                        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat</label>
                        <input
                            {...register('description', { required: 'Deskripsi wajib diisi' })}
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Isi Prompt</label>
                        <textarea
                            {...register('prompt_content', { required: 'Isi prompt wajib diisi' })}
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 h-32 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-sm bg-gray-50"
                        />
                        {errors.prompt_content && <p className="text-red-500 text-xs mt-1">{errors.prompt_content.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contoh Hasil (Opsional)</label>
                        <textarea
                            {...register('example_result')}
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 h-24 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="edit_prompt_is_premium"
                            {...register('is_premium')}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="edit_prompt_is_premium" className="text-sm text-gray-700">Premium Content</label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-100">
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
