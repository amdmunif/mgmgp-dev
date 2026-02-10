```javascript
import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Camera, X } from 'lucide-react';
import { galleryService } from '../../services/galleryService';
import type { GalleryImage } from '../../services/galleryService';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';

export function AdminMessages() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMessages();
    }, []);

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
        } catch (error) {
            toast.error('Gagal menghapus pesan');
        }
    };

    const filteredMessages = messages.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Pesan Hubungi Kami</h2>
                    <p className="text-gray-500 text-sm">Kelola pesan dan pertanyaan dari pengunjung website</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari pesan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredMessages.map((message) => (
                    <div key={message.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                        <User className="w-4 h-4 text-blue-500" />
                                        {message.name}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-blue-500" />
                                        {message.email}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        {message.created_at ? formatDate(message.created_at) : '-'}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative">
                                    <MessageSquare className="absolute right-4 top-4 w-12 h-12 text-gray-200/50 pointer-events-none" />
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap relative z-10">
                                        {message.message}
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => message.id && handleDelete(message.id)}
                                className="text-red-600 hover:text-white hover:bg-red-600 border-red-100 hover:border-red-600 shrink-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {filteredMessages.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-gray-900 font-bold">Tidak ada pesan ditemukan</h3>
                        <p className="text-gray-500 text-sm">Coba ubah kata kunci pencarian Anda</p>
                    </div>
                )}
            </div>
        </div>
    );
}
