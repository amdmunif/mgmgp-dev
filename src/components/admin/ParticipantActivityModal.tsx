import React, { useEffect, useState } from 'react';
import { X, Book, FileText, CheckCircle, Clock, Search, Loader2, FileSpreadsheet, Printer } from 'lucide-react';
import { lmsService } from '../../services/lmsService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ParticipantActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    userId: string;
    userName: string;
}

interface ActivityData {
    materials: any[];
    quizzes: any[];
    assignments: any[];
}

export function ParticipantActivityModal({ isOpen, onClose, eventId, userId, userName }: ParticipantActivityModalProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ActivityData>({ materials: [], quizzes: [], assignments: [] });
    const [activeTab, setActiveTab] = useState<'all' | 'materials' | 'quizzes' | 'assignments'>('all');

    useEffect(() => {
        if (isOpen && eventId && userId) {
            loadActivity();
        }
    }, [isOpen, eventId, userId]);

    const loadActivity = async () => {
        setLoading(true);
        try {
            const result = await lmsService.getParticipantActivity(eventId, userId);
            setData(result || { materials: [], quizzes: [], assignments: [] });
        } catch (error) {
            console.error('Failed to load activity', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Combine into a timeline
    let timeline: any[] = [];
    if (activeTab === 'all' || activeTab === 'materials') {
        timeline = timeline.concat(data.materials.map(m => ({
            ...m,
            _type: 'material',
            _date: new Date(m.completed_at),
            _icon: <Book className="w-4 h-4 text-blue-500" />,
            _color: 'bg-blue-50 border-blue-200'
        })));
    }
    if (activeTab === 'all' || activeTab === 'quizzes') {
        timeline = timeline.concat(data.quizzes.map(q => ({
            ...q,
            _type: 'quiz',
            _date: new Date(q.completed_at),
            _icon: <CheckCircle className="w-4 h-4 text-green-500" />,
            _color: 'bg-green-50 border-green-200'
        })));
    }
    if (activeTab === 'all' || activeTab === 'assignments') {
        timeline = timeline.concat(data.assignments.map(a => ({
            ...a,
            _type: 'assignment',
            _date: new Date(a.completed_at),
            _icon: <FileText className="w-4 h-4 text-purple-500" />,
            _color: 'bg-purple-50 border-purple-200'
        })));
    }

    timeline.sort((a, b) => b._date.getTime() - a._date.getTime());

    const getExportData = () => {
        const head = [['Tipe Aktivitas', 'Judul/Nama Materi', 'Waktu Penyelesaian', 'Nilai']];
        const body = timeline.map(item => {
            const typeStr = item._type === 'material' ? 'Materi' : (item._type === 'quiz' ? 'Kuis' : 'Penugasan');
            const scoreStr = (item._type === 'quiz' || item._type === 'assignment') ? (item.score !== null ? item.score : 'Belum Dinilai') : '-';
            return [
                typeStr,
                item.title,
                formatDate(item.completed_at),
                scoreStr
            ];
        });
        return { head, body };
    };

    const handlePrint = () => {
        if (timeline.length === 0) return;
        const { head, body } = getExportData();
        let printContent = `
            <html>
            <head>
                <title>Cetak Aktivitas Peserta</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f3f4f6; }
                    h2 { text-align: center; margin-bottom: 5px; }
                    p { text-align: center; color: #555; margin-top: 0; }
                </style>
            </head>
            <body>
                <h2>Detail Aktivitas LMS</h2>
                <p>Peserta: ${userName}</p>
                <table>
                    <thead>
                        <tr>${head[0].map((h: string) => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${body.map((row: any[]) => `
                            <tr>${row.map((cell: any) => `<td>${cell}</td>`).join('')}</tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    const exportToPDF = () => {
        if (timeline.length === 0) return;
        const { head, body } = getExportData();
        const doc = new jsPDF();
        doc.text(`Detail Aktivitas LMS`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Peserta: ${userName}`, 14, 22);
        autoTable(doc, {
            head: head,
            body: body,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [41, 128, 185] },
        });
        doc.save(`Aktivitas_${userName.replace(/\s+/g, '_')}.pdf`);
    };

    const exportToExcel = () => {
        if (timeline.length === 0) return;
        const { head, body } = getExportData();
        const ws = XLSX.utils.aoa_to_sheet([...head, ...body]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Aktivitas");
        XLSX.writeFile(wb, `Aktivitas_${userName.replace(/\s+/g, '_')}.xlsx`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Detail Aktivitas LMS</h2>
                        <p className="text-sm text-gray-500 mt-1">Peserta: <span className="font-semibold text-gray-700">{userName}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                        {timeline.length > 0 && (
                            <>
                                <button onClick={handlePrint} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors border border-gray-200 shadow-sm" title="Print">
                                    <Printer className="w-4 h-4" />
                                </button>
                                <button onClick={exportToPDF} className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors border border-red-200 shadow-sm" title="Export PDF">
                                    <FileText className="w-4 h-4" />
                                </button>
                                <button onClick={exportToExcel} className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors border border-green-200 shadow-sm" title="Export Excel">
                                    <FileSpreadsheet className="w-4 h-4" />
                                </button>
                                <div className="w-px h-5 bg-gray-200 mx-1"></div>
                            </>
                        )}
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-2 overflow-x-auto">
                    {(['all', 'materials', 'quizzes', 'assignments'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === tab 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {tab === 'all' ? 'Semua Aktivitas' : 
                             tab === 'materials' ? 'Materi Selesai' : 
                             tab === 'quizzes' ? 'Kuis Dikerjakan' : 'Penugasan'}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                            <p className="text-sm">Memuat riwayat aktivitas...</p>
                        </div>
                    ) : timeline.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <Search className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">Belum ada aktivitas tercatat.</p>
                        </div>
                    ) : (
                        <div className="relative border-l border-gray-200 ml-4 space-y-8">
                            {timeline.map((item, idx) => (
                                <div key={idx} className="relative pl-6">
                                    <div className={`absolute -left-3 top-1 w-6 h-6 rounded-full border bg-white flex items-center justify-center shadow-sm ${
                                        item._type === 'material' ? 'border-blue-300' :
                                        item._type === 'quiz' ? 'border-green-300' : 'border-purple-300'
                                    }`}>
                                        {item._icon}
                                    </div>
                                    <div className={`p-4 rounded-xl border shadow-sm ${item._color}`}>
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                                            <h4 className="font-bold text-gray-900">{item.title}</h4>
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-white/60 px-2 py-1 rounded-md border border-gray-100">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatDate(item.completed_at)}
                                            </span>
                                        </div>
                                        {item._type === 'material' && (
                                            <p className="text-sm text-gray-600">Selesai membaca/menonton materi.</p>
                                        )}
                                        {item._type === 'quiz' && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-sm text-gray-600">Nilai:</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    item.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {item.score}
                                                </span>
                                            </div>
                                        )}
                                        {item._type === 'assignment' && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-sm text-gray-600">Nilai:</span>
                                                {item.score !== null ? (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                                                        {item.score}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                                                        Belum dinilai
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
