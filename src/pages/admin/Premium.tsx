import { useState, useEffect } from 'react';
import { premiumService, type PremiumRequest } from '../../services/premiumService';
import { Button } from '../../components/ui/button';
import { Check, X, Loader2, Image as ImageIcon } from 'lucide-react'; // Added Image icon
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
                </div>
            </div >
        </div >
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        approved: 'bg-green-100 text-green-800 border-green-200',
        rejected: 'bg-red-100 text-red-800 border-red-200'
    };

    const labels = {
        pending: 'Menunggu',
        approved: 'Disetujui',
        rejected: 'Ditolak'
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
            {labels[status as keyof typeof labels] || status}
        </span>
    );
}
