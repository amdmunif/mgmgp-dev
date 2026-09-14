import { useState, useEffect } from 'react';
import { auditService, type AuditLog, type KkaLog } from '../../services/auditService';
import { ShieldAlert, Clock, Database } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { DataTable } from '../../components/ui/DataTable';
import { useOutletContext } from 'react-router-dom';

export function AuditLogs() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [activeTab, setActiveTab] = useState<'system' | 'kka'>('system');
    
    // System logs state
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState<string>('ALL');

    // KKA logs state
    const [kkaLogs, setKkaLogs] = useState<KkaLog[]>([]);
    const [loadingKka, setLoadingKka] = useState(false);
    const [kkaActionFilter, setKkaActionFilter] = useState<string>('ALL');

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Log Aktivitas',
                description: 'Riwayat tindakan administratif dan aktivitas database.',
                icon: <ShieldAlert className="w-6 h-6" />
            });
        }
        fetchLogs();
    }, [setPageHeader]);

    useEffect(() => {
        if (activeTab === 'kka' && kkaLogs.length === 0) {
            fetchKkaLogs();
        }
    }, [activeTab]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await auditService.getAll();
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch system logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchKkaLogs = async () => {
        setLoadingKka(true);
        try {
            const data = await auditService.getKkaLogs();
            setKkaLogs(data);
        } catch (error) {
            console.error('Failed to fetch KKA logs:', error);
        } finally {
            setLoadingKka(false);
        }
    };

    const getActionBadge = (action: string) => {
        const colors: Record<string, string> = {
            'CREATE': 'bg-green-100 text-green-700 border-green-200',
            'UPDATE': 'bg-blue-100 text-blue-700 border-blue-200',
            'DELETE': 'bg-red-100 text-red-700 border-red-200',
            'LOGIN': 'bg-purple-100 text-purple-700 border-purple-200',
            'AUTH': 'bg-orange-100 text-orange-700 border-orange-200',
            'INSERT': 'bg-teal-100 text-teal-700 border-teal-200'
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
                        {log.user_display_name ? log.user_display_name.charAt(0) : log.user_name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 text-sm">{log.user_display_name || log.user_name || 'System'}</div>
                        <div className="text-[10px] text-gray-400">ID: {log.user_id?.substring(0, 8) || '-'}...</div>
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

    const kkaColumns = [
        {
            header: 'Waktu',
            accessorKey: 'created_at' as keyof KkaLog,
            className: 'w-48',
            cell: (log: KkaLog) => (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(log.created_at)}
                </div>
            )
        },
        {
            header: 'Guru',
            accessorKey: 'guru_name' as keyof KkaLog,
            className: 'w-64',
            cell: (log: KkaLog) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-bold border border-indigo-100">
                        {log.guru_name ? log.guru_name.charAt(0) : '?'}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 text-sm">{log.guru_name || 'Tidak diketahui'}</div>
                        <div className="text-[10px] text-gray-400">ID: {log.guru_id?.substring(0, 8) || '-'}...</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Aksi',
            accessorKey: 'action' as keyof KkaLog,
            className: 'w-32',
            cell: (log: KkaLog) => getActionBadge(log.action)
        },
        {
            header: 'Tabel',
            accessorKey: 'table_name' as keyof KkaLog,
            className: 'w-40',
            cell: (log: KkaLog) => (
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-gray-400" />
                    {log.table_name}
                </span>
            )
        },
        {
            header: 'Deskripsi',
            accessorKey: 'description' as keyof KkaLog,
            cell: (log: KkaLog) => (
                <span className="text-sm text-gray-600 truncate block max-w-xs" title={log.description}>
                    {log.description || '-'}
                </span>
            )
        }
    ];

    const filteredLogs = actionFilter === 'ALL' 
        ? logs 
        : logs.filter(log => log.action.startsWith(actionFilter));

    const filteredKkaLogs = kkaActionFilter === 'ALL' 
        ? kkaLogs 
        : kkaLogs.filter(log => log.action.startsWith(kkaActionFilter));

    return (
        <div className="space-y-6">
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('system')}
                    className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'system'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Aktivitas Sistem
                </button>
                <button
                    onClick={() => setActiveTab('kka')}
                    className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'kka'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Aktivitas KKA
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
                {activeTab === 'system' ? (
                    <>
                        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Riwayat Sistem</h2>
                                <p className="text-sm text-gray-500">Daftar semua tindakan administratif yang terekam.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Filter Aksi:</label>
                                <select 
                                    value={actionFilter} 
                                    onChange={(e) => setActionFilter(e.target.value)}
                                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="ALL">Semua Aksi</option>
                                    <option value="CREATE">CREATE (Tambah)</option>
                                    <option value="UPDATE">UPDATE (Ubah)</option>
                                    <option value="DELETE">DELETE (Hapus)</option>
                                    <option value="LOGIN">LOGIN</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Memuat log aktivitas...</div>
                        ) : (
                            <DataTable
                                data={filteredLogs}
                                columns={columns}
                                searchKeys={['user_name', 'action', 'target']}
                                pageSize={15}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Log Aktivitas KKA</h2>
                                <p className="text-sm text-gray-500">Riwayat perubahan data pada tabel-tabel KKA.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Filter Aksi:</label>
                                <select 
                                    value={kkaActionFilter} 
                                    onChange={(e) => setKkaActionFilter(e.target.value)}
                                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="ALL">Semua Aksi</option>
                                    <option value="INSERT">INSERT (Tambah)</option>
                                    <option value="UPDATE">UPDATE (Ubah)</option>
                                    <option value="DELETE">DELETE (Hapus)</option>
                                </select>
                            </div>
                        </div>

                        {loadingKka ? (
                            <div className="p-8 text-center text-gray-500">Memuat log KKA...</div>
                        ) : (
                            <DataTable
                                data={filteredKkaLogs}
                                columns={kkaColumns}
                                searchKeys={['guru_name', 'action', 'table_name', 'description']}
                                pageSize={15}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
