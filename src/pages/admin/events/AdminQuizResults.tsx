import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Loader2, Users, RotateCcw, CheckCircle2, XCircle, X, Search } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { lmsService } from '../../../services/lmsService';
import { toast } from 'react-hot-toast';
import { DataTable } from '../../../components/ui/DataTable';

export function AdminQuizResults() {
    const { id, quizId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { setPageHeader } = useOutletContext<any>() || {};
    const quizTitle = location.state?.quizTitle || 'Memuat...';

    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [selectedAttemptDetails, setSelectedAttemptDetails] = useState<any>(null);
    
    // Matrix View State
    const [viewMode, setViewMode] = useState<'summary' | 'matrix'>('summary');
    const [detailedResults, setDetailedResults] = useState<any>(null);
    const [loadingMatrix, setLoadingMatrix] = useState(false);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Hasil Kuis Peserta',
                description: quizTitle,
            });
        }
        if (quizId) {
            fetchAttempts();
        }
    }, [quizId, quizTitle, setPageHeader]);

    const fetchAttempts = async () => {
        try {
            setLoading(true);
            const data = await lmsService.getAllQuizAttempts(quizId!);
            setAttempts(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Gagal memuat hasil kuis");
        } finally {
            setLoading(false);
        }
    };

    const fetchDetailedResults = async () => {
        if (detailedResults) return; // already fetched
        try {
            setLoadingMatrix(true);
            const data = await lmsService.getQuizDetailedResults(quizId!);
            setDetailedResults(data);
        } catch (error) {
            toast.error("Gagal memuat detail matrix");
        } finally {
            setLoadingMatrix(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'matrix') {
            fetchDetailedResults();
        }
    }, [viewMode]);

    const handleViewDetails = async (attemptId: string) => {
        setIsDetailsModalOpen(true);
        setLoadingDetails(true);
        setSelectedAttemptDetails(null);
        try {
            const data = await lmsService.getQuizAttemptDetails(attemptId);
            setSelectedAttemptDetails(data);
        } catch (error) {
            toast.error("Gagal memuat detail kuis");
            setIsDetailsModalOpen(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleResetAttempt = async (attemptId: string, userName: string) => {
        if (!window.confirm(`Anda yakin ingin mereset kuis untuk peserta ${userName}? Hasil kuis akan dihapus secara permanen dan peserta dapat mengulang dari awal.`)) return;
        try {
            await lmsService.deleteQuizAttempt(attemptId);
            toast.success("Kuis berhasil direset");
            fetchAttempts();
        } catch (error) {
            toast.error("Gagal mereset kuis");
        }
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    const buildColumns = () => {
        return [
            {
                header: 'Nama Peserta',
                accessorKey: 'user_name',
                cell: (p: any) => (
                    <div className="font-medium text-gray-900">{p.user_name}</div>
                )
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: (p: any) => (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                        {p.status === 'completed' ? 'Selesai' : 'Sedang Mengerjakan'}
                    </span>
                )
            },
            {
                header: 'Waktu Selesai',
                accessorKey: 'finished_at',
                cell: (p: any) => <span>{formatDate(p.finished_at)}</span>
            },
            {
                header: 'Skor',
                accessorKey: 'total_score',
                cell: (p: any) => (
                    <div className="font-bold text-gray-900">
                        {p.total_score !== null ? Number(p.total_score) : '-'}
                    </div>
                )
            },
            {
                header: 'Aksi',
                accessorKey: 'id',
                cell: (p: any) => (
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewDetails(p.id)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 h-8"
                            title="Lihat Detail Jawaban"
                        >
                            <Search className="w-3 h-3 mr-1.5" /> Detail
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleResetAttempt(p.id, p.user_name)}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8"
                            title="Reset Kuis Peserta"
                        >
                            <RotateCcw className="w-3 h-3 mr-1.5" /> Reset
                        </Button>
                    </div>
                )
            }
        ];
    };

    const buildMatrixColumns = () => {
        if (!detailedResults || !detailedResults.questions) return [];
        
        const cols: any[] = [
            {
                header: 'Nama Peserta',
                accessorKey: 'user_name',
                cell: (p: any) => (
                    <div>
                        <div className="font-medium text-gray-900">{p.user_name}</div>
                        {p.user_email && <div className="text-xs text-gray-500">{p.user_email}</div>}
                    </div>
                )
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: (p: any) => 'Selesai'
            },
            {
                header: 'Waktu Mulai',
                accessorKey: 'started_at',
                cell: (p: any) => formatDate(p.started_at)
            },
            {
                header: 'Waktu Selesai',
                accessorKey: 'finished_at',
                cell: (p: any) => formatDate(p.finished_at)
            },
            {
                header: 'Nilai',
                accessorKey: 'total_score',
                cell: (p: any) => (
                    <div className="font-bold text-gray-900">
                        {p.total_score !== null ? Number(p.total_score) : '-'}
                    </div>
                )
            }
        ];

        // Add columns for each question
        detailedResults.questions.forEach((q: any, idx: number) => {
            cols.push({
                header: (
                    <div className="text-center">
                        <div>Q.{idx + 1}</div>
                        <div className="text-xs font-normal text-gray-500">/{q.points}</div>
                    </div>
                ),
                accessorKey: `q_${q.id}`,
                cell: (p: any) => {
                    const ans = p.answers?.[q.id];
                    if (!ans) return <div className="text-center text-gray-400">-</div>;
                    
                    const isCorrect = ans.is_correct == 1 || ans.is_correct === true;
                    return (
                        <div className="flex items-center justify-center gap-1.5">
                            {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={isCorrect ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
                                {ans.score_awarded}
                            </span>
                        </div>
                    );
                }
            });
        });

        return cols;
    };

    return (
        <div className="space-y-6">
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : attempts.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-100 rounded-xl flex flex-col items-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-900 font-medium mb-1">Tidak Ada Data</h3>
                    <p className="text-gray-500 text-sm mb-6">Belum ada peserta yang mengerjakan kuis ini.</p>
                    <Button variant="outline" onClick={() => navigate(`/admin/events/${id}/lms`)} className="bg-white text-gray-700 hover:bg-gray-100 shadow-sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Kelas
                    </Button>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('summary')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                    viewMode === 'summary' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                }`}
                            >
                                Ringkasan
                            </button>
                            <button
                                onClick={() => setViewMode('matrix')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                    viewMode === 'matrix' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                }`}
                            >
                                Detail Matrix
                            </button>
                        </div>
                    </div>

                    {viewMode === 'summary' ? (
                        <div key="summary" className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <DataTable 
                                data={attempts} 
                                columns={buildColumns()} 
                                searchKeys={['user_name']}
                                pageSize={15}
                                filterContent={
                                    <Button variant="outline" onClick={() => navigate(`/admin/events/${id}/lms`)} className="bg-white text-gray-700 hover:bg-gray-100 shadow-sm">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Kembali ke Kelas
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <div key="matrix" className="bg-white rounded-xl shadow-sm border border-gray-100">
                            {loadingMatrix ? (
                                <div className="flex justify-center p-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                </div>
                            ) : detailedResults ? (
                                <div className="overflow-x-auto w-full">
                                    <DataTable
                                        columns={buildMatrixColumns()}
                                        data={detailedResults.attempts || []}
                                        searchKeys={['user_name', 'user_email']}
                                        pageSize={15}
                                        filterContent={
                                            <Button variant="outline" onClick={() => navigate(`/admin/events/${id}/lms`)} className="bg-white text-gray-700 hover:bg-gray-100 shadow-sm">
                                                <ArrowLeft className="w-4 h-4 mr-2" />
                                                Kembali ke Kelas
                                            </Button>
                                        }
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    Gagal memuat matrix.
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Modal Detail Jawaban */}
            {isDetailsModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
                    <div className="bg-gray-50 w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Detail Jawaban</h2>
                                {selectedAttemptDetails && <p className="text-sm text-gray-500 mt-1">{selectedAttemptDetails.user_name} • Skor: {selectedAttemptDetails.total_score}</p>}
                            </div>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {loadingDetails ? (
                                <div className="flex justify-center p-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                </div>
                            ) : selectedAttemptDetails?.details?.length > 0 ? (
                                selectedAttemptDetails.details.map((q: any, idx: number) => {
                                    let selectedOpts: string[] = [];
                                    try {
                                        if (q.selected_option_id) {
                                            if (q.selected_option_id.startsWith('[')) {
                                                selectedOpts = JSON.parse(q.selected_option_id);
                                            } else {
                                                selectedOpts = [q.selected_option_id];
                                            }
                                        }
                                    } catch(e) {}
                                    
                                    return (
                                        <div key={q.question_id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <span className="w-7 h-7 rounded bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-sm shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                                                </div>
                                                <div className={`px-2 py-1 rounded text-xs font-bold border ${q.is_correct ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                    {q.is_correct ? 'BENAR' : 'SALAH'}
                                                </div>
                                            </div>
                                            <div className="space-y-2 ml-10">
                                                {q.options?.map((opt: any) => {
                                                    const isSelected = selectedOpts.includes(opt.id);
                                                    const isCorrectKey = opt.is_correct === 1 || opt.is_correct === true;
                                                    
                                                    let borderClass = "border-gray-200";
                                                    let bgClass = "bg-white";
                                                    let icon = null;
                                                    
                                                    if (isSelected && isCorrectKey) {
                                                        borderClass = "border-green-500";
                                                        bgClass = "bg-green-50";
                                                        icon = <CheckCircle2 className="w-5 h-5 text-green-600" />;
                                                    } else if (isSelected && !isCorrectKey) {
                                                        borderClass = "border-red-500";
                                                        bgClass = "bg-red-50";
                                                        icon = <XCircle className="w-5 h-5 text-red-500" />;
                                                    } else if (!isSelected && isCorrectKey) {
                                                        borderClass = "border-green-300 border-dashed";
                                                        bgClass = "bg-green-50/50 opacity-70";
                                                        icon = <CheckCircle2 className="w-5 h-5 text-green-500" />;
                                                    }
                                                    
                                                    return (
                                                        <div key={opt.id} className={`flex items-start gap-3 p-3 rounded-lg border ${borderClass} ${bgClass}`}>
                                                            <div className="mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center">
                                                                {icon || <div className="w-4 h-4 rounded-full border border-gray-300"></div>}
                                                            </div>
                                                            <div className="text-sm text-gray-700 flex-1" dangerouslySetInnerHTML={{ __html: opt.text || opt.option_text || '' }} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    Detail jawaban tidak tersedia.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
