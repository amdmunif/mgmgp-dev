import { useState, useEffect } from 'react';
import { premiumService, type PremiumRequest } from '../../services/premiumService';
import { Button } from '../../components/ui/button';
import { Check, X, Loader2, Image as ImageIcon, Crown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { DataTable } from '../../components/ui/DataTable';
import { useOutletContext } from 'react-router-dom';

export function AdminPremium() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [requests, setRequests] = useState<PremiumRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [viewData, setViewData] = useState<PremiumRequest | null>(null);
    const [editData, setEditData] = useState<PremiumRequest | null>(null);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Permintaan Premium',
                description: 'Kelola permintaan upgrade akun ke premium.',
                icon: <Crown className="w-6 h-6" />
            });
        }
    }, [setPageHeader]);

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

    const handleApprove = async (id: string, name: string) => {
        if (!confirm(`Setujui upgrade premium untuk ${name}?`)) return;
        setProcessingId(id);
        try {
            await premiumService.approveRequest(id);
            toast.success('Permintaan disetujui');
            loadData();
        } catch (error) {
            toast.error('Gagal memproses');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Alasan penolakan:');
        if (!reason) return;

        setProcessingId(id);
        try {
            await premiumService.rejectRequest(id, reason);
            toast.success('Permintaan ditolak');
            loadData();
        } catch (error) {
            toast.error('Gagal memproses');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
        try {
            await premiumService.deleteRequest(id);
            toast.success('Data berhasil dihapus');
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            toast.error('Gagal menghapus data');
        }
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editData) return;
        setProcessingId(editData.id);
        try {
            await premiumService.updateRequest(editData.id, editData);
            toast.success('Data berhasil diperbarui');
            setEditData(null);
            loadData();
        } catch (error) {
            toast.error('Gagal memperbarui data');
        } finally {
            setProcessingId(null);
        }
    };

    const columns = [
        {
            header: 'User / Bank',
            accessorKey: 'id' as keyof PremiumRequest,
            cell: (req: PremiumRequest) => (
                <div>
                    <div className="font-medium text-gray-900">{req.profiles?.nama || 'Unknown User'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {req.bank_name} - {req.account_number}
                        <br />
                        (a.n. {req.account_holder})
                    </div>
                </div>
            )
        },
        {
            header: 'Bukti',
            accessorKey: 'proof_url' as keyof PremiumRequest,
            cell: (req: PremiumRequest) => (
                req.proof_url ? (
                    <button onClick={() => setViewData(req)} className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" /> Lihat
                    </button>
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
                <div className="flex justify-end gap-2">
                    {req.status === 'pending' && (
                        <>
                            <Button size="sm" variant="outline" className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200" onClick={() => handleApprove(req.id, req.profiles?.nama || 'User')} disabled={processingId === req.id}>
                                {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </Button>
                            <Button size="sm" variant="outline" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200" onClick={() => handleReject(req.id)} disabled={processingId === req.id}>
                                {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            </Button>
                        </>
                    )}
                    <div className="relative group">
                        <Button size="sm" variant="outline">...</Button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block hover:block border border-gray-100">
                            <button onClick={() => setViewData(req)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Lihat Detail</button>
                            <button onClick={() => setEditData(req)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit Data</button>
                            <button onClick={() => handleDelete(req.id)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Hapus</button>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-6">
            <DataTable
                data={requests}
                columns={columns}
                searchKeys={['status']}
                pageSize={10}
            />

            {/* View Modal */}
            {viewData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-lg">Detail Permintaan</h3>
                            <button onClick={() => setViewData(null)}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Nama User</p>
                                    <p className="font-medium">{viewData.profiles?.nama}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className="font-medium">{viewData.status}</span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Bank</p>
                                    <p className="font-medium">{viewData.bank_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Nomor Rekening</p>
                                    <p className="font-medium">{viewData.account_number}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Atas Nama</p>
                                    <p className="font-medium">{viewData.account_holder}</p>
                                </div>
                                {viewData.notes && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500">Catatan/Alasan</p>
                                        <p className="font-medium text-red-600">{viewData.notes}</p>
                                    </div>
                                )}
                            </div>
                            {viewData.proof_url && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Bukti Pembayaran</p>
                                    <div className="rounded-lg overflow-hidden border border-gray-200">
                                        <img src={viewData.proof_url} alt="Proof" className="w-full object-contain max-h-[400px]" />
                                    </div>
                                    <div className="mt-2 text-right">
                                        <a href={viewData.proof_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                                            Buka gambar asli
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-lg">Edit Data</h3>
                            <button onClick={() => setEditData(null)}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleEditSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    value={editData.bank_name || ''}
                                    onChange={e => setEditData({ ...editData, bank_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    value={editData.account_number || ''}
                                    onChange={e => setEditData({ ...editData, account_number: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Atas Nama</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    value={editData.account_holder || ''}
                                    onChange={e => setEditData({ ...editData, account_holder: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setEditData(null)}>Batal</Button>
                                <Button type="submit" disabled={!!processingId}>Simpan</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
