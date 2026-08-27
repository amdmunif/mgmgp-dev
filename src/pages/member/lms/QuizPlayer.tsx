import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';

// Mock Data
const MOCK_QUESTIONS = [
    {
        id: 'q1',
        text: 'Manakah dari berikut ini yang BUKAN merupakan cabang utama dari Kecerdasan Artifisial?',
        options: [
            { id: 'o1', text: 'Machine Learning' },
            { id: 'o2', text: 'Computer Vision' },
            { id: 'o3', text: 'Quantum Physics' },
            { id: 'o4', text: 'Natural Language Processing' }
        ]
    },
    {
        id: 'q2',
        text: 'Pendekatan AI yang terinspirasi dari struktur sel saraf otak manusia disebut...',
        options: [
            { id: 'o1', text: 'Fuzzy Logic' },
            { id: 'o2', text: 'Artificial Neural Networks' },
            { id: 'o3', text: 'Expert Systems' },
            { id: 'o4', text: 'Genetic Algorithms' }
        ]
    },
    {
        id: 'q3',
        text: 'Tokoh yang dikenal sebagai salah satu "Bapak Kecerdasan Artifisial" dan penggagas uji coba mesin cerdas adalah...',
        options: [
            { id: 'o1', text: 'Alan Turing' },
            { id: 'o2', text: 'Albert Einstein' },
            { id: 'o3', text: 'Isaac Newton' },
            { id: 'o4', text: 'Charles Babbage' }
        ]
    }
];

export function QuizPlayer() {
    const { eventId, quizId } = useParams();
    const navigate = useNavigate();

    const [started, setStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);

    // Timer Logic
    useEffect(() => {
        if (!started || submitted || timeLeft <= 0) return;
        
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
    }, [started, submitted, timeLeft]);

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
        if (Object.keys(answers).length < MOCK_QUESTIONS.length) {
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

    if (submitted) {
        // Calculate mock score
        const score = Math.round((Object.keys(answers).length / MOCK_QUESTIONS.length) * 100);
        
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Ujian Selesai!</h1>
                    <p className="text-gray-500 mb-6">Terima kasih telah mengerjakan ujian ini.</p>
                    
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
                        <div className="text-sm text-gray-500 font-medium mb-1">Nilai Anda</div>
                        <div className="text-5xl font-black text-gray-900">{score}</div>
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
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Persiapan Ujian: Pre-test</h1>
                    
                    <div className="space-y-4 mb-8 text-gray-600">
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="block text-gray-900">Durasi: 30 Menit</strong>
                                <p className="text-sm">Timer akan mulai berjalan saat Anda mengklik tombol mulai. Jika waktu habis, jawaban akan dikumpulkan otomatis.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <LayoutGrid className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="block text-gray-900">Jumlah Soal: {MOCK_QUESTIONS.length} Soal Pilihan Ganda</strong>
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

    const currentQuestion = MOCK_QUESTIONS[currentIndex];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Topbar */}
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
                <h1 className="font-bold text-gray-900">Pre-test Kecerdasan Artifisial</h1>
                <div className="flex items-center gap-6">
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-lg font-bold transition-colors",
                        timeLeft < 300 ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-700"
                    )}>
                        <Clock className="w-5 h-5" />
                        {formatTime(timeLeft)}
                    </div>
                    <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                        Kumpulkan
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex max-w-7xl mx-auto w-full p-6 gap-6">
                {/* Main Content: Question */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col">
                    <div className="mb-6 flex justify-between items-end">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Soal No. {currentIndex + 1}</h2>
                        <span className="text-sm text-gray-500">Bobot: 1.00 Poin</span>
                    </div>
                    
                    <div className="text-xl text-gray-800 leading-relaxed mb-10">
                        {currentQuestion.text}
                    </div>

                    <div className="space-y-3 mt-auto">
                        {currentQuestion.options.map((opt, i) => {
                            const isSelected = answers[currentQuestion.id] === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => handleAnswer(currentQuestion.id, opt.id)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4",
                                        isSelected 
                                            ? "border-blue-500 bg-blue-50" 
                                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors",
                                        isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300 text-gray-500"
                                    )}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className={cn("text-lg", isSelected ? "text-blue-900 font-medium" : "text-gray-700")}>
                                        {opt.text}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
                        <Button 
                            variant="outline" 
                            disabled={currentIndex === 0}
                            onClick={() => setCurrentIndex(prev => prev - 1)}
                            className="h-12 px-6"
                        >
                            <ChevronLeft className="w-5 h-5 mr-2" /> Sebelumnya
                        </Button>
                        <Button 
                            disabled={currentIndex === MOCK_QUESTIONS.length - 1}
                            onClick={() => setCurrentIndex(prev => prev + 1)}
                            className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Selanjutnya <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>

                {/* Sidebar: Navigasi Kotak Soal */}
                <div className="w-80 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-gray-400" />
                            Navigasi Soal
                        </h3>
                        
                        <div className="grid grid-cols-5 gap-2">
                            {MOCK_QUESTIONS.map((q, idx) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = currentIndex === idx;
                                
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={cn(
                                            "aspect-square rounded-lg font-bold text-sm transition-all flex items-center justify-center border-2",
                                            isCurrent ? "border-gray-900 scale-110 shadow-md" : "border-transparent",
                                            isAnswered 
                                                ? (isCurrent ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700") 
                                                : (isCurrent ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")
                                        )}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div className="mt-8 space-y-2 text-sm text-gray-500 border-t border-gray-100 pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200"></div>
                                <span>Sudah Dijawab ({Object.keys(answers).length})</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
                                <span>Belum Dijawab ({MOCK_QUESTIONS.length - Object.keys(answers).length})</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
