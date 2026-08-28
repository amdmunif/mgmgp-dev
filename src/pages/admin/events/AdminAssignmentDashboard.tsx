import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckSquare, FileText, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { lmsService } from '../../../services/lmsService';
import { toast } from 'react-hot-toast';

export function AdminAssignmentDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            loadAssignments();
        }
    }, [id]);

    const loadAssignments = async () => {
        try {
            setLoading(true);
            const topics = await lmsService.getTopicsByEvent(id!);
            const allMaterials: any[] = [];
            for (const topic of topics) {
                const materials = await lmsService.getMaterialsByTopic(topic.id);
                allMaterials.push(...materials);
            }
            const assignmentsOnly = allMaterials.filter(m => m.type === 'assignment');
            
            const aggregated = [];
            for (const asg of assignmentsOnly) {
                const subs = await lmsService.getAllAssignmentSubmissions(asg.id);
                aggregated.push({
                    ...asg,
                    totalSubmissions: subs.length,
                    gradedSubmissions: subs.filter((s:any) => s.score !== null).length
                });
            }
            setAssignments(aggregated);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat laporan penugasan");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Memuat laporan penugasan...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <Button variant="ghost" onClick={() => navigate(`/admin/events/${id}/lms`)} className="text-gray-500 p-2 h-auto">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="font-bold text-lg text-gray-800">Laporan Semua Penugasan</h1>
                    <p className="text-sm text-gray-500">Pantau progres pengumpulan tugas dari semua modul</p>
                </div>
            </div>

            {assignments.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-100 rounded-xl">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-900 font-medium mb-1">Tidak Ada Penugasan</h3>
                    <p className="text-gray-500 text-sm">Belum ada materi dengan tipe Penugasan di kelas ini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map(asg => (
                        <div key={asg.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                                        <CheckSquare className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight">{asg.title}</h3>
                                </div>
                                
                                <div className="mt-6 flex justify-between items-center text-sm">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-800">{asg.totalSubmissions}</div>
                                        <div className="text-gray-500 text-xs uppercase tracking-wide">Terkumpul</div>
                                    </div>
                                    <div className="h-10 w-px bg-gray-200"></div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{asg.gradedSubmissions}</div>
                                        <div className="text-gray-500 text-xs uppercase tracking-wide">Dinilai</div>
                                    </div>
                                    <div className="h-10 w-px bg-gray-200"></div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-500">{asg.totalSubmissions - asg.gradedSubmissions}</div>
                                        <div className="text-gray-500 text-xs uppercase tracking-wide">Menunggu</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3">
                                <Button 
                                    onClick={() => navigate(`/admin/events/${id}/lms/assignment/${asg.id}`)}
                                    className="w-full bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                                >
                                    Beri Nilai <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
