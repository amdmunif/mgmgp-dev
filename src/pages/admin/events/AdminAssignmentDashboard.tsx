import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Loader2, Users, BookOpen, FileText, FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { lmsService } from '../../../services/lmsService';
import { toast } from 'react-hot-toast';
import { DataTable } from '../../../components/ui/DataTable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function AdminAssignmentDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setPageHeader } = useOutletContext<any>() || {};
    const [loading, setLoading] = useState(true);
    const [gradebook, setGradebook] = useState<any>(null);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Buku Nilai (Gradebook)',
                description: 'Daftar nilai seluruh peserta dari semua kuis dan penugasan di kelas ini',
                icon: <BookOpen className="w-6 h-6" />
            });
        }
        if (id) {
            loadGradebook();
        }
    }, [id, setPageHeader]);

    const loadGradebook = async () => {
        try {
            setLoading(true);
            const data = await lmsService.getEventGradebook(id!);
            setGradebook(data);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat buku nilai");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Memuat daftar nilai peserta...</div>;

    const buildColumns = () => {
        if (!gradebook) return [];
        
        const columns: any[] = [
            {
                header: 'Nama Peserta',
                accessorKey: 'nama',
                cell: (p: any) => (
                    <div>
                        <div className="font-medium text-gray-900">{p.nama}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.asal_sekolah || 'Asal sekolah tidak diketahui'}</div>
                    </div>
                ),
                className: 'min-w-[200px]'
            }
        ];

        gradebook.quizzes.forEach((q: any, i: number) => {
            const isPreTest = q.title.toLowerCase().includes('pre-test') || q.title.toLowerCase().includes('pre test');
            const isPostTest = q.title.toLowerCase().includes('post-test') || q.title.toLowerCase().includes('post test');
            const shortTitle = isPreTest ? 'Pre-Test' : isPostTest ? 'Post-Test' : `K${i + 1}`;
            
            columns.push({
                header: (
                    <div className="text-center" title={q.title}>
                        <div className="text-xs font-semibold text-blue-700">{shortTitle}</div>
                    </div>
                ),
                cell: (p: any) => {
                    const quizScore = p.quizzes.find((x: any) => x.quiz_id === q.id)?.score;
                    return (
                        <div className="text-center font-medium">
                            {quizScore !== null && quizScore !== undefined ? (
                                <span className="text-gray-900">{quizScore}</span>
                            ) : (
                                <span className="text-gray-400">-</span>
                            )}
                        </div>
                    );
                },
                className: 'text-center whitespace-nowrap'
            });
        });

        gradebook.assignments.forEach((a: any, i: number) => {
            const shortTitle = `T${i + 1}`;
            
            columns.push({
                header: (
                    <div className="text-center" title={a.title}>
                        <div className="text-xs font-semibold text-green-700">{shortTitle}</div>
                    </div>
                ),
                cell: (p: any) => {
                    const asgScore = p.assignments.find((x: any) => x.assignment_id === a.id)?.score;
                    return (
                        <div className="text-center font-medium">
                            {asgScore !== null && asgScore !== undefined ? (
                                <span className="text-gray-900">{asgScore}</span>
                            ) : (
                                <span className="text-gray-400">-</span>
                            )}
                        </div>
                    );
                },
                className: 'text-center whitespace-nowrap'
            });
        });

        columns.push({
            header: <div className="text-center">Rerata Akhir</div>,
            accessorKey: 'average_score',
            cell: (p: any) => (
                <div className="text-center font-bold">
                    <span className={p.average_score >= 70 ? 'text-green-600' : p.average_score > 0 ? 'text-orange-500' : 'text-gray-400'}>
                        {p.average_score > 0 ? p.average_score.toFixed(2) : '-'}
                    </span>
                </div>
            ),
            className: 'text-center bg-gray-50/50 min-w-[120px]'
        });

        return columns;
    };

    const getExportData = () => {
        if (!gradebook) return { head: [], body: [] };
        const head = ['Nama Peserta', 'Asal Sekolah'];
        gradebook.quizzes.forEach((q: any, i: number) => {
            const isPreTest = q.title.toLowerCase().includes('pre-test') || q.title.toLowerCase().includes('pre test');
            const isPostTest = q.title.toLowerCase().includes('post-test') || q.title.toLowerCase().includes('post test');
            head.push(isPreTest ? 'Pre-Test' : isPostTest ? 'Post-Test' : `K${i + 1}`);
        });
        gradebook.assignments.forEach((_a: any, i: number) => {
            head.push(`T${i + 1}`);
        });
        head.push('Rata-rata');

        const body = gradebook.participants.map((p: any) => {
            const row = [p.nama, p.asal_sekolah || '-'];
            gradebook.quizzes.forEach((q: any) => {
                const score = p.quizzes.find((x: any) => x.quiz_id === q.id)?.score;
                row.push(score !== null && score !== undefined ? score : '-');
            });
            gradebook.assignments.forEach((a: any) => {
                const score = p.assignments.find((x: any) => x.assignment_id === a.id)?.score;
                row.push(score !== null && score !== undefined ? score : '-');
            });
            row.push(p.average_score > 0 ? p.average_score.toFixed(2) : '-');
            return row;
        });

        return { head: [head], body };
    };

    const exportToExcel = () => {
        const { head, body } = getExportData();
        const ws = XLSX.utils.aoa_to_sheet([...head, ...body]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Nilai");
        XLSX.writeFile(wb, "Daftar_Nilai_Peserta.xlsx");
    };

    const exportToPDF = () => {
        const { head, body } = getExportData();
        const doc = new jsPDF('landscape');
        doc.text("Daftar Nilai Peserta", 14, 15);
        autoTable(doc, {
            head: head,
            body: body,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
        });
        doc.save("Daftar_Nilai_Peserta.pdf");
    };

    const handlePrint = () => {
        const { head, body } = getExportData();
        let printContent = `
            <html>
            <head>
                <title>Cetak Daftar Nilai</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    th:first-child, td:first-child { text-align: left; }
                    th { background-color: #f3f4f6; }
                    h2 { text-align: center; }
                </style>
            </head>
            <body>
                <h2>Daftar Nilai Peserta</h2>
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

    return (
        <div className="space-y-6">


            {!gradebook?.participants || gradebook.participants.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-100 rounded-xl flex flex-col items-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-900 font-medium mb-1">Tidak Ada Peserta</h3>
                    <p className="text-gray-500 text-sm">Belum ada peserta yang mendaftar di acara/kelas ini.</p>
                </div>
            ) : (
                <DataTable 
                    data={gradebook.participants} 
                    columns={buildColumns()} 
                    searchKeys={['nama', 'asal_sekolah']}
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
                                Kembali
                            </Button>
                        </div>
                    }
                />
            )}
        </div>
    );
}
