import re

with open('src/pages/admin/finances/AdminFinances.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect, useMemo } from 'react';")
content = content.replace("import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, Plus, Minus, X, Loader2 } from 'lucide-react';", "import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, Plus, Minus, X, Loader2, Printer, Download, FileText } from 'lucide-react';")
content = content.replace("import { useOutletContext } from 'react-router-dom';", "import { useOutletContext } from 'react-router-dom';\nimport { jsPDF } from 'jspdf';\nimport autoTable from 'jspdf-autotable';\nimport * as XLSX from 'xlsx';")

# 2. Add states and memos
states_str = """    const [submitting, setSubmitting] = useState(false);

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
    };"""

content = content.replace("    const [submitting, setSubmitting] = useState(false);", states_str)

# 3. Update the table section
table_section = """            {/* Transactions List */}
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
            </div>"""

old_table_start = """            {/* Transactions List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-gray-500" />
                        Riwayat Transaksi
                    </h2>
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
                <div className="p-6">
                    <DataTable
                        columns={columns}
                        data={transactions}
                        searchKeys={['description']}
                        pageSize={10}
                    />
                </div>
            </div>"""

content = content.replace(old_table_start, table_section)

with open('src/pages/admin/finances/AdminFinances.tsx', 'w') as f:
    f.write(content)
