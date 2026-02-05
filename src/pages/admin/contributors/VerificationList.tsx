import { useState, useEffect } from 'react';
import { contributorService, ContributorApplication } from '../../../services/contributorService';
import { Button } from '../../../components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function VerificationList() {
    const [applications, setApplications] = useState<ContributorApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

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

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Verifikasi Kontributor</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">Nama / Email</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Tanggal Daftar</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Soal Dibuat</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {applications.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    Belum ada aplikasi masuk.
                                </td>
                            </tr>
                        ) : (
                            applications.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900">{app.nama}</p>
                                        <p className="text-sm text-gray-500">{app.email}</p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {new Date(app.applied_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                            {app.question_count} Soal
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                            ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {app.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {app.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                                                    onClick={() => handleVerify(app.id, 'approved')}
                                                    disabled={processing === app.id}
                                                >
                                                    {processing === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                                    onClick={() => handleVerify(app.id, 'rejected')}
                                                    disabled={processing === app.id}
                                                >
                                                    {processing === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
