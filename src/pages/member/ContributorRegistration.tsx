import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contributorService, type ContributorStatus } from '../../services/contributorService';
import { questionService, type Question } from '../../services/questionService';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/button';
import { CheckCircle2, AlertCircle, Clock, Trophy, ChevronRight, PenTool, XCircle, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function ContributorRegistration() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<ContributorStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [myQuestions, setMyQuestions] = useState<Question[]>([]);
    const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const statusData = await contributorService.getStatus();
            setStatus(statusData);

            // Fetch my questions
            const currentUser = await authService.getCurrentUser();
            if (currentUser?.user) {
                const questions = await questionService.getAll({ creator_id: currentUser.user.id });
                setMyQuestions(questions);
            }
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!confirm('Apakah Anda yakin ingin mendaftar sebagai Kontributor?')) return;
        setApplying(true);
        try {
            await contributorService.apply();
            toast.success('Pendaftaran berhasil dikirim!');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Gagal mendaftar');
        } finally {
            setApplying(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
        try {
            await questionService.delete(id);
            toast.success('Soal berhasil dihapus');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Gagal menghapus soal');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    if (!status) return <div className="p-8 text-center">Gagal memuat status.</div>;

    const isContributor = status.role === 'Kontributor';
    const isPending = status.status === 'pending';
    const count = status.question_count || 0;
    const progress = Math.min((count / 100) * 100, 100);
    const canApply = count >= 100 && !isContributor && !isPending;

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">Program Kontributor MGMP</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Bergabunglah menjadi kontributor aktif dan dapatkan akses Premium gratis selama 1 tahun.
                    Tugas Anda hanya membuat minimal 100 soal berkualitas yang terverifikasi.
                </p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <PenTool className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">1. Buat Soal</h3>
                    <p className="text-gray-500 text-sm">Buat dan submit 100 soal latihan ke Bank Soal.</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">2. Verifikasi</h3>
                    <p className="text-gray-500 text-sm">Tim kami akan memverifikasi kualitas soal Anda.</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                        <Trophy className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">3. Dapatkan Reward</h3>
                    <p className="text-gray-500 text-sm">Otomatis menjadi Kontributor + Gratis Premium 1 Tahun.</p>
                </div>
            </div>

            {/* Current Progress */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Progress Saya</h2>
                    <span className="text-2xl font-bold text-primary-600">{count} / 100</span>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-4 mb-6">
                    <div
                        className="bg-primary-600 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {isContributor ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-700">
                        <CheckCircle2 className="w-6 h-6" />
                        <div>
                            <p className="font-bold">Selamat! Anda adalah Kontributor.</p>
                            <p className="text-sm">Nikmati akses premium dan fitur eksklusif.</p>
                        </div>
                    </div>
                ) : isPending ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3 text-yellow-700">
                        <Clock className="w-6 h-6" />
                        <div>
                            <p className="font-bold">Pendaftaran Sedang Ditinjau</p>
                            <p className="text-sm">Mohon tunggu admin memverifikasi aplikasi Anda.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {count < 100 ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 text-blue-700">
                                <AlertCircle className="w-6 h-6" />
                                <p>Anda belum mencapai target 100 soal. Yuk tambah soal lagi!</p>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-700">
                                <CheckCircle2 className="w-6 h-6" />
                                <p>Target tercapai! Anda bisa mendaftar sekarang.</p>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <Button variant="outline" onClick={() => navigate('/member/questions/create')} className="flex-1">
                                <PenTool className="w-4 h-4 mr-2" />
                                Tambah Soal
                            </Button>
                            <Button
                                onClick={handleApply}
                                disabled={!canApply || applying}
                                className="flex-1"
                            >
                                {applying ? 'Mengirim...' : 'Daftar Kontributor'}
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Questions List */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm mt-8">
                <h2 className="text-xl font-bold mb-6">Daftar Soal Saya ({myQuestions.length})</h2>

                {myQuestions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Belum ada soal yang dibuat.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-700 text-sm">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Soal</th>
                                    <th className="px-4 py-3">Mapel</th>
                                    <th className="px-4 py-3">TP</th>
                                    <th className="px-4 py-3">Kelas</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {myQuestions.map((q) => (
                                    <tr key={q.id}>
                                        <td className="px-4 py-3">
                                            <div className="line-clamp-1 text-sm font-medium" dangerouslySetInnerHTML={{ __html: q.content }} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{q.mapel}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {q.tp_code ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-mono font-medium text-blue-700">
                                                    {q.tp_code}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{q.kelas}</td>
                                        <td className="px-4 py-3 text-center">
                                            {q.status === 'verified' ? (
                                                <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                                                </span>
                                            ) : q.status === 'rejected' ? (
                                                <span className="inline-flex items-center text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full">
                                                    <XCircle className="w-3 h-3 mr-1" /> Rejected
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                                                    <Clock className="w-3 h-3 mr-1" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => setViewingQuestion(q)} title="Lihat">
                                                    <Eye className="w-4 h-4 text-gray-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/member/questions/edit/${q.id}`)} title="Edit">
                                                    <Pencil className="w-4 h-4 text-blue-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)} title="Hapus">
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {viewingQuestion && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold">Detail Pertanyaan</h2>
                                <div className="flex gap-2 items-center text-sm text-gray-500 mt-1">
                                    <span>{viewingQuestion.mapel}</span>
                                    <span>•</span>
                                    <span>Kelas {viewingQuestion.kelas}</span>
                                    {viewingQuestion.tp_code && (
                                        <>
                                            <span>•</span>
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium font-mono">
                                                TP: {viewingQuestion.tp_code}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => setViewingQuestion(null)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: viewingQuestion.content }} />

                            {viewingQuestion.options && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-gray-700">Pilihan Jawaban:</h4>
                                    {viewingQuestion.options.map((opt: any, idx: number) => (
                                        <div key={idx} className={`p-3 rounded-lg border flex items-center gap-3 ${opt.is_correct ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${opt.is_correct ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className={`text-sm ${opt.is_correct ? "font-medium text-green-800" : ""}`}>{opt.text}</span>
                                            {opt.is_correct && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {(viewingQuestion.type === 'essay' || viewingQuestion.type === 'short_answer') && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <h4 className="font-semibold text-sm text-blue-900 mb-1">Kunci Jawaban:</h4>
                                    <p className="text-blue-800">{viewingQuestion.answer_key || '-'}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={() => setViewingQuestion(null)}>Tutup</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
