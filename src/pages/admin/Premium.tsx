import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { premiumService, type PremiumRequest } from '../../services/premiumService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function AdminPremium() {
    const [activeTab, setActiveTab] = useState<'requests' | 'active'>('requests');
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<PremiumRequest[]>([]);
    const [activeSubs, setActiveSubs] = useState<any[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'requests') loadRequests();
        else loadActive();
    }, [activeTab]);

    async function loadRequests() {
        setLoading(true);
        try {
            const data = await premiumService.getAllRequests();
            setRequests(data);
        } catch (error) {
            console.error('Failed to load requests', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadActive() {
        setLoading(true);
        try {
            const data = await premiumService.getActiveSubscribers();
            // Filter valid data only to prevent "Tanpa Nama" ghost rows
            setActiveSubs(data.filter((d: any) => d.id && d.email));
        } catch (error) {
            console.error('Failed to load active subs', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(request: PremiumRequest) {
        if (!confirm(`Setujui upgrade premium untuk ${request.profiles?.nama}?`)) return;

        setProcessingId(request.id);
        try {
            await premiumService.approveRequest(request.id);
            await loadRequests();
        } catch (error) {
            console.error('Error approving', error);
            alert('Gagal menyetujui');
        } finally {
            setProcessingId(null);
        }
    }

    async function handleReject(requestId: string) {
        const reason = prompt('Masukkan alasan penolakan:');
        if (!reason) return;

        setProcessingId(requestId);
        try {
            await premiumService.rejectRequest(requestId, reason);
            await loadRequests();
        } catch (error) {
            console.error('Error rejecting', error);
            alert('Gagal menolak');
        } finally {
            setProcessingId(null);
        }
    }

    async function handleExtend(userId: string, name: string) {
        if (!confirm(`Perpanjang langganan ${name} selama 1 tahun?`)) return;
        setProcessingId(userId);
        try {
            await premiumService.extendSubscription(userId);
            alert('Berhasil diperpanjang 1 tahun');
            loadActive();
        } catch (e) {
            alert('Gagal memperpanjang');
        } finally {
            setProcessingId(null);
        }
    }

    async function handleRevoke(userId: string, name: string) {
        if (!confirm(`Hapus langganan premium ${name}? User akan kembali ke status reguler.`)) return;
        setProcessingId(userId);
        try {
            await premiumService.revokeSubscription(userId);
            alert('Langganan dihapus');
            loadActive();
        } catch (e) {
            alert('Gagal menghapus langganan');
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Verifikasi Premium</h1>
                    <p className="text-gray-500">Kelola permintaan upgrade dan langganan aktif.</p>
                </div>
                <Button variant="outline" onClick={activeTab === 'requests' ? loadRequests : loadActive} disabled={loading} className="bg-white hover:bg-gray-50">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requests' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Permintaan Baru
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Langganan Aktif
                </button>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === 'requests' ? (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Tanggal</th>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Bank Pengirim</th>
                                    <th className="px-6 py-3">Bukti</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {format(new Date(req.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{req.profiles?.nama || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{req.bank_name}</div>
                                            <div className="text-xs text-gray-500">{req.account_number} (a.n. {req.account_holder})</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a
                                                href={req.proof_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-primary-600 hover:text-primary-800 hover:underline"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-1" /> Lihat Bukti
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={req.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {req.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        onClick={() => handleApprove(req)}
                                                        disabled={!!processingId}
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleReject(req.id)}
                                                        disabled={!!processingId}
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            Belum ada request premium.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Nama Anggota</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Premium Sampai</th>
                                    <th className="px-6 py-3">Sisa Waktu</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {Array.isArray(activeSubs) && activeSubs.map((sub) => {
                                    // Parse date more safely. Handle potential SQL '0000-00-00' or other quirks.
                                    let dateStr = sub.premium_until;
                                    // Make sure it doesn't fail on space vs T.
                                    if (typeof dateStr === 'string' && dateStr.includes(' ')) {
                                        dateStr = dateStr.replace(' ', 'T');
                                    }
                                    const date = dateStr ? new Date(dateStr) : new Date();
                                    const isValidDate = dateStr && !isNaN(date.getTime()) && date.getFullYear() > 2000;

                                    const daysLeft = isValidDate
                                        ? Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                        : 0;

                                    return (
                                        <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {sub.nama || <span className="text-gray-400 italic">Tanpa Nama</span>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {sub.email || <span className="text-gray-400 italic">No Email</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isValidDate ? format(date, 'd MMM yyyy', { locale: id }) : <span className="text-red-500 text-xs">Tanggal Invalid</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${daysLeft < 30 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {daysLeft} Hari
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleExtend(sub.id, sub.nama)} title="Perpanjang 1 Tahun">
                                                    +1 Tahun
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleRevoke(sub.id, sub.nama)} title="Hapus Langganan">
                                                    Hapus
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!Array.isArray(activeSubs) || activeSubs.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            Tidak ada langganan aktif.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
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
