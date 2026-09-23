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

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Laporan Aktivitas LMS',
                description: 'Daftar semua aktivitas LMS yang dilakukan oleh seluruh peserta',
                icon: <Activity className="w-6 h-6" />
            });
        }
        if (id) {
            loadActivities();
        }
    }, [id, setPageHeader]);

    const loadActivities = async () => {
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

    if (loading) return <div className="p-8 text-center flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Memuat daftar aktivitas...</div>;

    return (
        <div className="space-y-6">
            <DataTable 
                data={activities} 
                columns={buildColumns()} 
                searchKeys={['user_name', 'title']}
                pageSize={15}
                filterContent={
                    <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="outline" onClick={handlePrint} className="text-gray-700 hover:bg-gray-100">
                            <Printer className="w-4 h-4 mr-1.5" /> Print
                        </Button>
                        <Button size="sm" variant="outline" onClick={exportToPDF} className="text-red-600 border-red-200 hover:bg-red-50">
                            <FileText className="w-4 h-4 mr-1.5" /> PDF
                        </Button>
                        <Button size="sm" variant="outline" onClick={exportToExcel} className="text-green-600 border-green-200 hover:bg-green-50">
                            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Excel
                        </Button>
                        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/events/${id}/lms`)} className="bg-white text-gray-700 hover:bg-gray-100 shadow-sm">
                            <ArrowLeft className="w-4 h-4 mr-1.5" />
                            Kembali ke Kelola LMS
                        </Button>
                    </div>
                }
            />
        </div>
    );
}
