import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Loader2, Users, BookOpen } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { lmsService } from '../../../services/lmsService';
import { toast } from 'react-hot-toast';
import { DataTable } from '../../../components/ui/DataTable';

export function AdminAssignmentDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setPageHeader } = useOutletContext<any>() || {};
    const [loading, setLoading] = useState(true);
    const [gradebook, setGradebook] = useState<any>(null);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Buku Nilai (Gradebook)',
                description: 'Daftar nilai seluruh peserta dari semua kuis dan penugasan di kelas ini',
                icon: <BookOpen className="w-6 h-6" />
            });
        }
        if (id) {
            loadGradebook();
        }
    }, [id, setPageHeader]);

    const loadGradebook = async () => {
        try {
            setLoading(true);
            const data = await lmsService.getEventGradebook(id!);
            setGradebook(data);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat buku nilai");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Memuat daftar nilai peserta...</div>;

    const buildColumns = () => {
        if (!gradebook) return [];
        
        const columns: any[] = [
            {
                header: 'Nama Peserta',
                accessorKey: 'nama',
                cell: (p: any) => (
                    <div>
                        <div className="font-medium text-gray-900">{p.nama}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.asal_sekolah || 'Asal sekolah tidak diketahui'}</div>
                    </div>
                ),
                className: 'min-w-[200px]'
            }
        ];

        gradebook.quizzes.forEach((q: any) => {
            columns.push({
                header: (
                    <div className="text-center">
                        <div className="text-xs text-blue-600 mb-1">Kuis</div>
                        {q.title}
                    </div>
                ),
                cell: (p: any) => {
                    const quizScore = p.quizzes.find((x: any) => x.quiz_id === q.id)?.score;
                    return (
                        <div className="text-center font-medium">
                            {quizScore !== null && quizScore !== undefined ? (
                                <span className="text-gray-900">{quizScore}</span>
                            ) : (
                                <span className="text-gray-400">-</span>
                            )}
                        </div>
                    );
                },
                className: 'text-center whitespace-nowrap'
            });
        });

        gradebook.assignments.forEach((a: any) => {
            columns.push({
                header: (
                    <div className="text-center">
                        <div className="text-xs text-green-600 mb-1">Tugas</div>
                        {a.title}
                    </div>
                ),
                cell: (p: any) => {
                    const asgScore = p.assignments.find((x: any) => x.assignment_id === a.id)?.score;
                    return (
                        <div className="text-center font-medium">
                            {asgScore !== null && asgScore !== undefined ? (
                                <span className="text-gray-900">{asgScore}</span>
                            ) : (
                                <span className="text-gray-400">-</span>
                            )}
                        </div>
                    );
                },
                className: 'text-center whitespace-nowrap'
            });
        });

        columns.push({
            header: <div className="text-center">Rerata Akhir</div>,
            accessorKey: 'average_score',
            cell: (p: any) => (
                <div className="text-center font-bold">
                    <span className={p.average_score >= 70 ? 'text-green-600' : p.average_score > 0 ? 'text-orange-500' : 'text-gray-400'}>
                        {p.average_score > 0 ? p.average_score.toFixed(2) : '-'}
                    </span>
                </div>
            ),
            className: 'text-center bg-gray-50/50 min-w-[120px]'
        });

        return columns;
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <Button variant="outline" onClick={() => navigate(`/admin/events/${id}/lms`)} className="bg-white text-gray-700 hover:bg-gray-100 shadow-sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali ke Kelas
                </Button>
            </div>

            {!gradebook?.participants || gradebook.participants.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-100 rounded-xl flex flex-col items-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-900 font-medium mb-1">Tidak Ada Peserta</h3>
                    <p className="text-gray-500 text-sm">Belum ada peserta yang mendaftar di acara/kelas ini.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <DataTable 
                        data={gradebook.participants} 
                        columns={buildColumns()} 
                        searchKeys={['nama', 'asal_sekolah']}
                        pageSize={15}
                    />
                </div>
            )}
        </div>
    );
}
