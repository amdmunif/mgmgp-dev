import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { contributorService } from '../../../services/contributorService';
import type { ContributorApplication } from '../../../services/contributorService';
import { Button } from '../../../components/ui/button';
import { Check, X, Loader2, Eye, UserCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DataTable } from '../../../components/ui/DataTable';

export function VerificationList() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [applications, setApplications] = useState<ContributorApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Verifikasi Kontributor',
                description: 'Review dan kelola pendaftaran kontributor materi.',
                icon: <UserCheck className="w-6 h-6" />
            });
        }
        loadData();
    }, [setPageHeader]);

    const loadData = async () => {
        try {
            const data = await contributorService.getAllApplications();
            setApplications(data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data aplikasi');
        } finally {
            setLoading(false);
        }
    };

    const filteredApps = applications.filter(app => {
        if (filterStatus === 'All') return true;
        return app.status === filterStatus;
    });

    const handleVerify = async (id: number, status: 'approved' | 'rejected') => {
        if (!confirm(`Yakin ingin mengubah status menjadi ${status}?`)) return;
        setProcessing(id);
        try {
            await contributorService.verify(id, status);
            toast.success(`Aplikasi berhasil di-${status}`);
            loadData();
        } catch (error: any) {
            toast.error('Gagal memproses: ' + error.message);
        } finally {
            setProcessing(null);
        }
    };

    const columns = [
        {
            header: 'Nama / Email',
            accessorKey: 'nama' as keyof ContributorApplication,
            cell: (app: ContributorApplication) => (
                <div>
                    <p className="font-medium text-gray-900">{app.nama}</p>
                    <p className="text-sm text-gray-500">{app.email}</p>
                </div>
            )
        },
        {
            header: 'Tanggal Daftar',
            accessorKey: 'applied_at' as keyof ContributorApplication,
            cell: (app: ContributorApplication) => (
                <span className="text-gray-600">
                    {new Date(app.applied_at).toLocaleDateString()}
                </span>
            )
        },
        {
            header: 'Soal Dibuat',
            accessorKey: 'question_count' as keyof ContributorApplication,
            cell: (app: ContributorApplication) => (
                <p className="font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                    {app.question_count} Soal
                </p>
            )
        },
        {
            header: 'Status',
            accessorKey: 'status' as keyof ContributorApplication,
            cell: (app: ContributorApplication) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        app.status === 'approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                    }`}>
                    {app.status.toUpperCase()}
                </span>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right',
            cell: (app: ContributorApplication) => (
                <div className="flex justify-end gap-2 items-center">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:text-blue-600 p-0"
                        onClick={() => toast('Detail: ' + app.nama)}
                        title="Lihat Detail"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>

                    {app.status === 'pending' && (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200 h-8 px-2"
                                onClick={() => handleVerify(app.id, 'approved')}
                                disabled={processing === app.id}
                                title="Setujui"
                            >
                                {processing === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 h-8 px-2"
                                onClick={() => handleVerify(app.id, 'rejected')}
                                disabled={processing === app.id}
                                title="Tolak"
                            >
                                {processing === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            </Button>
                        </>
                    )}
                </div>
            )
        }
    ];

    const FilterContent = (
        <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            <option value="All">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
        </select>
    );

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
                <DataTable
                    data={filteredApps}
                    columns={columns}
                    searchKeys={['nama', 'email']}
                    pageSize={10}
                    filterContent={FilterContent}
                />
            </div>
        </div>
    );
}
