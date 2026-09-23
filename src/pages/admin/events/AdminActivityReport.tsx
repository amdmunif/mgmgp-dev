import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Loader2, Book, FileText, CheckCircle, FileSpreadsheet, Printer, Activity } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { lmsService } from '../../../services/lmsService';
import { toast } from 'react-hot-toast';
import { DataTable } from '../../../components/ui/DataTable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function AdminActivityReport() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setPageHeader } = useOutletContext<any>() || {};
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<any[]>([]);
    
    const [viewMode, setViewMode] = useState<'summary' | 'matrix'>('summary');
    const [matrixData, setMatrixData] = useState<any>(null);
    const [loadingMatrix, setLoadingMatrix] = useState(false);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Laporan Aktivitas LMS',
                description: 'Daftar semua aktivitas LMS yang dilakukan oleh seluruh peserta',
                icon: <Activity className="w-6 h-6" />
            });
        }
        if (id && viewMode === 'summary') {
            loadActivities();
        } else if (id && viewMode === 'matrix') {
            loadMatrix();
        }
    }, [id, setPageHeader, viewMode]);

    const loadActivities = async () => {
        if (activities.length > 0) return;
        try {
            setLoading(true);
            const data = await lmsService.getAllParticipantsActivity(id!);
            setActivities(data);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Gagal memuat aktivitas peserta");
        } finally {
            setLoading(false);
        }
    };

    const loadMatrix = async () => {
        if (matrixData) return;
        try {
            setLoadingMatrix(true);
            const data = await lmsService.getEventActivityMatrix(id!);
            setMatrixData(data);
        } catch (error: any) {
            console.error(error);
            toast.error("Gagal memuat detail matrix");
        } finally {
            setLoadingMatrix(false);
        }
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    const getExportData = () => {
        const head = [['Nama Peserta', 'Asal Sekolah', 'Tipe Aktivitas', 'Judul/Nama Materi', 'Waktu Penyelesaian', 'Nilai']];
        const body = activities.map(item => {
            const typeStr = item._type === 'material' ? 'Materi' : (item._type === 'quiz' ? 'Kuis' : 'Penugasan');
            const scoreStr = (item._type === 'quiz' || item._type === 'assignment') ? (item.score !== null ? item.score : 'Belum Dinilai') : '-';
            return [
                item.user_name || '-',
                item.asal_sekolah || '-',
                typeStr,
                item.title,
                formatDate(item.completed_at),
                scoreStr
            ];
        });
        return { head, body };
    };

    const exportToExcel = () => {
        if (activities.length === 0) return toast.error("Tidak ada data untuk diekspor");
        const { head, body } = getExportData();
        const ws = XLSX.utils.aoa_to_sheet([...head, ...body]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Aktivitas");
        XLSX.writeFile(wb, `Laporan_Aktivitas_${id}.xlsx`);
    };

    const exportToPDF = () => {
        if (activities.length === 0) return toast.error("Tidak ada data untuk diekspor");
        const { head, body } = getExportData();
        const doc = new jsPDF('landscape');
        doc.text(`Laporan Aktivitas LMS`, 14, 15);
        autoTable(doc, {
            head: head,
            body: body,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
        });
        doc.save(`Laporan_Aktivitas_${id}.pdf`);
    };

    const handlePrint = () => {
        if (activities.length === 0) return toast.error("Tidak ada data untuk dicetak");
        const { head, body } = getExportData();
        let printContent = `
            <html>
            <head>
                <title>Cetak Laporan Aktivitas</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f3f4f6; }
                    h2 { text-align: center; }
                </style>
            </head>
            <body>
                <h2>Laporan Aktivitas LMS</h2>
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

    const buildColumns = () => {
        return [
            {
                header: 'Nama Peserta',
                accessorKey: 'user_name',
                cell: (p: any) => (
                    <div>
                        <div className="font-medium text-gray-900">{p.user_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.asal_sekolah || '-'}</div>
                    </div>
                )
            },
            {
                header: 'Tipe',
                accessorKey: '_type',
                cell: (p: any) => {
                    const isMaterial = p._type === 'material';
                    const isQuiz = p._type === 'quiz';
                    
                    return (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                            isMaterial ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            isQuiz ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                            {isMaterial ? <Book className="w-3.5 h-3.5" /> :
                             isQuiz ? <CheckCircle className="w-3.5 h-3.5" /> :
                             <FileText className="w-3.5 h-3.5" />}
                            {isMaterial ? 'Materi' : isQuiz ? 'Kuis' : 'Penugasan'}
                        </div>
                    );
                },
                className: 'whitespace-nowrap'
            },
            {
                header: 'Judul Aktivitas',
                accessorKey: 'title',
                cell: (p: any) => <div className="text-gray-900 font-medium">{p.title}</div>
            },
            {
                header: 'Waktu Penyelesaian',
                accessorKey: 'completed_at',
                cell: (p: any) => <div className="text-sm text-gray-600">{formatDate(p.completed_at)}</div>
            },
            {
                header: 'Nilai',
                accessorKey: 'score',
                cell: (p: any) => (
                    <div className="text-center font-bold">
                        {p._type === 'material' ? (
                            <span className="text-gray-400">-</span>
                        ) : p.score !== null ? (
                            <span className={p.score >= 70 ? 'text-green-600' : p.score > 0 ? 'text-orange-500' : 'text-gray-400'}>
                                {p.score}
                            </span>
                        ) : (
                            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Menunggu</span>
                        )}
                    </div>
                ),
                className: 'text-center whitespace-nowrap'
            }
        ];
    };

    const buildMatrixColumns = () => {
        if (!matrixData || !matrixData.columns) return [];
        
        const cols: any[] = [
            {
                header: 'Nama Peserta',
                accessorKey: 'user_name',
                cell: (p: any) => (
                    <div className="min-w-[150px]">
                        <div className="font-medium text-gray-900 truncate">{p.user_name}</div>
                        {p.asal_sekolah && <div className="text-xs text-gray-500 truncate">{p.asal_sekolah}</div>}
                    </div>
                )
            }
        ];

        // Group columns by topic visually by just rendering them sequentially
        matrixData.columns.forEach((col: any) => {
            cols.push({
                header: (
                    <div className="text-center min-w-[100px]">
                        <div className="text-xs text-gray-400 font-normal truncate max-w-[120px]" title={col.topic_title}>{col.topic_title}</div>
                        <div className="text-sm font-medium text-gray-800 truncate max-w-[120px]" title={col.title}>{col.title}</div>
                    </div>
                ),
                accessorKey: `col_${col.id}`,
                cell: (p: any) => {
                    const prog = matrixData.progress?.[p.user_id]?.[col.id];
                    if (!prog) return <div className="text-center text-gray-300">-</div>;
                    
                    if (col.item_type === 'material') {
                        return (
                            <div className="flex justify-center text-green-600">
                                <span className="text-xs bg-green-50 px-2 py-0.5 rounded-full font-medium">Completed</span>
                            </div>
                        );
                    } else {
                        // quiz or assignment
                        const score = prog.score !== undefined && prog.score !== null ? Number(prog.score) : null;
                        return (
                            <div className="text-center font-medium">
                                {score !== null ? (
                                    <span className={score >= 70 ? 'text-green-600' : 'text-orange-500'}>
                                        {score.toFixed(2)}
                                    </span>
                                ) : (
                                    <span className="text-gray-400 text-xs">Completed</span>
                                )}
                            </div>
                        );
                    }
                }
            });
        });

        return cols;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('summary')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            viewMode === 'summary' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                        }`}
                    >
                        Log Ringkasan
                    </button>
                    <button
                        onClick={() => setViewMode('matrix')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            viewMode === 'matrix' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                        }`}
                    >
                        Detail Matrix
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportToExcel} className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50">
                        <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Excel
                    </Button>
                    <Button variant="outline" onClick={exportToPDF} className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50">
                        <FileText className="w-4 h-4 mr-2 text-red-500" /> PDF
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50">
                        <Printer className="w-4 h-4 mr-2 text-blue-600" /> Cetak
                    </Button>
                </div>
            </div>

            {viewMode === 'summary' ? (
                <div key="summary" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <DataTable 
                            columns={buildColumns()} 
                            data={activities}
                            searchKeys={['user_name', 'title']}
                            pageSize={15}
                            filterContent={
                                <Button size="sm" variant="outline" onClick={() => navigate(`/admin/events/${id}/lms`)} className="bg-white text-gray-700 hover:bg-gray-100 shadow-sm">
                                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                                    Kembali ke Kelola LMS
                                </Button>
                            }
                        />
                    )}
                </div>
            ) : (
                <div key="matrix" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loadingMatrix ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : matrixData ? (
                        <div className="overflow-x-auto w-full">
                            <DataTable 
                                columns={buildMatrixColumns()} 
                                data={matrixData.participants || []}
                                searchKeys={['user_name', 'asal_sekolah']}
                                pageSize={15}
                                filterContent={
                                    <Button size="sm" variant="outline" onClick={() => navigate(`/admin/events/${id}/lms`)} className="bg-white text-gray-700 hover:bg-gray-100 shadow-sm">
                                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                                        Kembali ke Kelola LMS
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            Gagal memuat matrix.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
