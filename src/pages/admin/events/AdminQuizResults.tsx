import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { lmsService } from '../../../services/lmsService';
import { toast } from 'react-hot-toast';

export function AdminQuizResults() {
    const { id, quizId } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (quizId) {
            fetchAttempts();
        }
    }, [quizId]);

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

    const filteredAttempts = attempts.filter(att => 
        att.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (isoString: string) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(`/admin/events/${id}/lms`)} className="text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Hasil Kuis Peserta</h1>
                        <p className="text-gray-500 text-sm">Lihat riwayat percobaan ujian peserta</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text"
                        placeholder="Cari nama peserta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Nama Peserta</th>
                                    <th scope="col" className="px-6 py-4">Status</th>
                                    <th scope="col" className="px-6 py-4">Waktu Selesai</th>
                                    <th scope="col" className="px-6 py-4">Skor</th>
                                    <th scope="col" className="px-6 py-4">Kelulusan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAttempts.length > 0 ? (
                                    filteredAttempts.map((attempt) => (
                                        <tr key={attempt.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {attempt.user_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    attempt.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {attempt.status === 'completed' ? 'Selesai' : 'Sedang Mengerjakan'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {formatDate(attempt.finished_at)}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                {attempt.total_score !== null ? Number(attempt.total_score) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {attempt.total_score !== null ? (
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        attempt.is_passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {attempt.is_passed ? 'LULUS' : 'TIDAK LULUS'}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            {searchTerm ? 'Tidak ada data peserta yang cocok.' : 'Belum ada peserta yang mengerjakan kuis ini.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
