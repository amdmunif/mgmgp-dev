import { useState, useEffect } from 'react';
import { auditService, type AuditLog } from '../../services/auditService';
import { Activity, Search, Clock, ShieldAlert } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const data = await auditService.getAll();
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionBadge = (action: string) => {
        const colors: Record<string, string> = {
            'CREATE': 'bg-green-100 text-green-700 border-green-200',
            'UPDATE': 'bg-blue-100 text-blue-700 border-blue-200',
            'DELETE': 'bg-red-100 text-red-700 border-red-200',
            'LOGIN': 'bg-purple-100 text-purple-700 border-purple-200',
            'AUTH': 'bg-orange-100 text-orange-700 border-orange-200'
        };

        const prefix = action.split('_')[0];
        const colorClass = colors[prefix] || 'bg-gray-100 text-gray-700 border-gray-200';

        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${colorClass}`}>
                {action}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-primary-600" /> Log Aktivitas
                    </h1>
                    <p className="text-gray-500 text-sm italic mt-1">
                        Riwayat tindakan administratif untuk audit dan keamanan.
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari log..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-full md:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-gray-500 animate-pulse">Memuat riwayat log...</p>
                    </div>
                ) : filteredLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pengguna</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tindakan</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Target</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 italic font-mono text-sm">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 opacity-50" />
                                                {formatDate(log.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-primary-50 text-primary-700 rounded-full flex items-center justify-center text-[10px] font-bold border border-primary-100 shadow-sm">
                                                    {log.user_display_name ? log.user_display_name.charAt(0) : log.user_name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-gray-900 truncate">{log.user_display_name || log.user_name}</span>
                                                    <span className="text-[10px] text-gray-400 truncate opacity-70">ID: {log.user_id.substring(0, 8)}...</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-500 truncate block max-w-xs" title={log.target}>
                                                {log.target || '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Activity className="w-12 h-12 text-gray-300 mb-4 opacity-20" />
                        <p className="text-lg">Tidak ada log ditemukan</p>
                        <p className="text-sm">Coba sesuaikan pencarian Anda.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
