import { useState, useEffect } from 'react';
import { Mail, Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

interface EmailLog {
    id: number;
    recipient_email: string;
    subject: string;
    status: 'success' | 'failed';
    error_message: string | null;
    created_at: string;
}

export function EmailLogs() {
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const data = await api.get<EmailLog[]>('/logs/emails');
            setLogs(data);
        } catch (error) {
            console.error('Error fetching email logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Mail className="w-6 h-6 text-primary-600" />
                    Log Pengiriman Email
                </h1>
                <p className="text-gray-500 mt-1">Pantau status pengiriman email dari sistem.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari email penerima atau subjek..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Tanggal</th>
                                <th className="px-6 py-4 font-semibold">Penerima</th>
                                <th className="px-6 py-4 font-semibold">Subjek</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Memuat data log email...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        Tidak ada data log email ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.recipient_email}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.subject}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {log.status === 'success' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                                        <CheckCircle2 className="w-3 h-3" /> Berhasil
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 w-fit">
                                                            <XCircle className="w-3 h-3" /> Gagal
                                                        </span>
                                                        {log.error_message && (
                                                            <span className="text-xs text-red-600 max-w-xs truncate" title={log.error_message}>
                                                                {log.error_message}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
