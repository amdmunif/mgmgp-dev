import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import {
    FileText, Search, Filter, CheckSquare, Square, FileSpreadsheet, File as FileIcon, Eye, CheckCircle
} from 'lucide-react';
import { questionService, type Question } from '../../services/questionService';
import { authService } from '../../services/authService';
import { getFileUrl } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

export function QuestionBankPage() {
    const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ mapel: '', kelas: '', level: '', search: '' });
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        authService.getCurrentUser().then(data => {
            setUser(data?.user || null);
        });
        loadData();
    }, [filters]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await questionService.getAll(filters);
            setQuestions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getFilename = (ext: string) => {
        const name = user?.nama ? user.nama.replace(/\s+/g, '_') : 'Guest';
        const date = format(new Date(), 'dd-MM-yyyy');
        return `${name}_${date}_banksoal_mgmp_if.${ext}`;
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === questions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(questions.map(q => q.id)));
        }
    };

    // --- DOWNLOAD HANDLERS ---

    const handleDownloadWord = async () => {
        if (selectedIds.size === 0) return toast.error("Pilih soal dulu");

        const selectedQuestions = questions.filter(q => selectedIds.has(q.id));

        const fetchImage = async (url: string): Promise<ArrayBuffer | null> => {
            try {
                const res = await fetch(url);
                return await res.arrayBuffer();
            } catch (e) {
                return null;
            }
        };

        const docChildren: any[] = [
            new Paragraph({
                children: [
                    new TextRun({ text: "Bank Soal MGMP", bold: true, size: 32 }),
                ],
                spacing: { after: 400 },
            })
        ];

        for (const [idx, q] of selectedQuestions.entries()) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = q.content;

            const textContent = tempDiv.textContent || "";
            docChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: `${idx + 1}. `, bold: true }),
                    new TextRun({ text: textContent.trim() })
                ],
                spacing: { after: 100 }
            }));

            const images = tempDiv.getElementsByTagName('img');
            for (let i = 0; i < images.length; i++) {
                const src = images[i].src;
                const buffer = await fetchImage(src);
                if (buffer) {
                    docChildren.push(new Paragraph({
                        children: [
                            new ImageRun({
                                data: buffer,
                                transformation: { width: 300, height: 200 },
                                type: "png"
                            })
                        ],
                        spacing: { after: 100 }
                    }));
                }
            }

            if (q.type !== 'essay' && q.type !== 'short_answer' && q.options) {
                q.options.forEach((opt: any, optIdx: number) => {
                    docChildren.push(new Paragraph({
                        children: [new TextRun({ text: `${String.fromCharCode(65 + optIdx)}. ${opt.text}` })],
                        indent: { left: 720 },
                    }));
                });
            }

            docChildren.push(new Paragraph({ text: "" }));
        }

        docChildren.push(
            new Paragraph({
                children: [new TextRun({ text: "Kunci Jawaban", bold: true, size: 28 })],
                pageBreakBefore: true,
                spacing: { after: 300 }
            })
        );

        selectedQuestions.forEach((q, idx) => {
            let answer = "Lihat Kebijakan Guru";
            if (q.type === 'essay' || q.type === 'short_answer') {
                answer = q.answer_key || '-';
            } else {
                const correctIdx = q.options?.findIndex((o: any) => o.is_correct);
                if (correctIdx !== -1 && correctIdx !== undefined) {
                    answer = String.fromCharCode(65 + correctIdx);
                } else {
                    answer = '-';
                }
            }
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: `${idx + 1}. ${answer}`, bold: true })]
            }));
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: docChildren,
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, getFilename('docx'));
        toast.success("Download Word Berhasil");
    };

    const handleDownloadExcel = () => {
        if (selectedIds.size === 0) return toast.error("Pilih soal dulu");
        const selectedQuestions = questions.filter(q => selectedIds.has(q.id));

        const wsData = selectedQuestions.map((q, idx) => {
            let key = '';
            if (q.type === 'essay' || q.type === 'short_answer') {
                key = q.answer_key || '';
            } else {
                key = q.options?.find((o: any) => o.is_correct)?.text || '';
            }

            return {
                No: idx + 1,
                Mapel: q.mapel,
                Kelas: q.kelas,
                Level: q.level,
                Soal: q.content.replace(/<[^>]+>/g, ''),
                Tipe: q.type,
                Opsi_A: q.options?.[0]?.text || '',
                Opsi_B: q.options?.[1]?.text || '',
                Opsi_C: q.options?.[2]?.text || '',
                Opsi_D: q.options?.[3]?.text || '',
                Opsi_E: q.options?.[4]?.text || '',
                Kunci: key
            };
        });

        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Soal");
        XLSX.writeFile(wb, getFilename('xlsx'));
        toast.success("Download Excel Berhasil");
    };

    const handleDownloadPDF = () => {
        if (selectedIds.size === 0) return toast.error("Pilih soal dulu");
        const selectedQuestions = questions.filter(q => selectedIds.has(q.id));

        const doc = new jsPDF();

        // Title
        doc.setFontSize(16);
        doc.text("Bank Soal MGMP", 14, 20);
        doc.setFontSize(11);

        let y = 30;

        selectedQuestions.forEach((q, idx) => {
            if (y > 270) { doc.addPage(); y = 20; }

            // Question Text
            doc.setFont("helvetica", "bold");
            doc.text(`${idx + 1}.`, 14, y);
            doc.setFont("helvetica", "normal");

            const cleanText = q.content.replace(/<[^>]+>/g, '').trim();
            const splitText = doc.splitTextToSize(cleanText, 170);
            doc.text(splitText, 22, y);
            y += (splitText.length * 5) + 4;

            // Options
            if (q.type !== 'essay' && q.type !== 'short_answer' && q.options) {
                q.options.forEach((opt: any, optIdx: number) => {
                    if (y > 280) { doc.addPage(); y = 20; }
                    doc.text(`${String.fromCharCode(65 + optIdx)}. ${opt.text}`, 25, y);
                    y += 5;
                });
            }
            y += 5;
        });

        // Answer Key Page
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Kunci Jawaban", 14, 20);
        doc.setFontSize(11);
        y = 30;

        selectedQuestions.forEach((q, idx) => {
            if (y > 280) { doc.addPage(); y = 20; }
            let answer = "";
            if (q.type === 'essay' || q.type === 'short_answer') {
                answer = q.answer_key || '-';
            } else {
                const correctIdx = q.options?.findIndex((o: any) => o.is_correct);
                answer = correctIdx !== -1 && correctIdx !== undefined ? String.fromCharCode(65 + correctIdx) : '-';
            }
            doc.text(`${idx + 1}. ${answer}`, 14, y);
            y += 6;
        });

        doc.save(getFilename('pdf'));
        toast.success("Download PDF Berhasil");
    };


    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Repository Soal</h1>
                    <p className="text-gray-500 mt-2">Cari, filter, dan download soal sesuai kebutuhan Anda.</p>
                </div>

                {/* Download Actions */}
                {selectedIds.size > 0 && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                        <Button variant="outline" size="sm" onClick={handleDownloadWord} className="bg-blue-50 text-blue-700 border-blue-200">
                            <FileIcon className="w-4 h-4 mr-2" /> Word
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadExcel} className="bg-green-50 text-green-700 border-green-200">
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="bg-red-50 text-red-700 border-red-200">
                            <FileText className="w-4 h-4 mr-2" /> PDF
                        </Button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center">
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

                <select
                    className="border rounded-lg px-3 py-1.5 text-sm bg-gray-50"
                    value={filters.level}
                    onChange={e => setFilters({ ...filters, level: e.target.value })}
                >
                    <option value="">Semua Level</option>
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Sukar">Sukar</option>
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

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 w-12">
                                <span className="sr-only">Detail</span>
                            </th>
                            <th className="px-6 py-4 w-12">
                                <button onClick={toggleSelectAll}>
                                    {selectedIds.size === questions.length && questions.length > 0 ? (
                                        <CheckSquare className="w-5 h-5 text-primary-600" />
                                    ) : (
                                        <Square className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Soal</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 w-32">Mapel</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 w-24">Kelas</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 w-24">Level</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 w-24">Tipe</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : questions.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">Tidak ada soal ditemukan.</td></tr>
                        ) : (
                            questions.map(q => (
                                <tr key={q.id} className={cn("hover:bg-gray-50/50 transition-colors", selectedIds.has(q.id) && "bg-blue-50/30")}>
                                    <td className="px-6 py-4">
                                        <button onClick={() => setViewingQuestion(q)} className="text-gray-400 hover:text-blue-600 transition-colors">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => toggleSelect(q.id)}>
                                            {selectedIds.has(q.id) ? (
                                                <CheckSquare className="w-5 h-5 text-primary-600" />
                                            ) : (
                                                <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="line-clamp-2 text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: q.content }} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{q.mapel}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-800">
                                            {q.kelas}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                                            q.level === 'Mudah' ? "bg-green-100 text-green-800" :
                                                q.level === 'Sedang' ? "bg-yellow-100 text-yellow-800" :
                                                    "bg-red-100 text-red-800"
                                        )}>
                                            {q.level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                                        {q.type.replace('_', ' ')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <p className="mt-4 text-xs text-center text-gray-400">
                Menampilkan {questions.length} soal. Pilih soal untuk mendownload dalam format Word, Excel, atau PDF.
            </p>

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
                                </div>
                            </div>
                            <button onClick={() => setViewingQuestion(null)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div
                            className="prose prose-sm max-w-none mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100 question-content"
                            dangerouslySetInnerHTML={{
                                __html: viewingQuestion.content.replace(/src="uploads\//g, `src="${getFileUrl('/uploads/')}`)
                            }}
                        />

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

                        <div className="mt-6 flex justify-end">
                            <Button onClick={() => setViewingQuestion(null)}>Tutup</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
