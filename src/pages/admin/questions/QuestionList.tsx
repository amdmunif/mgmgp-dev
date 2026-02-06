import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Search, Filter, CheckCircle, XCircle, FileText, Gamepad2, Upload, Pencil } from 'lucide-react';
import { questionService } from '../../../services/questionService';
import type { Question, QuestionBank } from '../../../services/questionService';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';
import { read, utils } from 'xlsx';

export function AdminQuestions() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'repository' | 'legacy'>('repository');

    // Repository State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [repoLoading, setRepoLoading] = useState(true);
    const [filters, setFilters] = useState({ mapel: '', kelas: '', level: '', search: '' });

    // Import State
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    // Legacy State
    const [banks, setBanks] = useState<QuestionBank[]>([]);
    const [legacyLoading, setLegacyLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadData, setUploadData] = useState({
        title: '', mapel: '', category: 'Latihan', is_premium: true, file: null as File | null
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (activeTab === 'repository') loadRepo();
        else loadLegacy();
    }, [activeTab, filters]);

    const loadRepo = async () => {
        setRepoLoading(true);
        try {
            const data = await questionService.getAll(filters);
            setQuestions(data);
        } catch (error) { console.error(error); }
        finally { setRepoLoading(false); }
    };

    const loadLegacy = async () => {
        setLegacyLoading(true);
        try {
            const data = await questionService.getBanks();
            setBanks(data);
        } catch (error) { console.error(error); }
        finally { setLegacyLoading(false); }
    };

    const handleDeleteRepo = async (id: string) => {
        if (!confirm('Hapus soal ini?')) return;
        try {
            await questionService.delete(id);
            toast.success('Soal dihapus');
            loadRepo();
        } catch (e) { toast.error('Gagal menghapus'); }
    };

    const handleDeleteLegacy = async (id: string) => {
        if (!confirm('Hapus item ini?')) return;
        try {
            await questionService.deleteBank(id);
            toast.success('Item dihapus');
            loadLegacy();
        } catch (e) { toast.error('Gagal menghapus'); }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadData.title || !uploadData.mapel || !uploadData.file) {
            toast.error('Data tidak lengkap');
            return;
        }
        setSubmitting(true);
        try {
            const url = await questionService.uploadFile(uploadData.file);
            await questionService.createBank({
                title: uploadData.title,
                mapel: uploadData.mapel,
                category: uploadData.category as any,
                is_premium: uploadData.is_premium,
                file_url: url
            });
            toast.success('Berhasil diupload');
            setIsUploadModalOpen(false);
            setUploadData({ title: '', mapel: '', category: 'Latihan', is_premium: true, file: null });
            loadLegacy();
        } catch (e) {
            console.error(e);
            toast.error('Gagal upload');
        } finally {
            setSubmitting(false);
        }
    };

    const handleImportExcel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!excelFile) return;

        setImporting(true);
        try {
            const data = await excelFile.arrayBuffer();
            const workbook = read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json: any[] = utils.sheet_to_json(sheet);

            let count = 0;
            for (const row of json) {
                if (!row['Soal'] || !row['Jawaban']) continue;

                const options = [
                    { id: Math.random().toString(36).substring(7), text: row['A'] || '', is_correct: row['Jawaban'] === 'A' },
                    { id: Math.random().toString(36).substring(7), text: row['B'] || '', is_correct: row['Jawaban'] === 'B' },
                    { id: Math.random().toString(36).substring(7), text: row['C'] || '', is_correct: row['Jawaban'] === 'C' },
                    { id: Math.random().toString(36).substring(7), text: row['D'] || '', is_correct: row['Jawaban'] === 'D' },
                ];

                if (row['E']) {
                    options.push({ id: Math.random().toString(36).substring(7), text: row['E'], is_correct: row['Jawaban'] === 'E' });
                }

                const payload: Partial<Question> = {
                    content: row['Soal'],
                    type: 'single_choice',
                    options,
                    answer_key: row['Jawaban'],
                    mapel: row['Mapel'] || 'Informatika',
                    kelas: row['Kelas'] ? String(row['Kelas']) : '7',
                    level: row['Level'] || 'Sedang',
                };

                await questionService.create(payload);
                count++;
            }

            toast.success(`Berhasil mengimport ${count} soal!`);
            setIsExcelModalOpen(false);
            setExcelFile(null);
            loadRepo();
        } catch (error) {
            console.error(error);
            toast.error('Gagal memproses file Excel');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bank Soal</h1>
                    <p className="text-gray-500 text-sm">Kelola repository soal dan arsip file.</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'repository' ? (
                        <>
                            <Button onClick={() => setIsExcelModalOpen(true)} variant="outline" className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100">
                                <FileText className="w-4 h-4 mr-2" /> Import Excel
                            </Button>
                            <Button onClick={() => navigate('/admin/questions/create')}>
                                <Plus className="w-4 h-4 mr-2" /> Buat Soal Baru
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsUploadModalOpen(true)}>
                            <Upload className="w-4 h-4 mr-2" /> Upload File
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('repository')}
                    className={cn(
                        "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'repository' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Repository Soal (Interaktif)
                </button>
                <button
                    onClick={() => setActiveTab('legacy')}
                    className={cn(
                        "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'legacy' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Arsip File & Games
                </button>
            </div>

            {/* REPOSITORY TAB */}
            {activeTab === 'repository' && (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Filter className="w-4 h-4" />
                            <span className="text-sm font-semibold">Filter:</span>
                        </div>
                        <select
                            className="border rounded-lg px-3 py-1.5 text-sm bg-gray-50"
                            value={filters.mapel}
                            onChange={e => setFilters({ ...filters, mapel: e.target.value })}
                        >
                            <option value="">Semua Mapel</option>
                            <option value="Informatika">Informatika</option>
                            <option value="KKA">KKA</option>
                        </select>
                        <select
                            className="border rounded-lg px-3 py-1.5 text-sm bg-gray-50"
                            value={filters.kelas}
                            onChange={e => setFilters({ ...filters, kelas: e.target.value })}
                        >
                            <option value="">Semua Kelas</option>
                            <option value="7">Kelas 7</option>
                            <option value="8">Kelas 8</option>
                            <option value="9">Kelas 9</option>
                        </select>
                        <div className="flex-1 min-w-[200px] relative">
                            <Search className="w-4 h-4 absolute left-3 top-2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari konten soal..."
                                className="w-full pl-9 pr-4 py-1.5 border rounded-lg text-sm"
                                value={filters.search}
                                onChange={e => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Soal</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 w-32">Mapel</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 w-24">Kelas</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 w-24">Level</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 w-24">Status</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 w-24 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {repoLoading ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
                                ) : questions.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Tidak ada soal.</td></tr>
                                ) : (
                                    questions.map(q => (
                                        <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="line-clamp-2 text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: q.content }} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{q.mapel}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-800">{q.kelas}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                                                    q.level === 'Mudah' ? "bg-green-100 text-green-800" :
                                                        q.level === 'Sedang' ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                                                )}>{q.level}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {q.status === 'verified' ?
                                                    <span className="text-green-600 flex items-center gap-1 text-xs font-medium"><CheckCircle className="w-3 h-3" /> Verified</span> :
                                                    <span className="text-orange-600 flex items-center gap-1 text-xs font-medium"><XCircle className="w-3 h-3" /> Pending</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={() => navigate(`/admin/questions/edit/${q.id}`)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteRepo(q.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* LEGACY TAB */}
            {activeTab === 'legacy' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Judul</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Kategori</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Mapel</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 w-32">Premium</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 w-24 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {legacyLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
                            ) : banks.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Belum ada file/games.</td></tr>
                            ) : (
                                banks.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.title}</td>
                                        <td className="px-6 py-4 flex items-center gap-2 text-sm text-gray-600">
                                            {item.category === 'TTS' || item.category === 'Wordsearch' ?
                                                <Gamepad2 className="w-4 h-4 text-purple-500" /> :
                                                <FileText className="w-4 h-4 text-blue-500" />
                                            }
                                            {item.category}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{item.mapel}</td>
                                        <td className="px-6 py-4">
                                            {item.is_premium ?
                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Premium</span> :
                                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Free</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDeleteLegacy(item.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Upload File baru</h2>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                                <input required className="w-full px-3 py-2 border rounded-lg" value={uploadData.title} onChange={e => setUploadData({ ...uploadData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mapel</label>
                                <input required className="w-full px-3 py-2 border rounded-lg" value={uploadData.mapel} onChange={e => setUploadData({ ...uploadData, mapel: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <select className="w-full px-3 py-2 border rounded-lg" value={uploadData.category} onChange={e => setUploadData({ ...uploadData, category: e.target.value as any })}>
                                    <option value="Latihan">Latihan</option>
                                    <option value="Ujian">Ujian</option>
                                    <option value="TTS">TTS</option>
                                    <option value="Wordsearch">Wordsearch</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                                <input type="file" required onChange={e => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })} className="w-full" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={uploadData.is_premium} onChange={e => setUploadData({ ...uploadData, is_premium: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                                <label className="text-sm">Premium?</label>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={submitting}>{submitting ? 'Mengupload...' : 'Upload'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Excel Import Modal */}
            {isExcelModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-green-700">Import Soal dari Excel</h2>
                            <button onClick={() => setIsExcelModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg mb-4 text-sm text-yellow-800 border border-yellow-200">
                            Pastikan format kolom: <b>Soal, A, B, C, D, E, Jawaban, Mapel, Kelas, Level</b>.
                            <br />Jawaban diisi huruf kapital (A/B/C/D/E).
                        </div>

                        <form onSubmit={handleImportExcel} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">File Excel (.xlsx)</label>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    required
                                    onChange={e => setExcelFile(e.target.files?.[0] || null)}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsExcelModalOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={importing} className="bg-green-600 hover:bg-green-700 text-white">
                                    {importing ? 'Mengimport...' : 'Mulai Import'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
