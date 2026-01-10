import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { FileText, Download, Gamepad2, Search, Lock } from 'lucide-react';
import { questionService } from '../../services/questionService';
import { authService } from '../../services/authService';
import type { QuestionBank } from '../../types';

export function QuestionBankPage() {
    const [questions, setQuestions] = useState<QuestionBank[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'All' | 'Ulangan' | 'Latihan' | 'TTS' | 'Wordsearch'>('All');

    useEffect(() => {
        loadData();
        checkPremium();
    }, []);

    const loadData = async () => {
        try {
            const data = await questionService.getAll();
            setQuestions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const checkPremium = async () => {
        const { user } = await authService.getCurrentUser() || {};
        if (user) {
            // Mock check or real check
            setIsPremiumUser(true);
        }
    };

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) || q.mapel.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || q.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const getIcon = (category: string) => {
        if (category === 'TTS' || category === 'Wordsearch') return <Gamepad2 className="w-8 h-8 text-purple-500" />;
        return <FileText className="w-8 h-8 text-blue-500" />;
    };

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900">Bank Soal & Games</h1>
                <p className="text-gray-500 mt-2">Kumpulan soal latihan, ulangan, dan games edukatif (TTS/Wordsearch).</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cari materi soal..."
                        className="pl-10 w-full rounded-full border border-gray-200 py-3 px-4 shadow-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['All', 'Ulangan', 'Latihan', 'TTS', 'Wordsearch'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat as any)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                categoryFilter === cat
                                    ? "bg-primary-600 text-white shadow-md"
                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-gray-500">Memuat bank soal...</div>
                ) : filteredQuestions.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl">
                        <p className="text-gray-500">Tidak ada soal ditemukan.</p>
                    </div>
                ) : (
                    filteredQuestions.map((item) => (
                        <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all group relative overflow-hidden">
                            {item.is_premium && (
                                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                    PREMIUM
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                                    {getIcon(item.category)}
                                </div>
                                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.mapel}</span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">{item.title}</h3>
                            <p className="text-sm text-gray-500 mb-4">{item.category}</p>

                            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:text-primary-600 transition-colors">
                                {item.is_premium && !isPremiumUser ? (
                                    <>
                                        <Lock className="w-4 h-4" /> Akses Premium
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" /> Download / Main
                                    </>
                                )}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
