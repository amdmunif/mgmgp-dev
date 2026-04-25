import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Copy, Terminal, Check } from 'lucide-react';
import { promptService } from '../../services/resourcesService';
import type { Prompt } from '../../types';
import { DataTable } from '../../components/ui/DataTable';
import { toast } from 'react-hot-toast';

export function PromptLibrary() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

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
        toast.success('Prompt disalin ke clipboard!');
    };

    const columns = [
        {
            header: 'Judul & Kategori',
            accessorKey: 'title' as keyof Prompt,
            className: 'align-top w-48',
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
            className: 'align-top w-64',
            cell: (item: Prompt) => <div className="text-gray-600 text-left whitespace-pre-wrap">{item.description}</div>
        },
        {
            header: 'Isi Prompt',
            accessorKey: 'prompt_content' as keyof Prompt,
            className: 'align-top',
            cell: (item: Prompt) => (
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-left font-mono text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {item.prompt_content}
                </div>
            )
        },
        {
            header: 'Salin',
            className: 'align-top text-center w-20 shrink-0',
            cell: (item: Prompt) => (
                <div className="flex justify-center">
                    <button
                        onClick={() => handleCopy(item.prompt_content, item.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            copiedId === item.id
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                        }`}
                        title="Salin Prompt"
                    >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === item.id ? 'Tersalin!' : 'Salin'}
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
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
        </div>
    );
}
