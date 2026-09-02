import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentManagementService } from '../../../services/contentManagementService';
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle, XCircle, Trash2, Printer, QrCode, X, MonitorPlay, Trophy, UserCheck, UserMinus, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api, getFileUrl } from '../../../lib/api';
import { lmsService } from '../../../services/lmsService';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/button';

interface Participant {
    user_id: string;
    nama: string;
    email: string;
    foto_profile: string | null;
    status: string;
    registered_at: string;
    is_hadir: number;
    is_passed?: number | boolean;
    attendance_count?: number;
    asal_sekolah?: string;
    payment_status?: string;
    payment_proof_url?: string;
    payment_date?: string;
    is_approved?: number | boolean;
    lms_score?: number | string;
}

interface EventDetail {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    image_url: string;
    is_registration_open: boolean;
    is_paid: boolean;
    has_lms?: boolean | number;
    total_days?: number;
    quota?: number;
}

export function AdminEventDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<'all' | 'attended' | 'not_attended' | 'passed' | 'not_passed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showQR, setShowQR] = useState(false);
    const [selectedQRDay, setSelectedQRDay] = useState<number>(1);

    useEffect(() => {
        if (id) {
            loadData(id);
        }
    }, [id]);

    const loadData = async (eventId: string) => {
        setLoading(true);
        try {
            const [eventData, participantsData] = await Promise.all([
                contentManagementService.getEventById(eventId),
                contentManagementService.getEventParticipants(eventId)
            ]);
            
            let mergedParticipants = participantsData;
            if (eventData && Number(eventData.has_lms) === 1) {
                try {
                    const gradebook = await lmsService.getEventGradebook(eventId);
                    const scoreMap = new Map(gradebook.participants?.map((p: any) => [p.user_id, p.average_score]));
                    mergedParticipants = participantsData.map((p: any) => ({
                        ...p,
                        lms_score: scoreMap.get(p.user_id)
                    }));
                } catch (e) {
                    console.error("Gagal mengambil nilai lms", e);
                }
            }
            
            setEvent(eventData as unknown as EventDetail);
            setParticipants(mergedParticipants);
        } catch (error) {
            console.error('Error loading event data:', error);
            toast.error('Gagal memuat data event');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (userId: string, currentIsHadir: number) => {
        if (!id) return;
        const isAttended = currentIsHadir === 1;
        const newStatus = isAttended ? 'registered' : 'attended';
        try {
            await contentManagementService.updateParticipantStatus(id, userId, newStatus);
            const updatedParticipants = participants.map(p =>
                p.user_id === userId
                    ? { ...p, status: newStatus, is_hadir: !isAttended ? 1 : 0, attendance_count: !isAttended ? (event?.total_days || 1) : 0 }
                    : p
            );
            setParticipants(updatedParticipants);
            toast.success(!isAttended ? 'Peserta ditandai hadir' : 'Absensi dibatalkan');
        } catch (error) {
            toast.error('Gagal memperbarui status');
        }
    };

    const handlePassedUpdate = async (userId: string, currentIsPassed: number | boolean | undefined) => {
        if (!id) return;
        const isPassed = Number(currentIsPassed) === 1;
        const newPassedStatus = isPassed ? 0 : 1;
        try {
            await api.put(`/events/${id}/participants/${userId}`, { is_passed: newPassedStatus });
            const updatedParticipants = participants.map(p =>
                p.user_id === userId
                    ? { ...p, is_passed: newPassedStatus }
                    : p
            );
            setParticipants(updatedParticipants);
            toast.success(!isPassed ? 'Peserta ditandai LULUS' : 'Kelulusan dibatalkan');
        } catch (error) {
            toast.error('Gagal memperbarui kelulusan');
        }
    };

    const handlePaymentUpdate = async (userId: string, action: 'confirm-payment' | 'reject-payment') => {
        if (!id) return;
        try {
            await contentManagementService.updateEventPayment(id, userId, action);
            const newStatus = action === 'confirm-payment' ? 'confirmed' : 'rejected';
            const updatedParticipants = participants.map(p =>
                p.user_id === userId
                    ? { ...p, payment_status: newStatus }
                    : p
            );
            setParticipants(updatedParticipants);
            toast.success(action === 'confirm-payment' ? 'Pembayaran dikonfirmasi' : 'Pembayaran ditolak');
        } catch (error) {
            toast.error('Gagal memperbarui status pembayaran');
        }
    };

    const handleBulkUpdate = async (status: string) => {
        if (!id || selectedIds.length === 0) return;
        if (!confirm(`Apakah Anda yakin ingin mengubah status ${selectedIds.length} peserta terpilih?`)) return;

        try {
            await contentManagementService.updateParticipantsBulk(id, selectedIds, status);
            toast.success('Status peserta berhasil diperbarui');

            // Optimistic update
            const isAttended = status === 'attended';
            const isPassed = status === 'passed';
            
            setParticipants(current => current.map(p => {
                if (selectedIds.includes(p.user_id)) {
                    if (status === 'passed' || status === 'not_passed') {
                        return { ...p, is_passed: isPassed ? 1 : 0 };
                    }
                    if (status === 'approve_lms' || status === 'revoke_lms') {
                        return { ...p, is_approved: status === 'approve_lms' ? 1 : 0 };
                    }
                    return { 
                        ...p, 
                        status: status, 
                        is_hadir: isAttended ? 1 : 0,
                        attendance_count: isAttended ? (event?.total_days || 1) : 0
                    };
                }
                return p;
            }));
            setSelectedIds([]); // Clear selection after action
        } catch (error) {
            console.error('Bulk update failed:', error);
            toast.error('Gagal memperbarui status peserta');
        }
    };

    const handleDeleteParticipant = async (userId: string, userName: string) => {
        if (!id) return;
        if (!confirm(`Apakah Anda yakin ingin menghapus peserta "${userName}" dari event ini?`)) return;

        try {
            await contentManagementService.deleteParticipant(id, userId);
            setParticipants(participants.filter(p => p.user_id !== userId));
            toast.success('Peserta berhasil dihapus');
        } catch (error) {
            toast.error('Gagal menghapus peserta');
        }
    };

    const handleLmsApproveUpdate = async (userId: string, currentStatus: number | boolean | undefined) => {
        if (!id) return;
        const newStatus = Number(currentStatus) === 1 ? 0 : 1;
        try {
            await api.post(`/events/${id}/approve-lms`, { user_id: userId, is_approved: newStatus });
            setParticipants(participants.map(p =>
                p.user_id === userId ? { ...p, is_approved: newStatus } : p
            ));
            toast.success(newStatus ? 'Akses LMS Diberikan' : 'Akses LMS Dicabut');
        } catch (error) {
            toast.error('Gagal memperbarui status akses LMS');
        }
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(processedParticipants.map(p => p.user_id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelectOne = (userId: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, userId]);
        } else {
            setSelectedIds(prev => prev.filter(id => id !== userId));
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const processedParticipants = useMemo(() => {
        let result = [...participants];

        // Filter
        if (filterStatus === 'attended') {
            result = result.filter(p => Number(p.is_hadir) === 1 || Number(p.attendance_count) > 0);
        } else if (filterStatus === 'not_attended') {
            result = result.filter(p => Number(p.is_hadir) === 0 && (!p.attendance_count || Number(p.attendance_count) === 0));
        } else if (filterStatus === 'passed') {
            result = result.filter(p => Number(p.is_passed) === 1);
        } else if (filterStatus === 'not_passed') {
            result = result.filter(p => Number(p.is_passed) === 0);
        }

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => 
                (p.nama && p.nama.toLowerCase().includes(query)) ||
                (p.email && p.email.toLowerCase().includes(query)) ||
                (p.asal_sekolah && p.asal_sekolah.toLowerCase().includes(query))
            );
        }

        // Sort by registered_at ascending (oldest first)
        result.sort((a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime());

        return result;
    }, [participants, filterStatus, searchQuery]);

    const columns = useMemo(() => {
        const cols = [
        {
            header: (
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={processedParticipants.length > 0 && selectedIds.length === processedParticipants.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                />
            ),
            cell: (item: Participant) => (
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedIds.includes(item.user_id)}
                    onChange={(e) => toggleSelectOne(item.user_id, e.target.checked)}
                />
            ),
            className: "w-10 text-center"
        },
        {
            header: "Peserta",
            accessorKey: "nama" as keyof Participant,
            cell: (item: Participant) => (
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        {item.foto_profile ? (
                            <img className="h-10 w-10 rounded-full object-cover border border-gray-200" src={getFileUrl(item.foto_profile)} alt="" />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                {item.nama.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.nama}</div>
                        <div className="text-xs text-gray-500">{item.email}</div>
                        {item.asal_sekolah && <div className="text-xs text-blue-600 mt-0.5">{item.asal_sekolah}</div>}
                    </div>
                </div>
            )
        },
        {
            header: "Waktu Daftar",
            accessorKey: "registered_at" as keyof Participant,
            cell: (item: Participant) => (
                <span className="text-sm text-gray-500">{formatDate(item.registered_at)}</span>
            ),
            className: "hidden sm:table-cell"
        },
        {
            header: "Kehadiran",
            accessorKey: "attendance_count" as keyof Participant,
            cell: (item: Participant) => {
                const count = item.attendance_count || 0;
                const total = event?.total_days || 1;
                const isManual = Number(item.is_hadir) === 1;
                return (
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-gray-700">{count} / {total} Hari</span>
                        {isManual && <span className="text-[10px] text-green-600">(Hadir Manual)</span>}
                    </div>
                );
            },
            className: "text-center"
        },
        {
            header: "Kelulusan",
            accessorKey: "is_passed" as keyof Participant,
            cell: (item: Participant) => {
                const isPassed = Number(item.is_passed) === 1;
                return (
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isPassed
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {isPassed ? 'Lulus' : 'Belum'}
                    </span>
                );
            },
            className: "text-center"
        },
        event?.is_paid ? {
            header: "Pembayaran",
            accessorKey: "payment_status" as keyof Participant,
            cell: (item: Participant) => {
                
                const statusMap: any = {
                    'free': { label: 'Gratis', color: 'bg-gray-100 text-gray-800' },
                    'pending': { label: 'Belum Bayar', color: 'bg-yellow-100 text-yellow-800' },
                    'waiting_confirmation': { label: 'Menunggu', color: 'bg-blue-100 text-blue-800' },
                    'confirmed': { label: 'Lunas', color: 'bg-green-100 text-green-800' },
                    'rejected': { label: 'Ditolak', color: 'bg-red-100 text-red-800' },
                };
                
                const status = item.payment_status || 'free';
                const { label, color } = statusMap[status] || statusMap['free'];
                
                return (
                    <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
                            {label}
                        </span>
                        {item.payment_proof_url && (
                            <a 
                                href={getFileUrl(item.payment_proof_url)} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Lihat Bukti
                            </a>
                        )}
                    </div>
                );
            },
            className: "text-center"
        } : null,
        event?.has_lms ? {
            header: "LMS",
            accessorKey: "lms_score",
            cell: (item: Participant) => (
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700">
                        Skor: {item.lms_score !== null && item.lms_score !== undefined ? Number(item.lms_score).toFixed(1) : '-'}
                    </span>
                    <button
                        onClick={() => handleLmsApproveUpdate(item.user_id, item.is_approved)}
                        className={`px-2 py-1 inline-flex text-[10px] leading-4 font-bold rounded-md transition-colors ${Number(item.is_approved) === 1
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                            }`}
                        title="Klik untuk mengubah akses LMS"
                    >
                        {Number(item.is_approved) === 1 ? 'Akses LMS: ON' : 'Akses LMS: OFF (Konfirmasi)'}
                    </button>
                </div>
            ),
            className: "text-center"
        } : null,
        {
            header: "Aksi",
            cell: (item: Participant) => {
                const isPresent = Number(item.is_hadir) === 1;
                return (
                    <>
                    <div className="flex justify-center">
                        <button
                            onClick={() => handleStatusUpdate(item.user_id, Number(item.is_hadir))}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${isPresent
                                ? 'text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                }`}
                            title={isPresent ? "Batalkan Kehadiran Manual" : "Tandai Hadir Penuh"}
                        >
                            {isPresent ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            {isPresent ? 'Batal' : 'Absen'}
                        </button>
                        <button
                            onClick={() => handlePassedUpdate(item.user_id, item.is_passed)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ml-2 ${Number(item.is_passed) === 1
                                ? 'text-green-700 bg-green-50 hover:bg-green-100'
                                : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                                }`}
                            title="Tandai Lulus / Tidak Lulus"
                        >
                            <Trophy className="w-3 h-3" />
                            {Number(item.is_passed) === 1 ? 'Lulus' : 'Tdk Lulus'}
                        </button>
                        <button
                            onClick={() => handleDeleteParticipant(item.user_id, item.nama)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 ml-2"
                            title="Hapus Peserta"
                        >
                            <Trash2 className="w-3 h-3" />
                            Hapus
                        </button>
                    </div>
                    {event?.is_paid && item.payment_status === 'waiting_confirmation' && (
                        <div className="flex justify-center mt-2 gap-2">
                            <button
                                onClick={() => handlePaymentUpdate(item.user_id, 'confirm-payment')}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-500 text-white hover:bg-green-600"
                            >
                                Terima
                            </button>
                            <button
                                onClick={() => handlePaymentUpdate(item.user_id, 'reject-payment')}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-500 text-white hover:bg-red-600"
                            >
                                Tolak
                            </button>
                        </div>
                    )}
                    </>
                );
            },
            className: "text-center"
        }
    ].filter(Boolean) as any[];
    return cols;
    }, [participants, selectedIds, event]);

    if (loading) return <div className="p-8 text-center">Memuat...</div>;
    if (!event) return <div className="p-8 text-center">Event tidak ditemukan</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                {/* Header & Stats - Minimalist Layout */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <button
                            onClick={() => navigate('/admin/events')}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors mt-0.5 shrink-0 text-gray-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{event.title}</h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    {formatDate(event.date)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-blue-500" />
                                    {event.location}
                                </span>
                                
                                {/* Inline Stats Divider */}
                                <span className="hidden sm:inline text-gray-300">|</span>
                                
                                {/* Inline Stats */}
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <strong>{participants.length}</strong> {event.quota ? `/ ${event.quota}` : ''} Peserta
                                </span>
                                <span className="flex items-center gap-1.5 text-green-600">
                                    <UserCheck className="w-4 h-4" />
                                    <strong>{participants.filter(p => Number(p.is_hadir) === 1 || Number(p.attendance_count) > 0).length}</strong> Hadir
                                </span>
                                <span className="flex items-center gap-1.5 text-red-600">
                                    <UserMinus className="w-4 h-4" />
                                    <strong>{participants.filter(p => Number(p.is_hadir) === 0 && (!p.attendance_count || Number(p.attendance_count) === 0)).length}</strong> Tidak Hadir
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Buttons on the Right */}
                    <div className="flex flex-wrap items-center gap-2 pl-12 xl:pl-0 shrink-0">
                        <Button 
                            onClick={() => navigate(`/admin/events/${id}/print-attendance`)}
                            variant="outline"
                            size="sm"
                            className="border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm h-9"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Cetak
                        </Button>
                        <Button 
                            onClick={() => setShowQR(true)}
                            variant="outline"
                            size="sm"
                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm h-9"
                        >
                            <QrCode className="w-4 h-4 mr-2" />
                            QR Absensi
                        </Button>
                        {!!event?.has_lms && (
                            <Button 
                                onClick={() => navigate(`/admin/events/${id}/lms`)}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm h-9"
                            >
                                <MonitorPlay className="w-4 h-4 mr-2" />
                                Kelola LMS
                            </Button>
                        )}
                    </div>
                </div>
            </div>


            {/* Participants List */}
            <div className="space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-row flex-wrap items-center justify-between gap-4 mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2 whitespace-nowrap">
                            <Users className="w-5 h-5 text-gray-600" />
                            Daftar Peserta
                        </h2>
                        <div className="flex flex-row flex-wrap items-center gap-3 justify-end">
                            <div className="relative flex-1 sm:flex-none sm:w-64">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama, email, sekolah..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="all">Semua Status</option>
                                <option value="passed">Lulus</option>
                                <option value="not_passed">Belum Lulus</option>
                                <option value="attended">Hadir (Selesai Hari)</option>
                                <option value="not_attended">Belum Hadir</option>
                            </select>

                            {selectedIds.length > 0 && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => handleBulkUpdate('passed')}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Tandai Lulus ({selectedIds.length})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-gray-600 border-gray-200 hover:bg-gray-50"
                                        onClick={() => handleBulkUpdate('not_passed')}
                                    >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Batal Lulus ({selectedIds.length})
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white ml-4"
                                        onClick={() => handleBulkUpdate('attended')}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Set Hadir ({selectedIds.length})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => handleBulkUpdate('registered')}
                                    >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Set Belum Hadir ({selectedIds.length})
                                    </Button>
                                    {!!event?.has_lms && (
                                        <>
                                            <Button
                                                size="sm"
                                                className="bg-purple-600 hover:bg-purple-700 text-white ml-4"
                                                onClick={() => handleBulkUpdate('approve_lms')}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Buka Akses LMS ({selectedIds.length})
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                                onClick={() => handleBulkUpdate('revoke_lms')}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Tutup Akses LMS ({selectedIds.length})
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={processedParticipants}
                        searchKeys={[]}
                        pageSize={10}
                    />
                </div>
            </div>

            {/* QR Code Modal */}
            {showQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative">
                        <button 
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        
                        <div className="text-center mt-2">
                            <h3 className="text-xl font-bold text-gray-900">QR Code Absensi</h3>
                            <p className="text-sm text-gray-500 mt-1 mb-4">Scan QR Code ini untuk melakukan absensi otomatis.</p>
                            
                            {(event?.total_days || 1) > 1 && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Hari:</label>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {Array.from({ length: event!.total_days || 1 }, (_, i) => i + 1).map(day => (
                                            <button
                                                key={day}
                                                onClick={() => setSelectedQRDay(day)}
                                                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                                    selectedQRDay === day
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                Hari {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="bg-gray-50 p-4 rounded-xl inline-block border border-gray-200">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/events/' + id + '/attend' + ((event?.total_days || 1) > 1 ? `?day=${selectedQRDay}` : ''))}`}
                                    alt={`QR Code Absensi Hari ${selectedQRDay}`}
                                    className="w-48 h-48 object-contain"
                                />
                            </div>
                            
                            <p className="text-xs text-blue-600 font-medium mt-6 break-all">
                                {window.location.origin}/events/{id}/attend{(event?.total_days || 1) > 1 ? `?day=${selectedQRDay}` : ''}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
