import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, Search, ExternalLink, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';

// Mock Data
const MOCK_SUBMISSIONS = [
    {
        id: 'sub1',
        user_name: 'Ahmad Munif',
        submitted_at: '2026-08-25T14:30:00Z',
        status: 'pending', // pending | graded
        link_url: 'https://docs.google.com/document/d/mock123',
        notes: 'Mohon koreksinya pak',
        score: null,
        feedback: null
    },
    {
        id: 'sub2',
        user_name: 'Budi Santoso',
        submitted_at: '2026-08-26T09:15:00Z',
        status: 'graded',
        link_url: 'https://drive.google.com/file/d/mock456',
        notes: '',
        score: 85,
        feedback: 'Prompt sudah cukup baik, namun perlu ditambahkan batasan karakter.'
    },
    {
        id: 'sub3',
        user_name: 'Citra Kirana',
        submitted_at: '2026-08-26T16:45:00Z',
        status: 'pending',
        link_url: 'https://docs.google.com/document/d/mock789',
        notes: 'Ini tugas saya.',
        score: null,
        feedback: null
    }
];

export function AdminAssignmentGrader() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all | pending | graded
    
    // State for modal grading
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [scoreInput, setScoreInput] = useState('');
    const [feedbackInput, setFeedbackInput] = useState('');

    const filteredSubmissions = MOCK_SUBMISSIONS.filter(sub => {
        const matchesSearch = sub.user_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || sub.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const handleOpenGradeModal = (sub: any) => {
        setSelectedSub(sub);
        setScoreInput(sub.score ? String(sub.score) : '');
        setFeedbackInput(sub.feedback || '');
    };

    const handleSaveGrade = () => {
        toast.success(`Nilai untuk ${selectedSub.user_name} berhasil disimpan!`);
        setSelectedSub(null);
    };

    const formatDate = (isoString: string) => {
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
                        <h1 className="text-2xl font-bold text-gray-900">Penilaian Tugas</h1>
                        <p className="text-gray-500 text-sm">Tugas 1: Praktik Membuat Prompt</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text"
                        placeholder="Cari nama peserta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                    <option value="all">Semua Status</option>
                    <option value="pending">Menunggu Dinilai</option>
                    <option value="graded">Sudah Dinilai</option>
                </select>
            </div>

            {/* Submissions List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-medium">Nama Peserta</th>
                            <th className="px-6 py-4 font-medium">Waktu Pengumpulan</th>
                            <th className="px-6 py-4 font-medium">File / Link</th>
                            <th className="px-6 py-4 font-medium text-center">Status</th>
                            <th className="px-6 py-4 font-medium text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredSubmissions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    Tidak ada data yang cocok dengan pencarian Anda.
                                </td>
                            </tr>
                        ) : filteredSubmissions.map(sub => (
                            <tr key={sub.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 font-medium text-gray-900">{sub.user_name}</td>
                                <td className="px-6 py-4 text-gray-500">{formatDate(sub.submitted_at)}</td>
                                <td className="px-6 py-4">
                                    <a 
                                        href={sub.link_url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        <FileText className="w-4 h-4" /> Buka Link
                                    </a>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {sub.status === 'graded' ? (
                                        <div className="inline-flex flex-col items-center">
                                            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Dinilai
                                            </span>
                                            <span className="text-lg font-bold text-gray-900 mt-1">{sub.score}</span>
                                        </div>
                                    ) : (
                                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                            Menunggu
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <Button 
                                        onClick={() => handleOpenGradeModal(sub)}
                                        size="sm" 
                                        variant={sub.status === 'graded' ? "outline" : "default"}
                                        className={cn(sub.status === 'pending' && "bg-blue-600 hover:bg-blue-700")}
                                    >
                                        {sub.status === 'graded' ? 'Edit Nilai' : 'Beri Nilai'}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
                                    <a href={selectedSub.link_url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 bg-white px-2 py-1 rounded text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors">
                                        Buka <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                {selectedSub.notes && (
                                    <div className="text-sm text-blue-800 italic border-t border-blue-200/50 pt-2 mt-2">
                                        "{selectedSub.notes}"
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
                            <Button variant="outline" onClick={() => setSelectedSub(null)}>
                                Batal
                            </Button>
                            <Button onClick={handleSaveGrade} className="bg-blue-600 hover:bg-blue-700">
                                Simpan Nilai
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
