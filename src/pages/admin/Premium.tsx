import { useState, useEffect } from 'react';
import { premiumService, type PremiumRequest } from '../../services/premiumService';
import { Button } from '../../components/ui/button';
import { Check, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { DataTable } from '../../components/ui/DataTable';

export function AdminPremium() {
    const [requests, setRequests] = useState<PremiumRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await premiumService.getAllRequests();
            setRequests(data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, userId: string) => {
        if (!confirm('Setujui permintaan premium ini?')) return;
        setProcessingId(id);
        try {
            await premiumService.approveRequest(id, userId);
            toast.success('Permintaan disetujui');
            loadData();
        } catch (error) {
            toast.error('Gagal memproses');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Tolak permintaan ini?')) return;
        setProcessingId(id);
        try {
            await premiumService.rejectRequest(id);
            toast.success('Permintaan ditolak');
            loadData();
        } catch (error) {
            toast.error('Gagal memproses');
        } finally {
            setProcessingId(null);
        }
    };

    const columns = [
        {
            header: 'User',
            accessorKey: 'user_email' as keyof PremiumRequest,
            cell: (req: PremiumRequest) => (
                <div>
                    <div className="font-medium text-gray-900">{req.user_email}</div>
                </div>
            )
        },
        {
            header: 'Paket',
            accessorKey: 'plan' as keyof PremiumRequest,
            cell: (req: PremiumRequest) => <span className="font-medium text-purple-600">{req.plan}</span>
        },
        {
            header: 'Bukti',
            accessorKey: 'payment_proof_url' as keyof PremiumRequest,
            cell: (req: PremiumRequest) => (
                req.payment_proof_url ? (
                    <a href={req.payment_proof_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" /> Lihat
                    </a>
                ) : <span className="text-gray-400 text-xs">No Image</span>
            )
        },
        {
            header: 'Tanggal',
            accessorKey: 'created_at' as keyof PremiumRequest,
            cell: (req: PremiumRequest) => new Date(req.created_at).toLocaleDateString()
        },
        {
            header: 'Status',
            accessorKey: 'status' as keyof PremiumRequest,
            cell: (req: PremiumRequest) => (
                <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-semibold",
                    req.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                        req.status === 'approved' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}>
                    {req.status.toUpperCase()}
                </span>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right',
            cell: (req: PremiumRequest) => (
                req.status === 'pending' ? (
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200" onClick={() => handleApprove(req.id, req.user_id)} disabled={processingId === req.id}>
                            {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="outline" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200" onClick={() => handleReject(req.id)} disabled={processingId === req.id}>
                            {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </Button>
                    </div>
                ) : null
            )
        }
    ];

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Permintaan Premium</h1>
            <p className="text-gray-500">Kelola permintaan upgrade akun ke premium.</p>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
                <DataTable
                    data={requests}
                    columns={columns}
                    searchKeys={['user_email', 'status', 'plan']}
                    pageSize={10}
                />
            </div>
        </div>
    );
}
