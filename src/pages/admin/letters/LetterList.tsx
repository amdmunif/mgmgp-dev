import { useState, useEffect } from 'react';
import { authService } from '../../../services/authService';
import { letterService } from '../../../services/letterService';
import { Button } from '../../../components/ui/button';
import { Plus, Download, Trash2, Search, FileText, Loader2 } from 'lucide-react';
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

            const data = await letterService.getLetters(userData.user.id);
            setLetters(data || []);
        } catch (error) {
            console.error('Error fetching letters:', error);
            // alert('Gagal memuat surat'); // Optional feedback
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus surat ini?')) return;

        try {
            await letterService.deleteLetter(id);
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
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Arsip Surat</h1>
                    <p className="text-gray-500 mt-1">Kelola dan buat surat administrasi otomatis.</p>
                </div>
                <Link to="/admin/letters/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" /> Buat Surat Baru
                    </Button>
                </Link>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nomor surat atau perihal..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12"><Loader2 className="animate-spin w-8 h-8 mx-auto text-primary-500" /></div>
            ) : filteredLetters.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Belum ada surat</h3>
                    <p className="text-gray-500 mb-4">Mulai buat surat pertama Anda sekarang.</p>
                    <Link to="/admin/letters/create">
                        <Button variant="outline">Buat Surat</Button>
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nomor & Tanggal</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Perihal</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Template</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLetters.map((letter) => (
                                <tr key={letter.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{letter.letter_number}</div>
                                        <div className="text-xs text-gray-500">{formatDate(letter.letter_date)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900">{letter.subject || '-'}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-xs">{letter.recipient}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {LETTER_TEMPLATES.find(t => t.id === letter.template_id)?.name || letter.template_id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => generatePDF(letter)} title="Download PDF">
                                            <Download className="w-4 h-4 text-gray-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(letter.id)} title="Hapus">
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
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
