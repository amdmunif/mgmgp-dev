import { useState, useEffect } from 'react';
import { auditService, type AuditLog } from '../../services/auditService';
import { ShieldAlert, Clock } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { DataTable } from '../../components/ui/DataTable';
import { useOutletContext } from 'react-router-dom';

export function AuditLogs() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Log Aktivitas',
                description: 'Riwayat tindakan administratif untuk audit dan keamanan.',
                icon: <ShieldAlert className="w-6 h-6" />
            });
        }
        fetchLogs();
    }, [setPageHeader]);

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

    const columns = [
        {
            header: 'Waktu',
            accessorKey: 'created_at' as keyof AuditLog,
            className: 'w-48',
            cell: (log: AuditLog) => (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(log.created_at)}
                </div>
            )
        },
        {
            header: 'Pengguna',
            accessorKey: 'user_name' as keyof AuditLog,
            className: 'w-64',
            cell: (log: AuditLog) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold border border-blue-100">
                        {log.user_display_name ? log.user_display_name.charAt(0) : log.user_name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 text-sm">{log.user_display_name || log.user_name}</div>
                        <div className="text-[10px] text-gray-400">ID: {log.user_id.substring(0, 8)}...</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Tindakan',
            accessorKey: 'action' as keyof AuditLog,
            className: 'w-40',
            cell: (log: AuditLog) => getActionBadge(log.action)
        },
        {
            header: 'Target',
            accessorKey: 'target' as keyof AuditLog,
            cell: (log: AuditLog) => (
                <span className="text-sm text-gray-600 truncate block max-w-xs" title={log.target}>
                    {log.target || '-'}
                </span>
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
                        data={logs}
                        columns={columns}
                        searchKeys={['user_name', 'action', 'target']}
                        pageSize={15}
                    />
                )}
            </div>
        </div>
    );
}
