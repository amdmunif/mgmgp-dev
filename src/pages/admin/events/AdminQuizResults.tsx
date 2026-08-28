import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
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
                header: 'Kelulusan',
                accessorKey: 'is_passed',
                cell: (p: any) => (
                    <div>
                        {p.total_score !== null ? (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                p.is_passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {p.is_passed ? 'LULUS' : 'TIDAK LULUS'}
                            </span>
                        ) : '-'}
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
            )}
        </div>
    );
}
