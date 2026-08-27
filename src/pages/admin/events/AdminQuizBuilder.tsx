import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { Plus, Save, Clock, Trash2, CheckCircle2, Search, LibraryBig, X, Loader2, FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { toast } from 'react-hot-toast';
import { cn } from '../../../lib/utils';
import { lmsService } from '../../../services/lmsService';
import { questionService, type Question } from '../../../services/questionService';

interface QuizOption {
    id: string;
    text: string;
    is_correct: boolean;
}

interface QuizQuestion {
    id: string;
    text: string;
    type: string;
    points: number;
    options: QuizOption[];
}

export function AdminQuizBuilder() {
    const { id, materialId } = useParams<{ id: string, materialId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Parse topic_id from query params if passed
    const searchParams = new URLSearchParams(location.search);
    const initialTopicId = searchParams.get('topic_id') || '';
    const [topicId, setTopicId] = useState(initialTopicId);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [title, setTitle] = useState('Kuis Baru');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState(30);
    const [passingScore, setPassingScore] = useState(70);
    const [maxAttempts, setMaxAttempts] = useState(1);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);

    // Bank Soal Modal States
    const [isBankModalOpen, setIsBankModalOpen] = useState(false);
    const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
    const [loadingBank, setLoadingBank] = useState(false);
    const [searchBank, setSearchBank] = useState('');
    const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());

    const { setPageHeader } = useOutletContext<any>();

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
            title: 'Pembangun Kuis',
            subtitle: "Buat pertanyaan untuk Pretest atau Post-test",
            backUrl: `/admin/events/${id}/lms`
        });
        }
    }, [setPageHeader, saving, title, description, duration, passingScore, maxAttempts, questions]);

    useEffect(() => {
        if (materialId) {
            loadQuiz();
        } else {
            setLoading(false);
        }
    }, [materialId]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            const quizData: any = await lmsService.getQuizByMaterialId(materialId!);
            if (quizData) {
                if (quizData.topic_id && !topicId) {
                    setTopicId(quizData.topic_id);
                }
                setTitle(quizData.title);
                setDescription(quizData.description || '');
                setDuration(quizData.duration_minutes || 30);
                setPassingScore(quizData.passing_score || 70);
                setMaxAttempts(quizData.max_attempts || 1);
                
                if (quizData.questions) {
                    setQuestions(quizData.questions.map((q: any) => ({
                        id: q.id,
                        text: q.question_text,
                        type: q.question_type,
                        points: q.points,
                        options: q.options ? q.options.map((o: any) => ({
                            id: o.id,
                            text: o.option_text,
                            is_correct: Boolean(o.is_correct)
                        })) : []
                    })));
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat kuis");
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = () => {
        const newId = `q${Date.now()}${Math.floor(Math.random() * 1000)}`;
        setQuestions([
            {
                id: newId,
                text: '',
                type: 'multiple_choice',
                points: 1,
                options: [
                    { id: `o${Date.now()}1`, text: '', is_correct: true },
                    { id: `o${Date.now()}2`, text: '', is_correct: false },
                    { id: `o${Date.now()}3`, text: '', is_correct: false },
                    { id: `o${Date.now()}4`, text: '', is_correct: false },
                ]
            },
            ...questions
        ]);
        
        // Use a short timeout to scroll to the top of the questions list
        setTimeout(() => {
            window.scrollTo({ top: 400, behavior: 'smooth' });
        }, 100);
    };

    const handleUpdateQuestion = (qId: string, text: string) => {
        setQuestions(questions.map(q => q.id === qId ? { ...q, text } : q));
    };

    const handleUpdateOption = (qId: string, oId: string, text: string) => {
        setQuestions(questions.map(q => {
            if (q.id === qId) {
                return {
                    ...q,
                    options: q.options.map(o => o.id === oId ? { ...o, text } : o)
                };
            }
            return q;
        }));
    };

    const handleSetCorrectOption = (qId: string, oId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === qId) {
                return {
                    ...q,
                    options: q.options.map(o => ({ ...o, is_correct: o.id === oId }))
                };
            }
            return q;
        }));
    };

    const handleDeleteQuestion = (qId: string) => {
        setQuestions(questions.filter(q => q.id !== qId));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Judul kuis tidak boleh kosong");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                id: materialId,
                topic_id: topicId,
                title,
                description,
                duration_minutes: duration,
                passing_score: passingScore,
                max_attempts: maxAttempts,
                questions: questions
            };

            await lmsService.saveQuiz(payload);
            toast.success('Kuis berhasil disimpan!');
            navigate(`/admin/events/${id}/lms`);
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan kuis");
        } finally {
            setSaving(false);
        }
    };

    // --- Bank Soal Logic ---
    const openBankModal = async () => {
        setIsBankModalOpen(true);
        setSearchBank('');
        setSelectedBankIds(new Set());
        setLoadingBank(true);
        try {
            const data = await questionService.getAll();
            // Filter out non-multiple choice if needed, or handle mapping
            setBankQuestions(data.filter(q => q.type === 'multiple_choice' || q.type === 'single_choice'));
        } catch (error) {
            toast.error("Gagal memuat bank soal");
        } finally {
            setLoadingBank(false);
        }
    };

    const toggleBankSelection = (qId: string) => {
        const newSet = new Set(selectedBankIds);
        if (newSet.has(qId)) newSet.delete(qId);
        else newSet.add(qId);
        setSelectedBankIds(newSet);
    };

    const handleImportFromBank = () => {
        const selected = bankQuestions.filter(q => selectedBankIds.has(q.id));
        
        const newQuestions: QuizQuestion[] = selected.map(sq => {
            // Options in CBT are stored as JSON string or array in sq.options
            let parsedOptions = [];
            if (typeof sq.options === 'string') {
                try { parsedOptions = JSON.parse(sq.options); } catch(e){}
            } else if (Array.isArray(sq.options)) {
                parsedOptions = sq.options;
            }
            
            // Map CBT options to LMS QuizOptions
            const mappedOptions: QuizOption[] = parsedOptions.map((po: any, idx: number) => {
                // If it's a simple string array, or an object array
                const optText = typeof po === 'string' ? po : (po.text || po.content || JSON.stringify(po));
                // In CBT, answer_key might be the index (e.g. '0', '1', 'A', 'B')
                // Let's assume standard index matching for simplicity, or A/B/C/D mapping
                let isCorrect = false;
                if (sq.answer_key) {
                    if (sq.answer_key.length === 1 && /[A-E]/.test(sq.answer_key.toUpperCase())) {
                        const charCode = sq.answer_key.toUpperCase().charCodeAt(0) - 65;
                        isCorrect = idx === charCode;
                    } else {
                        isCorrect = sq.answer_key === String(idx) || sq.answer_key === optText;
                    }
                }

                return {
                    id: `o${Date.now()}${idx}${Math.floor(Math.random()*1000)}`,
                    text: optText,
                    is_correct: isCorrect
                };
            });

            // Ensure at least 1 correct option if mapping failed
            if (mappedOptions.length > 0 && !mappedOptions.some(o => o.is_correct)) {
                mappedOptions[0].is_correct = true;
            }

            return {
                id: `q${Date.now()}${Math.floor(Math.random()*1000)}`, // New ID to detach from master bank
                text: sq.content,
                type: 'multiple_choice',
                points: 1,
                options: mappedOptions
            };
        });

        setQuestions([...questions, ...newQuestions]);
        setIsBankModalOpen(false);
        toast.success(`${newQuestions.length} soal berhasil disalin ke kuis`);
    };

    const filteredBankQuestions = bankQuestions.filter(q => 
        q.content.toLowerCase().includes(searchBank.toLowerCase()) || 
        (q.mapel && q.mapel.toLowerCase().includes(searchBank.toLowerCase()))
    );

    if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500"/></div>;

    return (
        <div className="max-w-4xl mx-auto pb-20 mt-4">
            <div className="flex justify-between items-center mb-4">
                <Button 
                    onClick={() => navigate(`/admin/events/${id}/lms`)} 
                    variant="outline" 
                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Simpan Kuis
                </Button>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Kuis</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (Menit)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="number" 
                                value={duration}
                                onChange={e => setDuration(parseInt(e.target.value) || 0)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Batas Nilai Lulus (KKM)</label>
                        <input 
                            type="number" 
                            value={passingScore}
                            onChange={e => setPassingScore(parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Batas Maksimal Percobaan</label>
                        <input 
                            type="number" 
                            value={maxAttempts}
                            onChange={e => setMaxAttempts(parseInt(e.target.value) || 1)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Daftar Pertanyaan ({questions.length})</h2>
                <div className="flex gap-2">
                    <Button onClick={openBankModal} variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                        <LibraryBig className="w-4 h-4 mr-2" /> Ambil dari Bank Soal
                    </Button>
                    <Button onClick={handleAddQuestion} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                        <Plus className="w-4 h-4 mr-2" /> Buat Soal Manual
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {questions.map((q, index) => (
                    <div key={q.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <span className="font-semibold text-gray-700">Soal {index + 1}</span>
                            <Button onClick={() => handleDeleteQuestion(q.id)} variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-4 md:p-6">
                            <textarea 
                                value={q.text}
                                onChange={e => handleUpdateQuestion(q.id, e.target.value)}
                                placeholder="Ketik pertanyaan di sini..."
                                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] mb-6 resize-y"
                            />
                            
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Pilihan Jawaban (Pilih salah satu yang benar)</p>
                                {q.options.map((opt, optIndex) => (
                                    <div key={opt.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-colors", opt.is_correct ? "border-green-500 bg-green-50/30" : "border-gray-200 hover:border-gray-300")}>
                                        <button 
                                            onClick={() => handleSetCorrectOption(q.id, opt.id)}
                                            className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors", opt.is_correct ? "border-green-500 bg-green-500 text-white" : "border-gray-300 bg-white")}
                                        >
                                            {opt.is_correct && <CheckCircle2 className="w-4 h-4" />}
                                        </button>
                                        <div className="font-medium text-gray-500 w-6 text-center">{String.fromCharCode(65 + optIndex)}</div>
                                        <input 
                                            type="text"
                                            value={opt.text}
                                            onChange={e => handleUpdateOption(q.id, opt.id, e.target.value)}
                                            placeholder={`Opsi ${String.fromCharCode(65 + optIndex)}`}
                                            className="flex-1 bg-transparent outline-none py-1"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}

                {questions.length === 0 && (
                    <div className="text-center py-16 bg-white border-2 border-dashed border-gray-200 rounded-xl">
                        <FileQuestion className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-gray-900 font-medium mb-1">Belum Ada Pertanyaan</h3>
                        <p className="text-gray-500 text-sm mb-4">Mulai dengan menambahkan soal secara manual atau ambil dari Bank Soal CBT.</p>
                        <div className="flex justify-center gap-3">
                            <Button onClick={handleAddQuestion} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                <Plus className="w-4 h-4 mr-2" /> Manual
                            </Button>
                            <Button onClick={openBankModal} variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                                <LibraryBig className="w-4 h-4 mr-2" /> Bank Soal
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Bank Soal */}
            {isBankModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <LibraryBig className="w-5 h-5 text-purple-600" /> Pilih dari Bank Soal
                            </h3>
                            <button onClick={() => setIsBankModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-gray-100 bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Cari berdasarkan teks soal atau mata pelajaran..."
                                    value={searchBank}
                                    onChange={e => setSearchBank(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                            {loadingBank ? (
                                <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
                            ) : filteredBankQuestions.length > 0 ? (
                                filteredBankQuestions.map(q => (
                                    <div 
                                        key={q.id} 
                                        onClick={() => toggleBankSelection(q.id)}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all cursor-pointer",
                                            selectedBankIds.has(q.id) 
                                                ? "bg-purple-50 border-purple-300 shadow-sm" 
                                                : "bg-white border-gray-200 hover:border-purple-200"
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <div className="pt-1">
                                                <div className={cn(
                                                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                                    selectedBankIds.has(q.id) ? "bg-purple-600 border-purple-600 text-white" : "border-gray-300"
                                                )}>
                                                    {selectedBankIds.has(q.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-800 text-sm line-clamp-2" dangerouslySetInnerHTML={{ __html: q.content }}></p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">{q.mapel}</span>
                                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">{q.level}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    Tidak ada soal yang ditemukan
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                                {selectedBankIds.size} soal dipilih
                            </span>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setIsBankModalOpen(false)}>Batal</Button>
                                <Button 
                                    disabled={selectedBankIds.size === 0} 
                                    onClick={handleImportFromBank} 
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    Sisipkan Soal
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
