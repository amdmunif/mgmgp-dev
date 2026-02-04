import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, CheckCircle2 } from 'lucide-react';
import { questionService } from '../../../services/questionService';
import type { Question, QuestionOption, QuestionBank } from '../../../types';
import { cn } from '../../../lib/utils';
import { nanoid } from 'nanoid';

export function QuestionBuilder() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Bank Metadata
    const [meta, setMeta] = useState({
        title: '',
        mapel: '',
        category: 'Latihan' as QuestionBank['category'],
        is_premium: true
    });

    // Questions List
    const [questions, setQuestions] = useState<Question[]>([]);

    // Editor State
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

    const handleAddQuestion = () => {
        const newQuestion: Question = {
            id: nanoid(),
            type: 'single_choice',
            text: '',
            options: [
                { id: nanoid(), text: '', is_correct: false },
                { id: nanoid(), text: '', is_correct: false }
            ],
            points: 10
        };
        setQuestions([...questions, newQuestion]);
        setActiveQuestionId(newQuestion.id);
    };

    const handleDeleteQuestion = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Hapus pertanyaan ini?')) {
            setQuestions(questions.filter(q => q.id !== id));
            if (activeQuestionId === id) setActiveQuestionId(null);
        }
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const handleAddOption = (qId: string) => {
        const question = questions.find(q => q.id === qId);
        if (!question) return;

        const newOption: QuestionOption = { id: nanoid(), text: '', is_correct: false };
        updateQuestion(qId, { options: [...(question.options || []), newOption] });
    };

    const handleUpdateOption = (qId: string, optId: string, updates: Partial<QuestionOption>) => {
        const question = questions.find(q => q.id === qId);
        if (!question || !question.options) return;

        // Logic for single choice: if setting is_correct=true, set others to false
        let newOptions = question.options.map(opt =>
            opt.id === optId ? { ...opt, ...updates } : opt
        );

        if (question.type === 'single_choice' && updates.is_correct) {
            newOptions = newOptions.map(opt =>
                opt.id === optId ? opt : { ...opt, is_correct: false }
            );
        }

        updateQuestion(qId, { options: newOptions });
    };

    const handleDeleteOption = (qId: string, optId: string) => {
        const question = questions.find(q => q.id === qId);
        if (!question || !question.options) return;
        updateQuestion(qId, { options: question.options.filter(o => o.id !== optId) });
    };

    const handleSave = async () => {
        if (!meta.title || !meta.mapel) {
            alert('Mohon lengkapi Judul dan Mata Pelajaran');
            return;
        }
        if (questions.length === 0) {
            alert('Belum ada pertanyaan yang dibuat');
            return;
        }

        // Validate Questions
        for (const q of questions) {
            if (!q.text) {
                alert('Ada pertanyaan yang belum diisi teksnya');
                return;
            }
            if (q.type !== 'essay' && (!q.options || q.options.length < 2)) {
                alert('Pertanyaan pilihan ganda harus punya minimal 2 opsi');
                return;
            }
            if ((q.type === 'single_choice' || q.type === 'true_false') && !q.options?.some(o => o.is_correct)) {
                alert('Setiap pertanyaan harus punya jawaban benar');
                return;
            }
        }

        setLoading(true);
        try {
            await questionService.create({
                title: meta.title,
                mapel: meta.mapel,
                category: meta.category,
                is_premium: meta.is_premium,
                file_url: '', // Interactive mode has no file
                game_data: { questions }
            });
            alert('Bank Soal berhasil dibuat!');
            navigate('/admin/questions');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Gagal menyimpan bank soal');
        } finally {
            setLoading(false);
        }
    };

    const activeQuestion = questions.find(q => q.id === activeQuestionId);

    return (
        <div className="h-[calc(100vh-5rem)] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/admin/questions')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Buat Soal Interaktif</h1>
                        <p className="text-xs text-gray-500">Mode Builder</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Menyimpan...' : 'Simpan Bank Soal'}
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar: Metadata & Questions List */}
                <div className="w-80 bg-white border-r flex flex-col overflow-hidden">
                    <div className="p-4 border-b space-y-3 bg-gray-50">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Judul Bank Soal</label>
                            <input
                                type="text"
                                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                                placeholder="Contoh: Latihan UTS Kelas 7"
                                value={meta.title}
                                onChange={e => setMeta({ ...meta, title: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Mapel</label>
                                <input
                                    type="text"
                                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                                    placeholder="Informatika"
                                    value={meta.mapel}
                                    onChange={e => setMeta({ ...meta, mapel: e.target.value })}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Kategori</label>
                                <select
                                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                                    value={meta.category}
                                    onChange={e => setMeta({ ...meta, category: e.target.value as any })}
                                >
                                    <option value="Latihan">Latihan</option>
                                    <option value="Ujian">Ujian</option>
                                    <option value="TTS">TTS</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="prem"
                                checked={meta.is_premium}
                                onChange={e => setMeta({ ...meta, is_premium: e.target.checked })}
                            />
                            <label htmlFor="prem" className="text-sm text-gray-700 font-medium">Premium Only</label>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {questions.map((q, idx) => (
                            <div
                                key={q.id}
                                onClick={() => setActiveQuestionId(q.id)}
                                className={cn(
                                    "p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-all group relative",
                                    activeQuestionId === q.id ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-200"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-gray-500">Soal {idx + 1}</span>
                                    <button
                                        onClick={(e) => handleDeleteQuestion(q.id, e)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-800 line-clamp-2">{q.text || 'Pertanyaan kosong...'}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                                        {q.type === 'single_choice' ? 'Pilgan' : q.type === 'multiple_choice' ? 'Multi' : q.type === 'true_false' ? 'B/S' : 'Essay'}
                                    </span>
                                    <span className="text-[10px] bg-green-100 px-1.5 py-0.5 rounded text-green-700 font-medium">
                                        {q.points} Poin
                                    </span>
                                </div>
                            </div>
                        ))}

                        <Button
                            variant="outline"
                            className="w-full border-dashed border-2 py-6 text-gray-500 hover:border-blue-500 hover:text-blue-500"
                            onClick={handleAddQuestion}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Tambah Pertanyaan
                        </Button>
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
                    {activeQuestion ? (
                        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Editor Header */}
                            <div className="flex justify-between items-start mb-6 pb-6 border-b">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Edit Pertanyaan</h2>
                                    <p className="text-sm text-gray-500">Sesuaikan konten dan jawaban soal.</p>
                                </div>
                                <div className="flex gap-4">
                                    <select
                                        className="px-3 py-2 border rounded-md text-sm bg-gray-50"
                                        value={activeQuestion.type}
                                        onChange={e => updateQuestion(activeQuestion.id, { type: e.target.value as any })}
                                    >
                                        <option value="single_choice">Pilihan Ganda (1 Jawaban)</option>
                                        <option value="multiple_choice">Pilihan Ganda (Banyak Jawaban)</option>
                                        <option value="true_false">Benar / Salah</option>
                                        <option value="essay">Essay / Isian</option>
                                    </select>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-20 px-3 py-2 border rounded-md text-sm text-right pr-8"
                                            value={activeQuestion.points}
                                            onChange={e => updateQuestion(activeQuestion.id, { points: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="absolute right-3 top-2 text-xs text-gray-500">Pts</span>
                                    </div>
                                </div>
                            </div>

                            {/* Question Text */}
                            <div className="mb-8">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Pertanyaan</label>
                                <textarea
                                    className="w-full p-4 border rounded-lg text-lg min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="Tulis pertanyaan Anda di sini..."
                                    value={activeQuestion.text}
                                    onChange={e => updateQuestion(activeQuestion.id, { text: e.target.value })}
                                />
                            </div>

                            {/* Answers Area */}
                            {activeQuestion.type !== 'essay' && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-sm font-semibold text-gray-700">Pilihan Jawaban</label>
                                        <span className="text-xs text-gray-500">
                                            {activeQuestion.type === 'single_choice' ? 'Pilih satu jawaban benar' : 'Centang semua jawaban benar'}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {activeQuestion.options?.map((opt, idx) => (
                                            <div key={opt.id} className="flex items-center gap-3 group">
                                                <div className="cursor-move text-gray-300">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>

                                                <button
                                                    onClick={() => handleUpdateOption(activeQuestion.id, opt.id, { is_correct: !opt.is_correct })}
                                                    className={cn(
                                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                                        opt.is_correct
                                                            ? "bg-green-500 border-green-500 text-white"
                                                            : "border-gray-300 text-transparent hover:border-green-400"
                                                    )}
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>

                                                <div className="flex-1 relative">
                                                    <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">
                                                        {String.fromCharCode(65 + idx)}.
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className={cn(
                                                            "w-full pl-8 pr-4 py-2 border rounded-md transition-colors",
                                                            opt.is_correct ? "border-green-500 bg-green-50/30" : "border-gray-200"
                                                        )}
                                                        placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                                                        value={opt.text}
                                                        onChange={e => handleUpdateOption(activeQuestion.id, opt.id, { text: e.target.value })}
                                                    />
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteOption(activeQuestion.id, opt.id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-10 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => handleAddOption(activeQuestion.id)}
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Tambah Pilihan
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeQuestion.type === 'essay' && (
                                <div className="bg-gray-50 border rounded-lg p-8 text-center text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>Pertanyaan Essay akan dinilai secara manual oleh pengajar.</p>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Plus className="w-8 h-8 opacity-50" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600">Pilih atau Buat Pertanyaan</h3>
                            <p className="max-w-xs text-center mt-2 text-sm">Pilih pertanyaan dari sidebar atau klik tombol tambah untuk mulai membuat soal.</p>
                            <Button className="mt-6" onClick={handleAddQuestion}>
                                <Plus className="w-4 h-4 mr-2" /> Buat Pertanyaan Baru
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Icon helper
function XCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </svg>
    )
}

function FileText({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
    )
}
