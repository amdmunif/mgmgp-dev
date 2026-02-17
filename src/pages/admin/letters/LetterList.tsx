import { useState, useEffect } from 'react';
import { authService } from '../../../services/authService';
import { letterService } from '../../../services/letterService';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, FileText, Mail, Pencil } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { formatDate } from '../../../lib/utils';
import { LETTER_TEMPLATES } from '../../../lib/templates';
import { DataTable } from '../../../components/ui/DataTable';

export function AdminLetters() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [letters, setLetters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Arsip Surat',
                description: 'Kelola dan buat surat administrasi otomatis.',
                icon: <Mail className="w-6 h-6" />
            });
        }
        fetchLetters();
    }, [setPageHeader]);

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

    const columns = [
        {
            header: 'Nomor & Tanggal',
            accessorKey: 'letter_number',
            cell: (item: any) => (
                <div>
                    <div className="font-bold text-gray-900">{item.letter_number}</div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                        <FileText className="w-3 h-3" />
                        {formatDate(item.letter_date)}
                    </div>
                </div>
            )
        },
        {
            header: 'Perihal',
            accessorKey: 'subject',
            cell: (item: any) => (
                <div>
                    <div className="font-medium text-gray-900 line-clamp-1">{item.subject || '-'}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs mt-0.5">Kepada: {item.recipient}</div>
                </div>
            )
        },
        {
            header: 'Template',
            accessorKey: 'template_id',
            cell: (item: any) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {LETTER_TEMPLATES.find(t => t.id === item.template_id)?.name || item.template_id}
                </span>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right',
            cell: (item: any) => (
                <div className="flex items-center justify-end gap-2">
                    <Link to={`/admin/letters/edit/${item.id}`}>
                        <Button variant="outline" size="sm" title="Edit" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100">
                            <Pencil className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)} title="Hapus" className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">


            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <DataTable
                        data={letters}
                        columns={columns}
                        searchKeys={['letter_number', 'subject', 'recipient']}
                        pageSize={10}
                        filterContent={
                            <Link to="/admin/letters/create">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 h-9">
                                    <Plus className="w-4 h-4 mr-2" /> Buat Surat
                                </Button>
                            </Link>
                        }
                    />
                )}
            </div>
        </div>
    );
}
