import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { toast } from 'react-hot-toast';
import { cn } from '../../../lib/utils';

interface QuizOption {
    id: string;
    text: string;
    is_correct: boolean;
}

interface QuizQuestion {
    id: string;
    text: string;
    options: QuizOption[];
}

export function AdminQuizBuilder() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [title, setTitle] = useState('Pretest Kelas Kecerdasan Artifisial');
    const [duration, setDuration] = useState(30);
    const [passingScore, setPassingScore] = useState(70);
    const [questions, setQuestions] = useState<QuizQuestion[]>([
        {
            id: 'q1',
            text: 'Definisi yang paling tepat untuk Kecerdasan Artifisial (KA) adalah...',
            options: [
                { id: 'o1', text: 'Kemampuan sistem komputer meniru fungsi kognitif manusia', is_correct: true },
                { id: 'o2', text: 'Perangkat keras berkecepatan tinggi', is_correct: false },
                { id: 'o3', text: 'Program matematika kompleks', is_correct: false },
                { id: 'o4', text: 'Jaringan komputer global', is_correct: false },
            ]
        }
    ]);

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: `q${Date.now()}`,
                text: '',
                options: [
                    { id: `o${Date.now()}1`, text: '', is_correct: true },
                    { id: `o${Date.now()}2`, text: '', is_correct: false },
                    { id: `o${Date.now()}3`, text: '', is_correct: false },
                    { id: `o${Date.now()}4`, text: '', is_correct: false },
                ]
            }
        ]);
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

    const handleSave = () => {
        toast.success('Kuis berhasil disimpan!');
        navigate(`/admin/events/${id}/lms`);
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(`/admin/events/${id}/lms`)} className="text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quiz Builder</h1>
                        <p className="text-gray-500 text-sm">Buat dan atur soal pilihan ganda</p>
                    </div>
                </div>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Kuis
                </Button>
            </div>

            {/* Quiz Settings */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                <h2 className="font-bold text-gray-800 mb-4">Pengaturan Kuis</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Kuis</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (Menit)</label>
                        <div className="relative">
                            <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Kelulusan (KKM)</label>
                        <input
                            type="number"
                            value={passingScore}
                            onChange={(e) => setPassingScore(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Questions Builder */}
            <div className="space-y-6">
                {questions.map((q, index) => (
                    <div key={q.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        
                        <h3 className="font-bold text-gray-800 mb-3">Soal {index + 1}</h3>
                        <textarea
                            value={q.text}
                            onChange={(e) => handleUpdateQuestion(q.id, e.target.value)}
                            placeholder="Tulis pertanyaan di sini..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                        />

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Pilihan Jawaban</label>
                            {q.options.map((opt, optIndex) => (
                                <div key={opt.id} className={cn(
                                    "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                                    opt.is_correct ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-gray-300"
                                )}>
                                    <button 
                                        onClick={() => handleSetCorrectOption(q.id, opt.id)}
                                        className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors",
                                            opt.is_correct ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-transparent hover:border-gray-400"
                                        )}
                                        title="Jadikan Jawaban Benar"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <span className="font-medium text-gray-500 w-6">
                                        {String.fromCharCode(65 + optIndex)}.
                                    </span>
                                    <input
                                        type="text"
                                        value={opt.text}
                                        onChange={(e) => handleUpdateOption(q.id, opt.id, e.target.value)}
                                        placeholder={`Pilihan ${optIndex + 1}`}
                                        className="flex-1 bg-transparent outline-none py-1"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <Button 
                    onClick={handleAddQuestion} 
                    variant="outline" 
                    className="w-full border-dashed border-2 border-gray-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50 h-14"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Tambah Soal
                </Button>
            </div>
        </div>
    );
}
