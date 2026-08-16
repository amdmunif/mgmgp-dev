import { useState, useEffect, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, Plus, Minus, X, Loader2, Printer, Download, FileText } from 'lucide-react';
import { financeService } from '../../../services/financeService';
import { toast } from 'react-hot-toast';
import { DataTable } from '../../../components/ui/DataTable';
import { useOutletContext } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface FinanceSummary {
    total_income: number;
    total_expense: number;
    balance: number;
    this_month_income: number;
    this_month_expense: number;
}

interface FinanceTransaction {
    id: string;
    type: 'income' | 'expense';
    amount: string;
    description: string;
    reference_id: string | null;
    reference_type: string | null;
    transaction_date: string;
}

export function AdminFinances() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [txType, setTxType] = useState<'income' | 'expense'>('income');
    const [txAmount, setTxAmount] = useState<string>('');
    const [txDesc, setTxDesc] = useState<string>('');
    const [txDate, setTxDate] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    // Filter states
    const [filterDate, setFilterDate] = useState<string>('');
    const [filterMonth, setFilterMonth] = useState<string>('');
    const [filterYear, setFilterYear] = useState<string>('');

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const date = new Date(tx.transaction_date);
            const dateStr = tx.transaction_date.split(' ')[0];
            const monthStr = String(date.getMonth() + 1).padStart(2, '0');
            const yearStr = String(date.getFullYear());

            if (filterDate && dateStr !== filterDate) return false;
            if (filterMonth && monthStr !== filterMonth) return false;
            if (filterYear && yearStr !== filterYear) return false;

            return true;
        });
    }, [transactions, filterDate, filterMonth, filterYear]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text('Laporan Keuangan', 14, 15);
        doc.setFontSize(10);
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);
        
        const tableColumn = ["Tanggal", "Keterangan", "Tipe", "Jumlah"];
        const tableRows = filteredTransactions.map(tx => [
            formatDate(tx.transaction_date),
            tx.description,
            tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            formatCurrency(tx.amount)
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
        });
        
        doc.save('Laporan_Keuangan.pdf');
    };

    const handleExportExcel = () => {
        const data = filteredTransactions.map(tx => ({
            "Tanggal": formatDate(tx.transaction_date),
            "Keterangan": tx.description,
            "Tipe": tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            "Jumlah": Number(tx.amount)
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Keuangan");
        XLSX.writeFile(workbook, "Laporan_Keuangan.xlsx");
    };

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Buku Kas Keuangan',
                description: 'Laporan dan riwayat kas organisasi',
                icon: <Wallet className="w-6 h-6" />
            });
        }
        loadData();
    }, [setPageHeader]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [summaryData, txData] = await Promise.all([
                financeService.getSummary(),
                financeService.getTransactions()
            ]);
            setSummary(summaryData as unknown as FinanceSummary);
            setTransactions(txData);
        } catch (error) {
            console.error('Failed to load finances:', error);
            toast.error('Gagal memuat data keuangan');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(amount));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const columns = [
        {
            header: "Tanggal",
            accessorKey: "transaction_date" as keyof FinanceTransaction,
            cell: (item: FinanceTransaction) => (
                <div className="flex items-center text-gray-500 text-sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(item.transaction_date)}
                </div>
            )
        },
        {
            header: "Keterangan",
            accessorKey: "description" as keyof FinanceTransaction,
            cell: (item: FinanceTransaction) => (
                <div className="font-medium text-gray-900">{item.description}</div>
            )
        },
        {
            header: "Tipe",
            accessorKey: "type" as keyof FinanceTransaction,
            cell: (item: FinanceTransaction) => (
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </span>
            ),
            className: "text-center"
        },
        {
            header: "Jumlah",
            accessorKey: "amount" as keyof FinanceTransaction,
            cell: (item: FinanceTransaction) => (
                <div className={`font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                </div>
            ),
            className: "text-right"
        }
    ];

    if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 bg-blue-50 w-24 h-24 rounded-full opacity-50"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Saldo Kas</p>
                            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.balance || 0)}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 bg-green-50 w-24 h-24 rounded-full opacity-50"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Pemasukan</p>
                            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.total_income || 0)}</h3>
                            <p className="text-xs text-green-600 font-medium mt-1 flex items-center">
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                Bulan ini: {formatCurrency(summary?.this_month_income || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 bg-red-50 w-24 h-24 rounded-full opacity-50"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Pengeluaran</p>
                            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.total_expense || 0)}</h3>
                            <p className="text-xs text-red-600 font-medium mt-1 flex items-center">
                                <ArrowDownRight className="w-3 h-3 mr-1" />
                                Bulan ini: {formatCurrency(summary?.this_month_expense || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm print:shadow-none print:border-none print:bg-transparent">
                <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 print:hidden">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-gray-500" />
                        Riwayat Transaksi
                    </h2>
                    
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="date"
                            value={filterDate}
                            onChange={e => { setFilterDate(e.target.value); setFilterMonth(''); setFilterYear(''); }}
                            className="text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={filterMonth}
                            onChange={e => { setFilterMonth(e.target.value); setFilterDate(''); }}
                            className="text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Bulan</option>
                            {Array.from({ length: 12 }, (_, i) => {
                                const m = String(i + 1).padStart(2, '0');
                                return <option key={m} value={m}>{new Date(2000, i).toLocaleString('id-ID', { month: 'long' })}</option>;
                            })}
                        </select>
                        <select
                            value={filterYear}
                            onChange={e => { setFilterYear(e.target.value); setFilterDate(''); }}
                            className="text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Tahun</option>
                            {[...new Set(transactions.map(t => new Date(t.transaction_date).getFullYear()))].sort().reverse().map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                        <div className="flex gap-1">
                            <button onClick={handlePrint} className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg tooltip" title="Cetak (Print)">
                                <Printer className="w-4 h-4" />
                            </button>
                            <button onClick={handleExportPDF} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg tooltip" title="Download PDF">
                                <FileText className="w-4 h-4" />
                            </button>
                            <button onClick={handleExportExcel} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg tooltip" title="Download Excel">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setTxType('income'); setIsModalOpen(true); }}
                            className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Pemasukan
                        </button>
                        <button 
                            onClick={() => { setTxType('expense'); setIsModalOpen(true); }}
                            className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                        >
                            <Minus className="w-4 h-4" /> Pengeluaran
                        </button>
                    </div>
                </div>
                <div className="hidden print:block mb-4">
                    <h2 className="text-xl font-bold mb-2">Laporan Keuangan</h2>
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="p-2">Tanggal</th>
                                <th className="p-2">Keterangan</th>
                                <th className="p-2">Tipe</th>
                                <th className="p-2 text-right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(tx => (
                                <tr key={tx.id} className="border-b border-gray-200">
                                    <td className="p-2">{formatDate(tx.transaction_date)}</td>
                                    <td className="p-2">{tx.description}</td>
                                    <td className="p-2">{tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
                                    <td className="p-2 text-right">{formatCurrency(tx.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-6 print:hidden">
                    <DataTable
                        columns={columns}
                        data={filteredTransactions}
                        searchKeys={['description']}
                        pageSize={10}
                    />
                </div>
            </div>

            {/* Modal for Manual Transaction */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-lg">
                                Tambah {txType === 'income' ? 'Pemasukan' : 'Pengeluaran'} Manual
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                                <input
                                    type="number"
                                    value={txAmount}
                                    onChange={(e) => setTxAmount(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: 150000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                                <input
                                    type="text"
                                    value={txDesc}
                                    onChange={(e) => setTxDesc(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: Beli konsumsi / Uang kas masuk"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal & Waktu (Opsional)</label>
                                <input
                                    type="datetime-local"
                                    value={txDate}
                                    onChange={(e) => setTxDate(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                onClick={async () => {
                                    if (!txAmount || !txDesc) return alert('Nominal dan Keterangan wajib diisi!');
                                    setSubmitting(true);
                                    try {
                                        await financeService.addTransaction({
                                            type: txType,
                                            amount: Number(txAmount),
                                            description: txDesc,
                                            transaction_date: txDate ? txDate.replace('T', ' ') + ':00' : undefined
                                        });
                                        toast.success('Transaksi berhasil ditambahkan');
                                        setIsModalOpen(false);
                                        setTxAmount('');
                                        setTxDesc('');
                                        setTxDate('');
                                        loadData();
                                    } catch (error) {
                                        toast.error('Gagal menambahkan transaksi');
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }}
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Transaksi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
