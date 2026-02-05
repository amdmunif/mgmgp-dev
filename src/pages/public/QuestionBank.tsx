import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils'; // Keep existing cn
import {
    FileText, Download, Search, Filter, CheckSquare, Square, FileSpreadsheet, File as FileIcon
} from 'lucide-react';
import { questionService, Question } from '../../services/questionService';
import { Button } from '../../components/ui/button';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

export function QuestionBankPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filters, setFilters] = useState({
        mapel: '',
        kelas: '',
        level: '',
        search: ''
    });

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
    }, [filters]); // Reload on filter change

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

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Bank Soal MGMP",
                                bold: true,
                                size: 32,
                            }),
                        ],
                        spacing: { after: 400 },
                    }),
                    ...selectedQuestions.flatMap((q, idx) => [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${idx + 1}. `,
                                    bold: true,
                                }),
                                // Since content is HTML, we strip tags roughly for now
                                // Ideally needs HTML-to-Docx parser or simple strip
                                new TextRun({
                                    text: q.content.replace(/<[^>]+>/g, ''),
                                }),
                            ],
                            spacing: { after: 200 },
                        }),
                        ...(q.options || []).map((opt: any, optIdx: number) =>
                            new Paragraph({
                                text: `${String.fromCharCode(65 + optIdx)}. ${opt.text}`,
                                indent: { left: 720 }, // Indent options
                            })
                        ),
                        new Paragraph({ text: "" }) // Spacer
                    ])
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, "soal_mgmp.docx");
        toast.success("Download Word Berhasil");
    };

    const handleDownloadExcel = () => {
        if (selectedIds.size === 0) return toast.error("Pilih soal dulu");
        const selectedQuestions = questions.filter(q => selectedIds.has(q.id));

        const wsData = selectedQuestions.map((q, idx) => ({
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
            Kunci: q.options?.find((o: any) => o.is_correct)?.text || ''
        }));

        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Soal");
        XLSX.writeFile(wb, "soal_mgmp.xlsx");
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
            const cleanText = `${idx + 1}. ${q.content.replace(/<[^>]+>/g, '')}`;
            const splitText = doc.splitTextToSize(cleanText, 180);
            doc.text(splitText, 14, y);
            y += (splitText.length * 5) + 2;

            // Options
            if (q.options) {
                q.options.forEach((opt: any, optIdx: number) => {
                    if (y > 280) { doc.addPage(); y = 20; }
                    doc.text(`${String.fromCharCode(65 + optIdx)}. ${opt.text}`, 20, y);
                    y += 5;
                });
            }
            y += 5;
        });

        doc.save("soal_mgmp.pdf");
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
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : questions.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Tidak ada soal ditemukan.</td></tr>
                        ) : (
                            questions.map(q => (
                                <tr key={q.id} className={cn("hover:bg-gray-50/50 transition-colors", selectedIds.has(q.id) && "bg-blue-50/30")}>
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
        </div>
    );
}
