import { useState, useEffect, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, Plus, Minus, X, Loader2, Printer, Download, FileText, Trash2, Filter, RotateCcw, Tag, Crown } from 'lucide-react';
import { financeService } from '../../../services/financeService';
import { eventService } from '../../../services/eventService';
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
    event_title?: string | null;
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
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [filterSource, setFilterSource] = useState<'all' | 'event' | 'premium' | 'manual'>('all');
    const [filterEvent, setFilterEvent] = useState<string>('all');
    const [availableEvents, setAvailableEvents] = useState<string[]>([]);
    const [filterDate, setFilterDate] = useState<string>('');
    const [filterMonth, setFilterMonth] = useState<string>('');
    const [filterYear, setFilterYear] = useState<string>('');

    const getTransactionSource = (tx: FinanceTransaction): 'event' | 'premium' | 'manual' => {
        if (tx.reference_type === 'event_registration' || tx.description?.toLowerCase().includes('pendaftaran event')) {
            return 'event';
        }
        if (tx.reference_type === 'premium_upgrade' || tx.description?.toLowerCase().includes('premium upgrade')) {
            return 'premium';
        }
        return 'manual';
    };

    const getEventTitle = (tx: FinanceTransaction): string | null => {
        if (tx.event_title) return tx.event_title.trim();
        const match = tx.description?.match(/^Pendaftaran Event:\s*(.*?)(?:\s*\(a\.n\.|\s*$)/i);
        if (match && match[1]) {
            return match[1].trim();
        }
        return null;
    };

    const isFiltered = filterType !== 'all' || 
                       filterSource !== 'all' || 
                       filterEvent !== 'all' || 
                       Boolean(filterDate) || 
                       Boolean(filterMonth) || 
                       Boolean(filterYear);

    const resetFilters = () => {
        setFilterType('all');
        setFilterSource('all');
        setFilterEvent('all');
        setFilterDate('');
        setFilterMonth('');
        setFilterYear('');
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            // Filter by transaction type (income / expense)
            if (filterType !== 'all' && tx.type !== filterType) {
                return false;
            }

            // Filter by source (event, premium, manual)
            const source = getTransactionSource(tx);
            if (filterSource !== 'all' && source !== filterSource) {
                return false;
            }

            // Filter by specific event
            if (filterEvent !== 'all') {
                const title = getEventTitle(tx);
                if (!title || title.toLowerCase() !== filterEvent.toLowerCase()) {
                    return false;
                }
            }

            // Filter by date, month, year
            const date = new Date(tx.transaction_date);
            const dateStr = tx.transaction_date.split(' ')[0];
            const monthStr = String(date.getMonth() + 1).padStart(2, '0');
            const yearStr = String(date.getFullYear());

            if (filterDate && dateStr !== filterDate) return false;
            if (filterMonth && monthStr !== filterMonth) return false;
            if (filterYear && yearStr !== filterYear) return false;

            return true;
        });
    }, [transactions, filterType, filterSource, filterEvent, filterDate, filterMonth, filterYear]);

    const filteredStats = useMemo(() => {
        let income = 0;
        let expense = 0;
        filteredTransactions.forEach(tx => {
            const amt = Number(tx.amount) || 0;
            if (tx.type === 'income') income += amt;
            else if (tx.type === 'expense') expense += amt;
        });
        return {
            count: filteredTransactions.length,
            income,
            expense,
            net: income - expense
        };
    }, [filteredTransactions]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text('Laporan Keuangan', 14, 15);
        doc.setFontSize(10);
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);
        if (filterSource !== 'all' || filterEvent !== 'all') {
            const filterLabel = filterEvent !== 'all' ? `Kegiatan: ${filterEvent}` : filterSource === 'event' ? 'Sumber: Kegiatan' : filterSource === 'premium' ? 'Sumber: Upgrade Member' : 'Sumber: Manual';
            doc.text(`Filter: ${filterLabel}`, 14, 27);
        }
        
        const tableColumn = ["Tanggal", "Keterangan", "Sumber", "Tipe", "Jumlah"];
        const tableRows = filteredTransactions.map(tx => {
            const source = getTransactionSource(tx);
            const sourceLabel = source === 'event' ? 'Kegiatan' : source === 'premium' ? 'Upgrade Member' : 'Manual';
            return [
                formatDate(tx.transaction_date),
                tx.description,
                sourceLabel,
                tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                formatCurrency(tx.amount)
            ];
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: filterSource !== 'all' || filterEvent !== 'all' ? 32 : 28,
        });
        
        doc.save('Laporan_Keuangan.pdf');
    };

    const handleExportExcel = () => {
        const data = filteredTransactions.map(tx => {
            const source = getTransactionSource(tx);
            const eventTitle = getEventTitle(tx);
            const sourceLabel = source === 'event' ? (eventTitle ? `Kegiatan: ${eventTitle}` : 'Kegiatan') : source === 'premium' ? 'Upgrade Member' : 'Manual';
            return {
                "Tanggal": formatDate(tx.transaction_date),
                "Keterangan": tx.description,
                "Sumber": sourceLabel,
                "Tipe": tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                "Jumlah": Number(tx.amount)
            };
        });
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
            const [summaryData, txData, eventsData] = await Promise.all([
                financeService.getSummary().catch(err => {
                    console.error('Failed to get finance summary:', err);
                    return null;
                }),
                financeService.getTransactions().catch(err => {
                    console.error('Failed to get finance transactions:', err);
                    return [];
                }),
                eventService.getEvents().catch(() => [])
            ]);

            if (summaryData) {
                setSummary(summaryData as unknown as FinanceSummary);
            }

            const safeTxData: FinanceTransaction[] = Array.isArray(txData) ? txData : [];
            const safeEvents = Array.isArray(eventsData) ? eventsData : [];

            // Map event IDs to titles for fast lookup
            const eventMap = new Map<string, string>();
            safeEvents.forEach((e: any) => {
                if (e.id && e.title) eventMap.set(String(e.id), e.title.trim());
            });

            // Enrich transactions with event_title if reference_id matches
            const enrichedTx = safeTxData.map((tx: FinanceTransaction) => {
                if (!tx.event_title && tx.reference_id && eventMap.has(String(tx.reference_id))) {
                    return { ...tx, event_title: eventMap.get(String(tx.reference_id)) };
                }
                return tx;
            });

            setTransactions(enrichedTx);

            // Compute available unique event titles from transactions + events API
            const txEventTitles = enrichedTx
                .filter((t: FinanceTransaction) => getTransactionSource(t) === 'event')
                .map((t: FinanceTransaction) => getEventTitle(t))
                .filter((title): title is string => Boolean(title));
            const eventsApiTitles = safeEvents.map((e: any) => e.title?.trim()).filter(Boolean);
            const allUniqueEvents = Array.from(new Set([...txEventTitles, ...eventsApiTitles])).sort() as string[];
            setAvailableEvents(allUniqueEvents);
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

    const handleDelete = async (id: string, description: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus transaksi "${description}"? Saldo kas akan disesuaikan kembali.`)) return;

        try {
            await financeService.deleteTransaction(id);
            toast.success('Transaksi berhasil dihapus');
            loadData();
        } catch (error) {
            toast.error('Gagal menghapus transaksi');
        }
    };

    const columns = [
        {
            header: "Tanggal",
            accessorKey: "transaction_date" as keyof FinanceTransaction,
            cell: (item: FinanceTransaction) => (
                <div className="flex items-center text-gray-500 text-sm whitespace-nowrap">
                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                    {formatDate(item.transaction_date)}
                </div>
            )
        },
        {
            header: "Keterangan",
            accessorKey: "description" as keyof FinanceTransaction,
            cell: (item: FinanceTransaction) => {
                const source = getTransactionSource(item);
                const eventTitle = getEventTitle(item);
                
                return (
                    <div className="space-y-1">
                        <div className="font-medium text-gray-900 leading-snug">{item.description}</div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {source === 'event' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilterSource('event');
                                        if (eventTitle) setFilterEvent(eventTitle);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                                    title="Klik untuk filter transaksi hanya untuk kegiatan ini"
                                >
                                    <Tag className="w-3 h-3 text-blue-500 shrink-0" />
                                    <span className="truncate max-w-[280px]">Kegiatan{eventTitle ? `: ${eventTitle}` : ''}</span>
                                </button>
                            )}
                            {source === 'premium' && (
                                <button
                                    type="button"
                                    onClick={() => setFilterSource('premium')}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                                    title="Klik untuk filter transaksi Upgrade Member"
                                >
                                    <Crown className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>Upgrade Member</span>
                                </button>
                            )}
                            {source === 'manual' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    Manual
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            header: "Tipe",
            accessorKey: "type" as keyof FinanceTransaction,
            cell: (item: FinanceTransaction) => (
                <span className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
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
        },
        {
            header: "Aksi",
            cell: (item: FinanceTransaction) => (
                <button
                    onClick={() => handleDelete(item.id, item.description)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors tooltip mx-auto block"
                    title="Hapus Transaksi"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            ),
            className: "text-center w-16"
        }
    ];

    const FilterContent = (
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Filter Tipe Transaksi */}
            <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                className="text-xs sm:text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                title="Filter Tipe Transaksi"
            >
                <option value="all">Semua Tipe</option>
                <option value="income">Pemasukan Saja (+)</option>
                <option value="expense">Pengeluaran Saja (-)</option>
            </select>

            {/* Filter Sumber Dana (Fokus Utama User) */}
            <select
                value={filterSource}
                onChange={(e) => {
                    const val = e.target.value as 'all' | 'event' | 'premium' | 'manual';
                    setFilterSource(val);
                    if (val !== 'event' && val !== 'all') {
                        setFilterEvent('all');
                    }
                }}
                className="text-xs sm:text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors font-medium text-gray-800"
                title="Filter Sumber Dana / Uang Masuk"
            >
                <option value="all">Semua Sumber Dana</option>
                <option value="event">Pendaftaran Kegiatan (Event)</option>
                <option value="premium">Upgrade Member Premium</option>
                <option value="manual">Manual / Lainnya</option>
            </select>

            {/* Filter Kegiatan Spesifik */}
            {(filterSource === 'all' || filterSource === 'event') && availableEvents.length > 0 && (
                <select
                    value={filterEvent}
                    onChange={(e) => {
                        setFilterEvent(e.target.value);
                        if (e.target.value !== 'all') {
                            setFilterSource('event');
                        }
                    }}
                    className={`text-xs sm:text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none max-w-[220px] sm:max-w-[280px] truncate transition-colors ${
                        filterEvent !== 'all' 
                            ? 'border-blue-400 bg-blue-50 text-blue-900 font-semibold' 
                            : 'border-gray-200 bg-gray-50 hover:bg-white text-gray-700'
                    }`}
                    title={filterEvent !== 'all' ? `Kegiatan: ${filterEvent}` : 'Pilih Kegiatan Spesifik'}
                >
                    <option value="all">Semua Kegiatan ({availableEvents.length})</option>
                    {availableEvents.map(evt => (
                        <option key={evt} value={evt}>
                            {evt}
                        </option>
                    ))}
                </select>
            )}

            {isFiltered && (
                <button
                    onClick={resetFilters}
                    className="px-2.5 py-2 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors flex items-center gap-1 border border-red-200"
                    title="Reset semua filter"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                </button>
            )}
        </div>
    );

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
                <div className="p-6 print:hidden space-y-4">
                    {isFiltered && (
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-blue-50/80 border border-blue-200/70 rounded-xl text-xs sm:text-sm">
                            <div className="flex flex-wrap items-center gap-2 text-blue-950 font-medium">
                                <Filter className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>
                                    Hasil Terfilter: <strong>{filteredStats.count}</strong> transaksi
                                </span>
                                <span className="text-blue-300">|</span>
                                <span className="text-green-700 font-semibold">
                                    Pemasukan: +{formatCurrency(filteredStats.income)}
                                </span>
                                {filteredStats.expense > 0 && (
                                    <>
                                        <span className="text-blue-300">|</span>
                                        <span className="text-red-700 font-semibold">
                                            Pengeluaran: -{formatCurrency(filteredStats.expense)}
                                        </span>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={resetFilters}
                                className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 ml-auto"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset Filter
                            </button>
                        </div>
                    )}

                    <DataTable
                        columns={columns}
                        data={filteredTransactions}
                        searchKeys={['description']}
                        pageSize={10}
                        filterContent={FilterContent}
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
