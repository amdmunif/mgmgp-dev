import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { lmsService } from '../../../services/lmsService';
import { toast } from 'react-hot-toast';

export function AdminAssignmentDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [gradebook, setGradebook] = useState<any>(null);

    useEffect(() => {
        if (id) {
            loadGradebook();
        }
    }, [id]);

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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <Button variant="ghost" onClick={() => navigate(`/admin/events/${id}/lms`)} className="text-gray-500 p-2 h-auto">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="font-bold text-lg text-gray-800">Buku Nilai (Gradebook)</h1>
                    <p className="text-sm text-gray-500">Daftar nilai seluruh peserta dari semua kuis dan penugasan di kelas ini</p>
                </div>
            </div>

            {!gradebook?.participants || gradebook.participants.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-100 rounded-xl flex flex-col items-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-900 font-medium mb-1">Tidak Ada Peserta</h3>
                    <p className="text-gray-500 text-sm">Belum ada peserta yang mendaftar di acara/kelas ini.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="py-4 px-6 font-semibold min-w-[200px]">Nama Peserta</th>
                                    {gradebook.quizzes.map((q: any) => (
                                        <th key={q.id} className="py-4 px-6 font-semibold whitespace-nowrap text-center">
                                            <div className="text-xs text-blue-600 mb-1">Kuis</div>
                                            {q.title}
                                        </th>
                                    ))}
                                    {gradebook.assignments.map((a: any) => (
                                        <th key={a.id} className="py-4 px-6 font-semibold whitespace-nowrap text-center">
                                            <div className="text-xs text-green-600 mb-1">Tugas</div>
                                            {a.title}
                                        </th>
                                    ))}
                                    <th className="py-4 px-6 font-semibold text-center bg-gray-100 min-w-[120px]">Rerata Akhir</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {gradebook.participants.map((p: any) => (
                                    <tr key={p.user_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                {p.foto_profile ? (
                                                    <img src={p.foto_profile} alt={p.nama} className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                                        {p.nama?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-900">{p.nama}</div>
                                                    <div className="text-xs text-gray-500">{p.asal_sekolah || 'Asal sekolah tidak diketahui'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* Quiz Scores */}
                                        {p.quizzes.map((q: any) => (
                                            <td key={q.quiz_id} className="py-4 px-6 text-center font-medium">
                                                {q.score !== null ? (
                                                    <span className="text-gray-900">{q.score}</span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        ))}
                                        
                                        {/* Assignment Scores */}
                                        {p.assignments.map((a: any) => (
                                            <td key={a.assignment_id} className="py-4 px-6 text-center font-medium">
                                                {a.score !== null ? (
                                                    <span className="text-gray-900">{a.score}</span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        ))}

                                        {/* Final Average */}
                                        <td className="py-4 px-6 text-center font-bold bg-gray-50/50">
                                            <span className={p.average_score >= 70 ? 'text-green-600' : p.average_score > 0 ? 'text-orange-500' : 'text-gray-400'}>
                                                {p.average_score > 0 ? p.average_score.toFixed(2) : '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
