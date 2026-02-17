import { useState, useEffect } from 'react';
import { Mail, Trash2, MessageSquare, User, Calendar, Eye } from 'lucide-react';
import { contactService } from '../../services/contactService';
import type { ContactMessage } from '../../services/contactService';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/DataTable';
import { useOutletContext } from 'react-router-dom';

export function AdminMessages() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingMessage, setViewingMessage] = useState<ContactMessage | null>(null);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Pesan Hubungi Kami',
                description: 'Kelola pesan dan pertanyaan dari pengunjung website.',
                icon: <MessageSquare className="w-6 h-6" />
            });
        }
        fetchMessages();
    }, [setPageHeader]);

    const fetchMessages = async () => {
        try {
            const data = await contactService.getAll();
            setMessages(data);
        } catch (error) {
            toast.error('Gagal mengambil pesan');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return;
        try {
            await contactService.delete(id);
            toast.success('Pesan dihapus');
            setMessages(messages.filter(m => m.id !== id));
            if (viewingMessage && viewingMessage.id === id) setViewingMessage(null);
        } catch (error) {
            toast.error('Gagal menghapus pesan');
        }
    };

    const columns = [
        {
            header: 'Tanggal',
            accessorKey: 'created_at' as keyof ContactMessage,
            className: 'w-40',
            cell: (item: ContactMessage) => (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {item.created_at ? formatDate(item.created_at) : '-'}
                </div>
            )
        },
        {
            header: 'Pengirim',
            accessorKey: 'name' as keyof ContactMessage,
            className: 'w-64',
            cell: (item: ContactMessage) => (
                <div>
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                        <User className="w-4 h-4 text-gray-400" />
                        {item.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Mail className="w-3 h-3" />
                        {item.email}
                    </div>
                </div>
            )
        },
        {
            header: 'Pesan',
            accessorKey: 'message' as keyof ContactMessage,
            cell: (item: ContactMessage) => (
                <div className="text-sm text-gray-600 line-clamp-2 max-w-lg cursor-pointer hover:text-gray-900" onClick={() => setViewingMessage(item)}>
                    {item.message}
                </div>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right w-24',
            cell: (item: ContactMessage) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setViewingMessage(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Lihat Detail"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => item.id && handleDelete(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Hapus"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <DataTable
                        data={messages}
                        columns={columns}
                        searchKeys={['name', 'email', 'message']}
                        pageSize={10}
                    />
                )}
            </div>

            {/* View Message Modal */}
            {viewingMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Detail Pesan</h2>
                            <button onClick={() => setViewingMessage(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                                &times;
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{viewingMessage.name}</h3>
                                    <p className="text-sm text-gray-500">{viewingMessage.email}</p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                        <Calendar className="w-3 h-3" />
                                        {viewingMessage.created_at ? formatDate(viewingMessage.created_at) : '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {viewingMessage.message}
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button onClick={() => setViewingMessage(null)}>Tutup</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
