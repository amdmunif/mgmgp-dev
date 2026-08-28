import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, ExternalLink, X, Loader2, CheckSquare, Users } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';
import { lmsService } from '../../../services/lmsService';
import { DataTable } from '../../../components/ui/DataTable';

export function AdminAssignmentGrader() {
    const { id, assignmentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { setPageHeader } = useOutletContext<any>() || {};
    const assignmentTitle = location.state?.assignmentTitle || 'Memuat...';

    const [filterStatus, setFilterStatus] = useState('all'); // all | pending | graded
    
    // State for modal grading
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [scoreInput, setScoreInput] = useState('');
    const [feedbackInput, setFeedbackInput] = useState('');

    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Penilaian Tugas',
                description: assignmentTitle,
                icon: <CheckSquare className="w-6 h-6" />
            });
        }
        if (assignmentId) {
            fetchSubmissions();
        }
    }, [assignmentId, assignmentTitle, setPageHeader]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const data = await lmsService.getAllAssignmentSubmissions(assignmentId!);
            setSubmissions(data);
        } catch (error) {
            toast.error("Gagal memuat data pengumpulan tugas");
        } finally {
            setLoading(false);
        }
    };

    const filteredSubmissions = submissions.filter(sub => {
        const isGraded = sub.score !== null;
        if (filterStatus === 'pending') return !isGraded;
        if (filterStatus === 'graded') return isGraded;
        return true;
    });

    const handleOpenGradeModal = (sub: any) => {
        setSelectedSub(sub);
        setScoreInput(sub.score !== null ? String(sub.score) : '');
        setFeedbackInput(sub.feedback || '');
    };

    const handleSaveGrade = async () => {
        if (!selectedSub) return;
        try {
            setIsSaving(true);
            const scoreVal = scoreInput.trim() !== '' ? parseFloat(scoreInput) : null;
            await lmsService.gradeAssignment(selectedSub.id, scoreVal, feedbackInput);
            toast.success(`Nilai untuk ${selectedSub.user_name} berhasil disimpan!`);
            setSelectedSub(null);
            fetchSubmissions(); // refresh list
        } catch (error) {
            toast.error("Gagal menyimpan nilai");
        } finally {
            setIsSaving(false);
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
                cell: (p: any) => <div className="font-medium text-gray-900">{p.user_name}</div>
            },
            {
                header: 'Waktu Pengumpulan',
                accessorKey: 'submitted_at',
                cell: (p: any) => <div className="text-gray-500">{formatDate(p.submitted_at)}</div>
            },
            {
                header: 'File / Link',
                accessorKey: 'link_url',
                cell: (p: any) => (
                    <a 
                        href={p.link_url || p.content_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        <FileText className="w-4 h-4" /> Buka Link
                    </a>
                )
            },
            {
                header: 'Status',
                accessorKey: 'status', // Virtual accessor
                cell: (p: any) => (
                    <div className="text-center">
                        {p.score !== null ? (
                            <div className="inline-flex flex-col items-center">
                                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Dinilai
                                </span>
                                <span className="text-lg font-bold text-gray-900 mt-1">{p.score}</span>
                            </div>
                        ) : (
                            <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                Menunggu
                            </span>
                        )}
                    </div>
                )
            },
            {
                header: 'Aksi',
                accessorKey: 'actions',
                cell: (p: any) => (
                    <div className="text-center">
                        <Button 
                            onClick={() => handleOpenGradeModal(p)}
                            size="sm" 
                            variant={p.score !== null ? "outline" : "default"}
                            className={cn(p.score === null && "bg-blue-600 hover:bg-blue-700")}
                        >
                            {p.score !== null ? 'Edit Nilai' : 'Beri Nilai'}
                        </Button>
                    </div>
                )
            }
        ];
    };

    return (
        <div className="space-y-6">
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : submissions.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-100 rounded-xl flex flex-col items-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-900 font-medium mb-1">Tidak Ada Data</h3>
                    <p className="text-gray-500 text-sm mb-6">Belum ada peserta yang mengumpulkan tugas ini.</p>
                    <Button variant="outline" onClick={() => navigate(`/admin/events/${id}/lms`)} className="bg-white text-gray-700 hover:bg-gray-100 shadow-sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Kelas
                    </Button>
                </div>
            ) : (
                <DataTable 
                    data={filteredSubmissions} 
                    columns={buildColumns()} 
                    searchKeys={['user_name']}
                    pageSize={15}
                    filterContent={
                        <div className="flex items-center gap-4">
                            <Button variant="outline" onClick={() => navigate(`/admin/events/${id}/lms`)} className="bg-white text-gray-700 hover:bg-gray-100 shadow-sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Kembali ke Kelas
                            </Button>
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Menunggu Dinilai</option>
                                <option value="graded">Sudah Dinilai</option>
                            </select>
                        </div>
                    }
                />
            )}

            {/* Grading Modal Overlay */}
            {selectedSub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Penilaian Tugas</h3>
                            <button onClick={() => setSelectedSub(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Peserta</label>
                                <div className="font-medium text-gray-900">{selectedSub.user_name}</div>
                            </div>
                            
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-900">Lampiran Jawaban</span>
                                    {selectedSub.content_url && (
                                        <a href={selectedSub.content_url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 bg-white px-2 py-1 rounded text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors">
                                            Buka <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                                {selectedSub.text_content && (
                                    <div className="text-sm text-blue-800 italic border-t border-blue-200/50 pt-2 mt-2">
                                        "{selectedSub.text_content}"
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 items-start gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Skor (0-100)</label>
                                    <input 
                                        type="number" 
                                        min="0" max="100"
                                        value={scoreInput}
                                        onChange={(e) => setScoreInput(e.target.value)}
                                        className="w-full px-3 py-2 text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Umpan Balik / Catatan</label>
                                    <textarea 
                                        rows={3}
                                        value={feedbackInput}
                                        onChange={(e) => setFeedbackInput(e.target.value)}
                                        placeholder="Berikan catatan perbaikan (opsional)..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setSelectedSub(null)} disabled={isSaving}>
                                Batal
                            </Button>
                            <Button onClick={handleSaveGrade} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Simpan Nilai
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
