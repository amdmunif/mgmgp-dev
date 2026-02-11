import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Filter, CheckCircle, XCircle, FileText, Gamepad2, Upload, Pencil, Eye, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { questionService, type Question, type QuestionBank } from '../../../services/questionService';
import { curriculumService } from '../../../services/curriculumService';
import { cn } from '../../../lib/utils';
import * as XLSX from 'xlsx';
import { DataTable } from '../../../components/ui/DataTable';

export function AdminQuestions() {
    const navigate = useNavigate();
    const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
    const [activeTab, setActiveTab] = useState<'repository' | 'verification' | 'legacy'>('repository');

    // Repository State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [repoLoading, setRepoLoading] = useState(true);
    const [filters, setFilters] = useState({ mapel: '', kelas: '', level: '', search: '', tp: '' });
    const [tpList, setTpList] = useState<any[]>([]);

    // Filter TP List
    useEffect(() => {
        if (filters.mapel && filters.kelas) {
            curriculumService.getTPs({ mapel: filters.mapel, kelas: filters.kelas }).then(tps => {
                setTpList(tps);
            });
        } else {
            setTpList([]);
        }
    }, [filters.mapel, filters.kelas]);

    // ...

    const handleImportExcel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!excelFile) return;

        setImporting(true);
        try {
            // 1. Fetch available TPs for lookup from NEW table
            const allTPs = await curriculumService.getTPs({});
            const tpMap = new Map(allTPs.map((t: any) => [t.code, t])); // Map Code -> TP Object

            const data = await excelFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json: any[] = XLSX.utils.sheet_to_json(sheet);

            let count = 0;
            for (const row of json) {
                if (!row['Soal'] || !row['Jawaban']) continue;

                const typeMap: Record<string, string> = {
                    'PG': 'single_choice',
                    'PGK': 'multiple_choice',
                    'BS': 'true_false',
                    'IS': 'short_answer',
                    'ES': 'essay'
                };

                const type = typeMap[row['Tipe Soal']] || 'single_choice';
                const tpCode = row['Kode TP'];
                const matchedTP = tpCode ? tpMap.get(String(tpCode)) : null;

                let options: any[] = [];
                let answerKey = String(row['Jawaban']);

                if (type === 'single_choice') {
                    options = [
                        { id: Math.random().toString(36).substring(7), text: String(row['A'] || ''), is_correct: answerKey === 'A' },
                        { id: Math.random().toString(36).substring(7), text: String(row['B'] || ''), is_correct: answerKey === 'B' },
                        { id: Math.random().toString(36).substring(7), text: String(row['C'] || ''), is_correct: answerKey === 'C' },
                        { id: Math.random().toString(36).substring(7), text: String(row['D'] || ''), is_correct: answerKey === 'D' },
                    ];
                    if (row['E']) {
                        options.push({ id: Math.random().toString(36).substring(7), text: String(row['E']), is_correct: answerKey === 'E' });
                    }
                } else if (type === 'multiple_choice') {
                    const keys = answerKey.split(',').map(k => k.trim());
                    options = [
                        { id: Math.random().toString(36).substring(7), text: String(row['A'] || ''), is_correct: keys.includes('A') },
                        { id: Math.random().toString(36).substring(7), text: String(row['B'] || ''), is_correct: keys.includes('B') },
                        { id: Math.random().toString(36).substring(7), text: String(row['C'] || ''), is_correct: keys.includes('C') },
                        { id: Math.random().toString(36).substring(7), text: String(row['D'] || ''), is_correct: keys.includes('D') },
                    ];
                    if (row['E']) {
                        options.push({ id: Math.random().toString(36).substring(7), text: String(row['E']), is_correct: keys.includes('E') });
                    }
                } else if (type === 'true_false') {
                    const isTrue = answerKey.toLowerCase() === 'benar';
                    options = [
                        { id: Math.random().toString(36).substring(7), text: 'Benar', is_correct: isTrue },
                        { id: Math.random().toString(36).substring(7), text: 'Salah', is_correct: !isTrue }
                    ];
                }
                // For 'short_answer' and 'essay', options are empty, answerKey is the text itself.

                const payload: Partial<Question> = {
                    content: row['Soal'],
                    type: type as any,
                    options,
                    answer_key: answerKey,
                    mapel: row['Mapel'] || 'Informatika',
                    kelas: row['Kelas'] ? String(row['Kelas']) : '7',
                    level: row['Level'] || 'Sedang',
                    status: 'verified', // Auto verified
                    tp_id: matchedTP ? matchedTP.id : undefined,
                    tp_code: matchedTP ? matchedTP.code : undefined
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

    // Columns Definition
    const repoColumns = [
        {
            header: 'Soal',
            accessorKey: 'content' as keyof Question,
            className: 'w-[400px]',
            cell: (q: Question) => (
                <div className="max-w-[400px]">
                    <div className="line-clamp-2 text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: q.content }} />
                    {q.creator_name && <div className="text-xs text-gray-500 mt-1">Oleh: {q.creator_name}</div>}
                </div>
            )
        },
        { header: 'Mapel', accessorKey: 'mapel' as keyof Question, className: 'w-32' },
        {
            header: 'Kelas',
            accessorKey: 'kelas' as keyof Question,
            className: 'w-24 text-center',
            cell: (q: Question) => <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-800">{q.kelas}</span>
        },
        {
            header: 'Level',
            accessorKey: 'level' as keyof Question,
            className: 'w-24',
            cell: (q: Question) => (
                <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                    q.level === 'Mudah' ? "bg-green-100 text-green-800" :
                        q.level === 'Sedang' ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                )}>{q.level}</span>
            )
        },
        {
            header: 'Status',
            accessorKey: 'status' as keyof Question,
            className: 'w-24',
            cell: (q: Question) => (
                q.status === 'verified' ?
                    <span className="text-green-600 flex items-center gap-1 text-xs font-medium"><CheckCircle className="w-3 h-3" /> Verified</span> :
                    q.status === 'rejected' ?
                        <span className="text-red-600 flex items-center gap-1 text-xs font-medium"><XCircle className="w-3 h-3" /> Rejected</span> :
                        <span className="text-orange-600 flex items-center gap-1 text-xs font-medium"><Clock className="w-3 h-3" /> Pending</span>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right w-32',
            cell: (q: Question) => (
                <div className="flex justify-end gap-2">
                    <button onClick={() => setViewingQuestion(q)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Lihat">
                        <Eye className="w-4 h-4" />
                    </button>
                    {activeTab === 'verification' ? (
                        <>
                            <button onClick={() => handleVerify(q.id, true)} className="p-2 text-gray-400 hover:text-green-600 transition-colors" title="Setujui">
                                <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleVerify(q.id, false)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Tolak">
                                <XCircle className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => navigate(`/admin/questions/edit/${q.id}`)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteRepo(q.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Hapus">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    const legacyColumns = [
        { header: 'Judul', accessorKey: 'title' as keyof QuestionBank, className: 'font-medium text-gray-900' },
        {
            header: 'Kategori',
            accessorKey: 'category' as keyof QuestionBank,
            cell: (item: QuestionBank) => (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    {item.category === 'TTS' || item.category === 'Wordsearch' ?
                        <Gamepad2 className="w-4 h-4 text-purple-500" /> :
                        <FileText className="w-4 h-4 text-blue-500" />
                    }
                    {item.category}
                </div>
            )
        },
        { header: 'Mapel', accessorKey: 'mapel' as keyof QuestionBank, className: 'text-sm text-gray-600' },
        {
            header: 'Premium',
            accessorKey: 'is_premium' as keyof QuestionBank,
            className: 'w-32',
            cell: (item: QuestionBank) => (
                item.is_premium ?
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Premium</span> :
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Free</span>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right w-32',
            cell: (item: QuestionBank) => (
                <div className="flex justify-end gap-2">
                    <a href={item.file_url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Lihat/Download">
                        <Eye className="w-4 h-4" />
                    </a>
                    <button onClick={() => toast('Fitur Edit File Legacy akan segera hadir')} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteLegacy(item.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

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
                    ) : activeTab === 'legacy' ? (
                        <Button onClick={() => setIsUploadModalOpen(true)}>
                            <Upload className="w-4 h-4 mr-2" /> Upload File
                        </Button>
                    ) : null}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('repository')}
                    className={cn(
                        "px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                        activeTab === 'repository' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Bank Soal (Terverifikasi)
                </button>
                <button
                    onClick={() => setActiveTab('verification')}
                    className={cn(
                        "px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                        activeTab === 'verification' ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Verifikasi Masuk
                </button>
                <button
                    onClick={() => setActiveTab('legacy')}
                    className={cn(
                        "px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                        activeTab === 'legacy' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Arsip File & Games
                </button>
            </div>

            {/* REPOSITORY & VERIFICATION TAB */}
            {(activeTab === 'repository' || activeTab === 'verification') && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
                        {repoLoading ? (
                            <div className="text-center p-8 text-gray-500">Loading...</div>
                        ) : (
                            <DataTable
                                data={questions}
                                columns={repoColumns}
                                searchKeys={['content', 'mapel', 'creator_name']}
                                pageSize={10}
                                filterContent={
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-gray-500" />
                                        <select
                                            className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={filters.mapel}
                                            onChange={e => setFilters({ ...filters, mapel: e.target.value, tp: '' })}
                                        >
                                            <option value="">Semua Mapel</option>
                                            <option value="Informatika">Informatika</option>
                                            <option value="KKA">KKA</option>
                                        </select>
                                        <select
                                            className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={filters.kelas}
                                            onChange={e => setFilters({ ...filters, kelas: e.target.value, tp: '' })}
                                        >
                                            <option value="">Semua Kelas</option>
                                            <option value="7">Kelas 7</option>
                                            <option value="8">Kelas 8</option>
                                            <option value="9">Kelas 9</option>
                                        </select>
                                        <select
                                            className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[200px]"
                                            value={filters.tp}
                                            onChange={e => setFilters({ ...filters, tp: e.target.value })}
                                            disabled={!filters.mapel || !filters.kelas}
                                            title={(!filters.mapel || !filters.kelas) ? "Pilih Mapel & Kelas dulu" : "Pilih TP"}
                                        >
                                            <option value="">Semua TP</option>
                                            {tpList.map(tp => (
                                                <option key={tp.id} value={tp.code || tp.id}>
                                                    {tp.code ? `[${tp.code}] ` : ''}{tp.title.length > 20 ? tp.title.substring(0, 20) + '...' : tp.title}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={filters.level}
                                            onChange={e => setFilters({ ...filters, level: e.target.value })}
                                        >
                                            <option value="">Semua Level</option>
                                            <option value="Mudah">Mudah</option>
                                            <option value="Sedang">Sedang</option>
                                            <option value="Sukar">Sukar</option>
                                        </select>
                                    </div>
                                }
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {viewingQuestion && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Detail Soal</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{viewingQuestion.mapel}</span>
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{viewingQuestion.kelas}</span>
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{viewingQuestion.level}</span>
                                    {viewingQuestion.tp_code && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">TP: {viewingQuestion.tp_code}</span>}
                                </div>
                            </div>
                            <button onClick={() => setViewingQuestion(null)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="prose prose-sm max-w-none mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100" dangerouslySetInnerHTML={{ __html: viewingQuestion.content }} />

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-gray-700">Pilihan Jawaban:</h4>
                            {viewingQuestion.options?.map((opt: any, idx: number) => (
                                <div key={idx} className={cn("p-3 rounded-lg border flex items-center gap-3", opt.is_correct ? "bg-green-50 border-green-200" : "bg-white border-gray-200")}>
                                    <span className={cn("w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0", opt.is_correct ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className={cn("text-sm", opt.is_correct && "font-medium text-green-800")}>{opt.text}</span>
                                    {opt.is_correct && <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
                                </div>
                            ))}
                        </div>

                        {(viewingQuestion.type === 'essay' || viewingQuestion.type === 'short_answer') && (
                            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                                <strong>Kunci Jawaban:</strong> <br />
                                {viewingQuestion.answer_key}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <Button onClick={() => setViewingQuestion(null)}>Tutup</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* LEGACY TAB */}
            {activeTab === 'legacy' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6 animate-in fade-in slide-in-from-top-2">
                    {legacyLoading ? (
                        <div className="text-center p-8 text-gray-500">Loading...</div>
                    ) : (
                        <DataTable
                            data={banks}
                            columns={legacyColumns}
                            searchKeys={['title', 'mapel', 'category']}
                            pageSize={10}
                        />
                    )}
                </div>
            )}

            {/* Upload Modal - same as before */}
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

            {/* Excel Import Modal - same as before */}
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

                            <div className="flex flex-col gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={downloadTemplate}
                                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                    <Upload className="w-4 h-4 mr-2 rotate-180" /> Unduh Template Excel
                                </Button>
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
