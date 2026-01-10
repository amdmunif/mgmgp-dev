import { useState, useEffect } from 'react';
// import { cn } from '../../lib/utils';
import { Copy, Terminal, Check } from 'lucide-react';
import { promptService } from '../../services/resourcesService';
import type { Prompt } from '../../types';

export function PromptLibrary() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

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
    };

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900">Kumpulan Prompt AI</h1>
                <p className="text-gray-500 mt-2">Koleksi prompt ChatGPT/Gemini untuk membantu guru dalam pembelajaran.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-gray-500">Memuat prompt...</div>
                ) : prompts.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl">
                        <Terminal className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Belum ada prompt tersedia.</p>
                    </div>
                ) : (
                    prompts.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded uppercase">{item.category}</span>
                                    {item.is_premium && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">Premium</span>}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-600 text-sm mb-4">{item.description}</p>

                                <div className="bg-gray-900 rounded-lg p-4 relative group">
                                    <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">{item.prompt_content}</pre>
                                    <button
                                        onClick={() => handleCopy(item.prompt_content, item.id)}
                                        className="absolute top-2 right-2 p-2 bg-gray-800 text-gray-400 rounded-md hover:bg-gray-700 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        {copiedId === item.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
