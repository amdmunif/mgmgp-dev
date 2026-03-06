import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Copy, Terminal, Check, Eye, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { promptService } from '../../services/resourcesService';
import type { Prompt } from '../../types';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/button';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

export function PromptLibrary() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [viewingPrompt, setViewingPrompt] = useState<Prompt | null>(null);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Prompt Library',
                description: 'Kumpulan prompt ChatGPT/Gemini untuk membantu guru dalam pembelajaran.',
                icon: <Terminal className="w-6 h-6 text-purple-600" />
            });
        }
    }, [setPageHeader]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await promptService.getAll();
            setPrompts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success('Prompt disalin ke clipboard');
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
            const payload = {
                id: editingPrompt.id,
                ...data,
                is_premium: 1
            };
            await promptService.update(editingPrompt.id, payload as any);
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
            header: 'Judul & Kategori',
            accessorKey: 'title' as keyof Prompt,
            className: 'align-top',
            cell: (item: Prompt) => (
                <div className="flex flex-col gap-1 items-start text-left">
                    <span className="font-bold text-gray-900 leading-tight block">{item.title}</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-semibold rounded uppercase w-fit inline-block mt-1">{item.category}</span>
                </div>
            )
        },
        {
            header: 'Deskripsi',
            accessorKey: 'description' as keyof Prompt,
            className: 'align-top',
            cell: (item: Prompt) => <div className="text-gray-600 text-left min-w-[200px] whitespace-pre-wrap">{item.description}</div>
        },
        {
            header: 'Isi Prompt',
            accessorKey: 'prompt_content' as keyof Prompt,
            className: 'align-top',
            cell: (item: Prompt) => (
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-left font-mono text-xs text-gray-700 whitespace-pre-wrap max-w-sm max-h-32 overflow-y-auto">
                    {item.prompt_content}
                </div>
            )
        },
        {
            header: 'Aksi',
            className: 'align-top text-right w-36',
            cell: (item: Prompt) => (
                <div className="flex flex-wrap justify-end gap-1">
                    <button
                        onClick={() => handleCopy(item.prompt_content, item.id)}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Copy Prompt"
                    >
                        {copiedId === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setViewingPrompt(item)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Lihat Detail"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setEditingPrompt(item)}
                        className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        title="Edit Prompt"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Hapus Prompt"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            {!setPageHeader && (
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900">Kumpulan Prompt AI</h1>
                    <p className="text-gray-500 mt-2">Koleksi prompt ChatGPT/Gemini untuk membantu guru dalam pembelajaran.</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6 mx-auto">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Memuat prompt...</div>
                ) : (
                    <DataTable
                        data={prompts}
                        columns={columns}
                        searchKeys={['title', 'description', 'category', 'prompt_content']}
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
                                <h3 className="font-semibold text-gray-900 mb-2">Prompt Content</h3>
                                <div className="bg-gray-900 rounded-lg p-4 relative group">
                                    <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">{viewingPrompt.prompt_content}</pre>
                                    <button
                                        onClick={() => handleCopy(viewingPrompt.prompt_content, viewingPrompt.id)}
                                        className="absolute top-2 right-2 p-2 bg-gray-800 text-gray-400 rounded-md hover:bg-gray-700 hover:text-white transition-all flex items-center gap-2 text-xs"
                                    >
                                        {copiedId === viewingPrompt.id ? <><Check className="w-4 h-4 text-green-400" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                                    </button>
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
            example_result: prompt.example_result || '',
            is_premium: Number(prompt.is_premium) === 1
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

                <form onSubmit={handleSubmit((data) => onSave(data))} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto w-full">
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
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 h-32 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-sm bg-gray-50 whitespace-pre-wrap"
                        />
                        {errors.prompt_content && <p className="text-red-500 text-xs mt-1">{errors.prompt_content.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contoh Hasil (Opsional)</label>
                        <textarea
                            {...register('example_result')}
                            className="w-full rounded-lg border border-gray-300 py-2 px-3 h-24 focus:ring-2 focus:ring-purple-500 focus:outline-none whitespace-pre-wrap"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-100 p-2">
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
