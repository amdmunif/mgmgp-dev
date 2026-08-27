import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, LayoutGrid, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';
import { lmsService } from '../../../services/lmsService';

export function QuizPlayer() {
    const { eventId, quizId } = useParams();
    const navigate = useNavigate();

    const [started, setStarted] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    
    // Quiz Data State
    const [quizData, setQuizData] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (quizId) {
            const fetchQuiz = async () => {
                try {
                    const data = await lmsService.getQuizByMaterialId(quizId);
                    setQuizData(data);
                    setQuestions(data.questions || []);
                    setTimeLeft((data.duration_minutes || 0) * 60);
                } catch (error) {
                    console.error("Failed to load quiz", error);
                    toast.error("Gagal memuat data kuis");
                } finally {
                    setLoading(false);
                }
            };
            fetchQuiz();
        }
    }, [quizId]);

    // Timer Logic
    useEffect(() => {
        if (!started || submitted || timeLeft <= 0 || quizData?.duration_minutes <= 0) return;
        
        const timerId = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => clearInterval(timerId);
    }, [started, submitted, timeLeft, quizData?.duration_minutes]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswer = (questionId: string, optionId: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleSubmit = () => {
        if (Object.keys(answers).length < questions.length) {
            if (!window.confirm('Ada soal yang belum dijawab. Yakin ingin mengumpulkan sekarang?')) {
                return;
            }
        }
        executeSubmit();
    };

    const handleAutoSubmit = () => {
        toast.error("Waktu habis! Jawaban Anda dikumpulkan otomatis.");
        executeSubmit();
    };

    const executeSubmit = () => {
        setSubmitted(true);
        setStarted(false);
        toast.success("Kuis berhasil diselesaikan!");
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;

    if (submitted) {
        let correctCount = 0;
        let totalPoints = 0;
        let earnedPoints = 0;
        
        questions.forEach((q: any) => {
            const p = q.points || 1;
            totalPoints += p;
            const correctOption = q.options?.find((o: any) => o.is_correct);
            if (correctOption && answers[q.id] === correctOption.id) {
                correctCount++;
                earnedPoints += p;
            }
        });

        const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Ujian Selesai!</h1>
                    <p className="text-gray-500 mb-6">Terima kasih telah mengerjakan {quizData?.title || 'ujian ini'}.</p>
                    
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
                        <div className="text-sm text-gray-500 font-medium mb-1">Nilai Anda</div>
                        <div className="text-5xl font-black text-gray-900">{score}</div>
                        <div className="text-sm text-gray-500 mt-2">Menjawab benar {correctCount} dari {questions.length} soal</div>
                    </div>

                    <Button onClick={() => navigate(`/member/lms/classroom/${eventId}`)} className="w-full h-12 text-lg">
                        Kembali ke Ruang Kelas
                    </Button>
                </div>
            </div>
        );
    }

    if (!started) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-lg w-full">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{quizData?.title || 'Persiapan Ujian'}</h1>
                    
                    <div className="space-y-4 mb-8 text-gray-600">
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="block text-gray-900">Durasi: {quizData?.duration_minutes > 0 ? `${quizData.duration_minutes} Menit` : 'Tanpa Batas Waktu'}</strong>
                                <p className="text-sm">Timer akan mulai berjalan saat Anda mengklik tombol mulai. Jika waktu habis, jawaban akan dikumpulkan otomatis.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <LayoutGrid className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="block text-gray-900">Jumlah Soal: {questions.length} Soal</strong>
                                <p className="text-sm">Pastikan Anda membaca setiap butir soal dengan teliti.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="block text-gray-900">Koneksi Internet</strong>
                                <p className="text-sm">Pastikan koneksi internet stabil. Jangan muat ulang (refresh) halaman saat ujian sedang berlangsung.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => navigate(`/member/lms/classroom/${eventId}`)} className="flex-1">
                            Kembali
                        </Button>
                        <Button onClick={() => setStarted(true)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            Mulai Ujian Sekarang
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const q = questions[currentQuestion];
    if (!q) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="font-bold text-gray-900 truncate max-w-[50%]">{quizData?.title || 'Kuis LMS'}</h1>
                    
                    <div className="flex items-center gap-4">
                        {quizData?.duration_minutes > 0 && (
                            <div className={cn(
                                "flex items-center gap-2 font-mono font-medium px-4 py-1.5 rounded-full",
                                timeLeft < 300 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                            )}>
                                <Clock className="w-4 h-4" />
                                {formatTime(timeLeft)}
                            </div>
                        )}
                        <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                            Kumpulkan
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex max-w-7xl mx-auto w-full p-6 gap-6">
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col">
                    <div className="mb-6 flex justify-between items-end">
                        <span className="text-gray-500 font-medium">SOAL NO. {currentQuestion + 1}</span>
                        <span className="text-gray-400 text-sm">Bobot: {q.points || 1}.00 Poin</span>
                    </div>
                    
                    <div className="prose max-w-none mb-10 text-lg text-gray-900 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.text || q.question_text || '' }} />

                    <div className="space-y-4">
                        {q.options?.map((opt: any, index: number) => {
                            const isSelected = answers[q.id] === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => handleAnswer(q.id, opt.id)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4",
                                        isSelected 
                                            ? "border-blue-500 bg-blue-50/50" 
                                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-medium",
                                        isSelected 
                                            ? "border-blue-500 text-blue-600" 
                                            : "border-gray-300 text-gray-500"
                                    )}>
                                        {String.fromCharCode(65 + index)}
                                    </div>
                                    <div className={cn(
                                        "mt-1 text-base leading-relaxed",
                                        isSelected ? "text-gray-900 font-medium" : "text-gray-700"
                                    )} dangerouslySetInnerHTML={{ __html: opt.text || opt.option_text || '' }} />
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
                        <Button 
                            variant="outline" 
                            disabled={currentQuestion === 0}
                            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                            className="h-12 px-6"
                        >
                            <ChevronLeft className="w-5 h-5 mr-2" /> Sebelumnya
                        </Button>
                        <Button 
                            onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                            disabled={currentQuestion === questions.length - 1}
                            className="text-blue-600 bg-blue-50 hover:bg-blue-100"
                        >
                            Selanjutnya <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>

                <div className="w-80 flex-shrink-0 hidden lg:block">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                        <div className="flex items-center gap-2 mb-6">
                            <LayoutGrid className="w-5 h-5 text-gray-400" />
                            <h3 className="font-bold text-gray-900">Navigasi Soal</h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-8">
                            {questions.map((_, idx) => {
                                const qId = questions[idx].id;
                                const isAnswered = !!answers[qId];
                                const isActive = currentQuestion === idx;
                                
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentQuestion(idx)}
                                        className={cn(
                                            "w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center",
                                            isActive 
                                                ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900 ring-offset-2" 
                                                : isAnswered
                                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        )}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div className="space-y-3 pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-blue-100"></div>
                                    <span className="text-gray-600">Sudah Dijawab</span>
                                </div>
                                <span className="font-medium">{Object.keys(answers).length}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-gray-100"></div>
                                    <span className="text-gray-600">Belum Dijawab</span>
                                </div>
                                <span className="font-medium">{questions.length - Object.keys(answers).length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
