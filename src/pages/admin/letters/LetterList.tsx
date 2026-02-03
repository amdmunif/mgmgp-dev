import { useState, useEffect } from 'react';
import { authService } from '../../../services/authService';
import { letterService } from '../../../services/letterService';
import { Button } from '../../../components/ui/button';
import { Plus, Download, Trash2, Search, FileText, Loader2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../../lib/utils';
import { LETTER_TEMPLATES } from '../../../lib/templates';

// Simple PDF generator mock (replace with real one via Edge Functions later)
const generatePDF = (letter: any) => {
    alert(`Generate PDF untuk surat: ${letter.letter_number}\nFitur ini akan diimplementasikan dengan React-PDF.`);
};

export function AdminLetters() {
    const [letters, setLetters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchLetters();
    }, []);

    const fetchLetters = async () => {
        try {
            const userData = await authService.getCurrentUser();
            if (!userData?.user) return;

            const data = await letterService.getAll();
            setLetters(data || []);
        } catch (error) {
            console.error('Error fetching letters:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus surat ini?')) return;

        try {
            await letterService.delete(id);
            setLetters(letters.filter(l => l.id !== id));
        } catch (error) {
            console.error(error);
            alert('Gagal menghapus surat');
        }
    };

    const filteredLetters = letters.filter(l =>
        l.letter_number.toLowerCase().includes(search.toLowerCase()) ||
        l.subject?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Arsip Surat</h1>
                    <p className="text-gray-500">Kelola dan buat surat administrasi otomatis.</p>
                </div>
                <Link to="/admin/letters/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"><Plus className="w-4 h-4 mr-2" /> Buat Surat Baru</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nomor surat atau perihal..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>
            ) : filteredLetters.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Belum ada surat</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">Mulai buat surat pertama Anda dengan memilih template yang tersedia.</p>
                    <Link to="/admin/letters/create">
                        <Button variant="outline">Buat Surat Sekarang</Button>
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-500">Nomor & Tanggal</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Perihal</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Template</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLetters.map((letter) => (
                                <tr key={letter.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{letter.letter_number}</div>
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                                            <FileText className="w-3 h-3" />
                                            {formatDate(letter.letter_date)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 line-clamp-1">{letter.subject || '-'}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-xs mt-0.5">Kepada: {letter.recipient}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                            {LETTER_TEMPLATES.find(t => t.id === letter.template_id)?.name || letter.template_id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => generatePDF(letter)} title="Download PDF" className="h-8 px-2 text-gray-600">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleDelete(letter.id)} title="Hapus" className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
