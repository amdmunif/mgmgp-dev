import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { contentManagementService } from '../../../services/contentManagementService';
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle, XCircle, Trash2, Printer, QrCode, X, MonitorPlay, Trophy, UserCheck, UserMinus, Search, FileSpreadsheet, Download, School, FileText, Clock, Eye, Phone, Copy, Check, ExternalLink, AlertCircle, Banknote } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api, getFileUrl } from '../../../lib/api';
import { lmsService } from '../../../services/lmsService';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/button';
import { exportEventParticipantsExcel } from '../../../utils/exportEventParticipantsExcel';
import { ParticipantActivityModal } from '../../../components/admin/ParticipantActivityModal';

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
    no_hp?: string;
    status_kepegawaian?: string;
    pendidikan_terakhir?: string;
    role?: string;
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
    const { user } = useOutletContext<{ user?: any }>() || {};
    const navigate = useNavigate();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<'all' | 'attended' | 'not_attended' | 'passed' | 'not_passed' | 'waiting_payment' | 'paid' | 'unpaid'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showQR, setShowQR] = useState(false);
    const [selectedQRDay, setSelectedQRDay] = useState<number>(1);
    const [activityModalOpen, setActivityModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'participants' | 'attendances' | 'leaderboard' | 'activity'>('participants');
    const [attendancesMatrix, setAttendancesMatrix] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any>(null);
    const [activityMatrix, setActivityMatrix] = useState<any>(null);
    const [loadingTabs, setLoadingTabs] = useState({
        attendances: false,
        leaderboard: false,
        activity: false
    });
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);
    const [copiedPhone, setCopiedPhone] = useState(false);
    const uniqueSchoolCount = useMemo(() => {
        const set = new Set(participants.map(p => p.asal_sekolah?.trim()).filter(Boolean));
        return set.size;
    }, [participants]);

    const isPaidEvent = useMemo(() => {
        return Number(event?.is_paid) === 1 || participants.some(p => Boolean(p.payment_proof_url) || (Boolean(p.payment_status) && p.payment_status !== 'free'));
    }, [event?.is_paid, participants]);

    const pendingPaymentsCount = useMemo(() => {
        return participants.filter(p => p.payment_status === 'waiting_confirmation' || (p.payment_status === 'pending' && Boolean(p.payment_proof_url))).length;
    }, [participants]);

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

    useEffect(() => {
        if (!id) return;
        
        if (activeTab === 'attendances' && !attendancesMatrix && !loadingTabs.attendances) {
            loadAttendances();
        } else if (activeTab === 'leaderboard' && !leaderboard && !loadingTabs.leaderboard) {
            loadLeaderboard();
        } else if (activeTab === 'activity' && !activityMatrix && !loadingTabs.activity) {
            loadActivityMatrix();
        }
    }, [activeTab, id]);

    const loadAttendances = async () => {
        setLoadingTabs(prev => ({ ...prev, attendances: true }));
        try {
            const data = await lmsService.getEventAttendancesMatrix(id!);
            setAttendancesMatrix(data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data absensi');
        } finally {
            setLoadingTabs(prev => ({ ...prev, attendances: false }));
        }
    };

    const loadLeaderboard = async () => {
        setLoadingTabs(prev => ({ ...prev, leaderboard: true }));
        try {
            const data = await lmsService.getEventLeaderboard(id!);
            setLeaderboard(data.leaderboard);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat leaderboard');
        } finally {
            setLoadingTabs(prev => ({ ...prev, leaderboard: false }));
        }
    };

    const loadActivityMatrix = async () => {
        setLoadingTabs(prev => ({ ...prev, activity: true }));
        try {
            const data = await lmsService.getEventActivityMatrix(id!);
            setActivityMatrix(data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat matriks aktivitas');
        } finally {
            setLoadingTabs(prev => ({ ...prev, activity: false }));
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
            setViewingParticipant(prev => (prev && prev.user_id === userId)
                ? { ...prev, status: newStatus, is_hadir: !isAttended ? 1 : 0, attendance_count: !isAttended ? (event?.total_days || 1) : 0 }
                : prev
            );
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
            setViewingParticipant(prev => (prev && prev.user_id === userId)
                ? { ...prev, is_passed: newPassedStatus }
                : prev
            );
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
            setViewingParticipant(prev => (prev && prev.user_id === userId)
                ? { ...prev, payment_status: newStatus }
                : prev
            );
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
            if (viewingParticipant && viewingParticipant.user_id === userId) {
                setViewingParticipant(null);
            }
            toast.success('Peserta berhasil dihapus');
        } catch (error) {
            toast.error('Gagal menghapus peserta');
        }
    };

    const handleDayAttendance = async (userId: string, day: number, status: 'attend' | 'unattend') => {
        if (!id) return;
        try {
            await contentManagementService.markParticipantAttendanceDay(id, userId, day, status);
            toast.success(status === 'attend' ? `Absensi Hari ${day} berhasil ditambahkan` : `Absensi Hari ${day} dibatalkan`);
            
            // Optimistic update for matrix
            setAttendancesMatrix((prev: any) => {
                if (!prev) return prev;
                const newMatrix = JSON.parse(JSON.stringify(prev));
                if (!newMatrix.attendances[userId]) {
                    newMatrix.attendances[userId] = {};
                }
                if (status === 'attend') {
                    newMatrix.attendances[userId][`day_${day}`] = '08:00'; // Manual time display
                } else {
                    delete newMatrix.attendances[userId][`day_${day}`];
                }
                return newMatrix;
            });
            
            // Sync with main participants list if needed, but not strictly necessary as matrix is its own tab
        } catch (error) {
            toast.error('Gagal mengupdate absensi hari ini');
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

    const formatCompactDate = (dateString: string) => {
        if (!dateString) return { datePart: '-', timePart: '-' };
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return { datePart: '-', timePart: '-' };
        const datePart = d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const timePart = d.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace('.', ':');
        return { datePart, timePart };
    };

    const handleExportExcel = () => {
        if (!event) return;
        if (processedParticipants.length === 0) {
            return toast.error('Tidak ada data peserta untuk diekspor');
        }

        try {
            exportEventParticipantsExcel(event, processedParticipants, {
                filterStatus
            });
            toast.success(`Berhasil mengunduh ${processedParticipants.length} data peserta`);
        } catch (error) {
            console.error('Error exporting participants:', error);
            toast.error(error instanceof Error ? error.message : 'Gagal mengekspor data peserta');
        }
    };

    const fallbackCopy = (text: string, name?: string) => {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedPhone(true);
            setTimeout(() => setCopiedPhone(false), 2000);
            toast.success(name ? `Nomor HP ${name} disalin!` : 'Nomor HP disalin!');
        } catch {
            toast.error('Gagal menyalin nomor HP');
        }
    };

    const copyPhoneNumber = (phone: string, name?: string) => {
        if (!phone) {
            toast.error('Nomor HP belum tersedia untuk peserta ini');
            return;
        }
        const cleanNumber = phone.trim();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(cleanNumber)
                .then(() => {
                    setCopiedPhone(true);
                    setTimeout(() => setCopiedPhone(false), 2000);
                    toast.success(name ? `Nomor HP ${name} disalin!` : 'Nomor HP disalin!');
                })
                .catch(() => {
                    fallbackCopy(cleanNumber, name);
                });
        } else {
            fallbackCopy(cleanNumber, name);
        }
    };

    const formatWhatsAppUrl = (phone?: string) => {
        if (!phone) return null;
        let cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        } else if (cleaned.startsWith('8')) {
            cleaned = '62' + cleaned;
        }
        return `https://wa.me/${cleaned}`;
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
        } else if (filterStatus === 'waiting_payment') {
            result = result.filter(p => p.payment_status === 'waiting_confirmation' || (p.payment_status === 'pending' && Boolean(p.payment_proof_url)));
        } else if (filterStatus === 'paid') {
            result = result.filter(p => p.payment_status === 'confirmed');
        } else if (filterStatus === 'unpaid') {
            result = result.filter(p => p.payment_status === 'pending' && !p.payment_proof_url);
        }

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => 
                (p.nama && p.nama.toLowerCase().includes(query)) ||
                (p.email && p.email.toLowerCase().includes(query)) ||
                (p.asal_sekolah && p.asal_sekolah.toLowerCase().includes(query)) ||
                (p.no_hp && p.no_hp.toLowerCase().includes(query))
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
                    <button
                        type="button"
                        onClick={() => setViewingParticipant(item)}
                        className="flex-shrink-0 h-9 w-9 text-left focus:outline-none group relative"
                        title="Klik untuk lihat detail peserta"
                    >
                        {item.foto_profile ? (
                            <img className="h-9 w-9 rounded-full object-cover border border-gray-200 group-hover:ring-2 group-hover:ring-blue-400 transition-all" src={getFileUrl(item.foto_profile)} alt="" />
                        ) : (
                            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs group-hover:bg-blue-200 transition-colors">
                                {item.nama.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </button>
                    <div className="ml-3 min-w-0">
                        <div>
                            <button
                                type="button"
                                onClick={() => setViewingParticipant(item)}
                                className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left"
                                title="Klik untuk lihat detail peserta"
                            >
                                {item.nama}
                            </button>
                        </div>
                        <div className="text-xs text-gray-500">{item.email}</div>
                        {item.asal_sekolah && <div className="text-xs text-blue-600 mt-0.5 font-medium">{item.asal_sekolah}</div>}
                        {item.no_hp && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-800 mt-1 bg-emerald-50 px-2 py-0.5 rounded w-fit border border-emerald-100">
                                <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="font-mono text-[11px]">{item.no_hp}</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyPhoneNumber(item.no_hp!, item.nama);
                                    }}
                                    className="p-0.5 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-200/50 rounded transition-colors"
                                    title={`Salin No. HP (${item.no_hp})`}
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: "Waktu Daftar",
            accessorKey: "registered_at" as keyof Participant,
            cell: (item: Participant) => {
                const { datePart, timePart } = formatCompactDate(item.registered_at);
                return (
                    <div className="text-xs text-gray-600 whitespace-nowrap">
                        <div className="font-medium text-gray-800">{datePart}</div>
                        <div className="text-gray-400 text-[11px]">{timePart} WIB</div>
                    </div>
                );
            },
            className: "whitespace-nowrap hidden sm:table-cell"
        },
        {
            header: "Kehadiran & Status",
            accessorKey: "attendance_count" as keyof Participant,
            cell: (item: Participant) => {
                const count = item.attendance_count || 0;
                const total = event?.total_days || 1;
                const isManual = Number(item.is_hadir) === 1;
                const isPassed = Number(item.is_passed) === 1;
                return (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                            {count} / {total} Hari
                        </span>
                        {isManual && <span className="text-[10px] text-green-600 font-medium">(Hadir Manual)</span>}
                        <span className={`px-2.5 py-0.5 inline-flex text-[11px] leading-4 font-semibold rounded-full whitespace-nowrap ${isPassed
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            {isPassed ? '✓ Lulus' : 'Belum Lulus'}
                        </span>
                    </div>
                );
            },
            className: "text-center whitespace-nowrap"
        },
        isPaidEvent ? {
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
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${color}`}>
                            {label}
                        </span>
                        {item.payment_proof_url && (
                            <a 
                                href={getFileUrl(item.payment_proof_url)} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium whitespace-nowrap"
                            >
                                <ExternalLink className="w-3 h-3" /> Lihat Bukti
                            </a>
                        )}
                    </div>
                );
            },
            className: "text-center whitespace-nowrap"
        } : null,
        event?.has_lms ? {
            header: "LMS",
            accessorKey: "lms_score",
            cell: (item: Participant) => (
                <div className="flex flex-col items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                        Skor: {item.lms_score !== null && item.lms_score !== undefined ? Number(item.lms_score).toFixed(1) : '-'}
                    </span>
                    <button
                        onClick={() => handleLmsApproveUpdate(item.user_id, item.is_approved)}
                        className={`px-2 py-0.5 inline-flex text-[10px] leading-4 font-bold rounded transition-colors whitespace-nowrap ${Number(item.is_approved) === 1
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                            }`}
                        title="Klik untuk mengubah akses LMS"
                    >
                        {Number(item.is_approved) === 1 ? 'Akses LMS: ON' : 'Akses LMS: OFF'}
                    </button>
                </div>
            ),
            className: "text-center whitespace-nowrap"
        } : null,
        {
            header: "Aksi",
            cell: (item: Participant) => {
                const isPresent = Number(item.is_hadir) === 1;
                return (
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="flex justify-center items-center gap-1.5 whitespace-nowrap">
                            <button
                                onClick={() => handleStatusUpdate(item.user_id, Number(item.is_hadir))}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${isPresent
                                    ? 'text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                    : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                    }`}
                                title={isPresent ? "Batalkan Kehadiran Manual" : "Tandai Hadir Penuh"}
                            >
                                {isPresent ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                <span>{isPresent ? 'Batal' : 'Absen'}</span>
                            </button>
                            <button
                                onClick={() => handlePassedUpdate(item.user_id, item.is_passed)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${Number(item.is_passed) === 1
                                    ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                    : 'text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                title="Tandai Lulus / Tidak Lulus"
                            >
                                <Trophy className="w-3.5 h-3.5" />
                                <span>{Number(item.is_passed) === 1 ? 'Lulus' : 'Tdk Lulus'}</span>
                            </button>
                            <button
                                onClick={() => handleDeleteParticipant(item.user_id, item.nama)}
                                className="inline-flex items-center justify-center p-1.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors"
                                title={`Hapus ${item.nama}`}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        {event?.has_lms && (
                            <button
                                onClick={() => {
                                    setSelectedParticipant(item);
                                    setActivityModalOpen(true);
                                }}
                                className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors w-full"
                                title="Lihat Detail Aktivitas LMS"
                            >
                                Detail Aktivitas
                            </button>
                        )}
                        {isPaidEvent && (item.payment_status === 'waiting_confirmation' || (item.payment_status === 'pending' && Boolean(item.payment_proof_url))) && (
                            <div className="flex justify-center gap-1.5 w-full">
                                <button
                                    onClick={() => handlePaymentUpdate(item.user_id, 'confirm-payment')}
                                    className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-600 text-white hover:bg-green-700 shadow-sm transition-colors flex-1"
                                    title="Terima dan konfirmasi pembayaran"
                                >
                                    <Check className="w-3 h-3" /> Terima
                                </button>
                                <button
                                    onClick={() => handlePaymentUpdate(item.user_id, 'reject-payment')}
                                    className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors flex-1"
                                    title="Tolak bukti pembayaran"
                                >
                                    <X className="w-3 h-3" /> Tolak
                                </button>
                            </div>
                        )}
                    </div>
                );
            },
            className: "text-center whitespace-nowrap"
        }
    ].filter(Boolean) as any[];
    return cols;
    }, [participants, selectedIds, event, isPaidEvent]);

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
                                <span className="flex items-center gap-1.5 text-emerald-700">
                                    <School className="w-4 h-4 text-emerald-600" />
                                    <strong>{uniqueSchoolCount}</strong> Sekolah Terdaftar
                                </span>
                                {pendingPaymentsCount > 0 && (
                                    <span 
                                        onClick={() => setFilterStatus(filterStatus === 'waiting_payment' ? 'all' : 'waiting_payment')}
                                        className="flex items-center gap-1.5 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full cursor-pointer transition-colors text-xs font-bold animate-pulse"
                                        title="Klik untuk memfilter peserta yang butuh konfirmasi bukti bayar"
                                    >
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                        <strong>{pendingPaymentsCount}</strong> Butuh Verifikasi Bayar
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Buttons on the Right */}
                    <div className="flex flex-wrap items-center gap-2 pl-12 xl:pl-0 shrink-0">
                        <Button 
                            onClick={() => navigate(`/admin/events/${id}/coverage`)}
                            variant="outline"
                            size="sm"
                            className="border-emerald-300 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 shadow-sm h-9 font-medium"
                            title="Buka halaman analisis pemerataan sekolah: lihat sekolah mana yang sudah vs belum mendaftar"
                        >
                            <School className="w-4 h-4 mr-2 text-emerald-600" />
                            Pemerataan Sekolah
                        </Button>
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
                        <Button 
                            onClick={handleExportExcel}
                            variant="outline"
                            size="sm"
                            className="border-emerald-300 text-emerald-700 bg-emerald-50/40 hover:bg-emerald-100/60 shadow-sm h-9"
                            title="Download data peserta ke format Excel resmi"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                            Download Peserta (.xlsx)
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

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('participants')}
                    className={`py-3 px-6 text-sm font-medium border-b-2 outline-none transition-colors ${
                        activeTab === 'participants'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <Users className="w-4 h-4 inline-block mr-2" />
                    Peserta Terdaftar
                </button>
                <button
                    onClick={() => setActiveTab('attendances')}
                    className={`py-3 px-6 text-sm font-medium border-b-2 outline-none transition-colors ${
                        activeTab === 'attendances'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <Calendar className="w-4 h-4 inline-block mr-2" />
                    Detail Absensi
                </button>
                {!!event?.has_lms && (user?.role === 'Admin' || user?.role === 'Super Admin') && (
                    <>
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`py-3 px-6 text-sm font-medium border-b-2 outline-none transition-colors ${
                                activeTab === 'leaderboard'
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Trophy className="w-4 h-4 inline-block mr-2" />
                            Peserta Terbaik
                        </button>
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`py-3 px-6 text-sm font-medium border-b-2 outline-none transition-colors ${
                                activeTab === 'activity'
                                    ? 'border-orange-600 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <FileText className="w-4 h-4 inline-block mr-2" />
                            Laporan Aktivitas
                        </button>
                    </>
                )}
            </div>

            {/* Main Content Area */}
            {activeTab === 'participants' && (
            <div className="space-y-4">
                {pendingPaymentsCount > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-amber-950 text-sm">
                                    {pendingPaymentsCount} Peserta Menunggu Konfirmasi Pembayaran
                                </p>
                                <p className="text-xs text-amber-800">
                                    Peserta telah mengunggah bukti pembayaran/transfer dan menunggu verifikasi admin.
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => setFilterStatus(filterStatus === 'waiting_payment' ? 'all' : 'waiting_payment')}
                            className={`shrink-0 text-xs font-semibold ${
                                filterStatus === 'waiting_payment'
                                    ? 'bg-amber-800 text-white hover:bg-amber-900'
                                    : 'bg-amber-600 text-white hover:bg-amber-700'
                            }`}
                        >
                            {filterStatus === 'waiting_payment' ? 'Tampilkan Semua' : 'Filter Peserta Menunggu'}
                        </Button>
                    </div>
                )}

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
                                {isPaidEvent && (
                                    <>
                                        <option value="waiting_payment">⚠️ Menunggu Konfirmasi Bayar {pendingPaymentsCount > 0 ? `(${pendingPaymentsCount})` : ''}</option>
                                        <option value="paid">Pembayaran Lunas</option>
                                        <option value="unpaid">Belum Bayar</option>
                                    </>
                                )}
                                <option value="passed">Lulus</option>
                                <option value="not_passed">Belum Lulus</option>
                                <option value="attended">Hadir (Selesai Hari)</option>
                                <option value="not_attended">Belum Hadir</option>
                            </select>

                            <Button
                                size="sm"
                                onClick={handleExportExcel}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9"
                                title="Download daftar peserta saat ini ke format Excel yang rapi"
                            >
                                <Download className="w-4 h-4 mr-1.5" />
                                Export Excel
                            </Button>

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
                        dense={true}
                    />
                </div>
            </div>
            )}

            {activeTab === 'attendances' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        Matriks Detail Absensi
                    </h2>
                    {loadingTabs.attendances ? (
                        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                    ) : attendancesMatrix ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 rounded-tl-lg whitespace-nowrap bg-gray-100 sticky left-0 z-10">Nama Peserta</th>
                                        <th className="px-6 py-3 border-l border-gray-200">Asal Sekolah</th>
                                        {attendancesMatrix.columns.map((col: any) => (
                                            <th key={col.day} className="px-6 py-3 border-l border-gray-200 text-center">{col.title}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendancesMatrix.participants.map((p: any) => (
                                        <tr key={p.user_id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900 bg-white sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10">
                                                {p.user_name}
                                            </td>
                                            <td className="px-6 py-4 border-l border-gray-100 text-gray-500 whitespace-nowrap">
                                                {p.asal_sekolah || '-'}
                                            </td>
                                            {attendancesMatrix.columns.map((col: any) => {
                                                const time = attendancesMatrix.attendances[p.user_id]?.[`day_${col.day}`];
                                                return (
                                                    <td key={col.day} className="px-6 py-4 border-l border-gray-100 text-center">
                                                        {time ? (
                                                            <button 
                                                                onClick={() => handleDayAttendance(p.user_id, col.day, 'unattend')}
                                                                className="inline-flex items-center gap-1 text-green-600 font-medium hover:text-red-500 transition-colors"
                                                                title="Klik untuk membatalkan absensi hari ini"
                                                            >
                                                                <CheckCircle className="w-3 h-3" /> {time}
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleDayAttendance(p.user_id, col.day, 'attend')}
                                                                className="text-gray-300 hover:text-green-500 transition-colors"
                                                                title="Klik untuk menandai hadir (manual)"
                                                            >
                                                                <CheckCircle className="w-4 h-4 mx-auto" />
                                                            </button>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">Tidak ada data absensi</p>
                    )}
                </div>
            )}

            {activeTab === 'leaderboard' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                        <Trophy className="w-5 h-5 text-purple-600" />
                        Leaderboard Peserta Terbaik
                    </h2>
                    {loadingTabs.leaderboard ? (
                        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
                    ) : leaderboard ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-purple-50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Peringkat</th>
                                        <th className="px-4 py-3">Peserta</th>
                                        <th className="px-4 py-3 text-center">Tugas</th>
                                        <th className="px-4 py-3 text-center">Kuis</th>
                                        <th className="px-4 py-3 text-center">Hadir</th>
                                        <th className="px-4 py-3 text-center" title="Proyek Akhir">Proyek</th>
                                        <th className="px-4 py-3 text-center">Keaktifan</th>
                                        <th className="px-4 py-3 text-center">Bonus</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                        <th className="px-4 py-3 rounded-tr-lg text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((u: any, index: number) => (
                                        <tr key={u.user_id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-4 text-center font-bold text-lg">
                                                {index === 0 && <Trophy className="w-6 h-6 text-yellow-500 inline-block" />}
                                                {index === 1 && <Trophy className="w-6 h-6 text-gray-400 inline-block" />}
                                                {index === 2 && <Trophy className="w-6 h-6 text-amber-600 inline-block" />}
                                                {index > 2 && <span className="text-gray-500">{index + 1}</span>}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    {u.foto_profile ? (
                                                        <img src={getFileUrl(u.foto_profile)} className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                            {u.user_name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-gray-900">{u.user_name}</div>
                                                        <div className="text-[10px] text-gray-500">{u.asal_sekolah || '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center font-medium">{u.assignment_score ?? '-'}</td>
                                            <td className="px-4 py-4 text-center font-medium">{u.quiz_score ?? '-'}</td>
                                            <td className="px-4 py-4 text-center font-medium">{u.attendance_bonus ?? '-'}</td>
                                            <td className="px-4 py-4 text-center font-medium text-indigo-600">{u.final_task_score ?? '-'}</td>
                                            <td className="px-4 py-4 text-center font-medium text-emerald-600">{u.activeness_score ?? '-'}</td>
                                            <td className="px-4 py-4 text-center font-medium text-orange-500">{(u.on_time_bonus || 0) + (u.likes_bonus || 0) > 0 ? `+${(u.on_time_bonus || 0) + (u.likes_bonus || 0)}` : '-'}</td>
                                            <td className="px-4 py-4 text-right font-bold text-purple-600 text-lg">
                                                {u.total_score}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedParticipant(u);
                                                        setActivityModalOpen(true);
                                                    }}
                                                >
                                                    Detail
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">Belum ada data leaderboard</p>
                    )}
                </div>
            )}

            {/* Activity Matrix Content Area */}
            {activeTab === 'activity' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                        <FileText className="w-5 h-5 text-orange-600" />
                        Laporan Aktivitas Peserta
                    </h2>
                    {loadingTabs.activity ? (
                        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>
                    ) : activityMatrix?.participants?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 rounded-tl-lg whitespace-nowrap bg-gray-100 sticky left-0 z-10">Nama Peserta</th>
                                        <th className="px-6 py-3 border-l border-gray-200">Asal Sekolah</th>
                                        {activityMatrix.columns?.map((col: any) => (
                                            <th key={col.id} className="px-6 py-3 border-l border-gray-200 text-center max-w-[150px]" title={col.title}>
                                                <div className="text-[10px] text-gray-400 font-normal uppercase">{col.item_type === 'quiz' ? 'Kuis' : (col.item_type === 'assignment' ? 'Tugas' : 'Materi')}</div>
                                                <div className="truncate">{col.title}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityMatrix.participants?.map((p: any) => (
                                        <tr key={p.user_id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900 bg-white sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 whitespace-nowrap">
                                                {p.user_name}
                                            </td>
                                            <td className="px-6 py-4 border-l border-gray-100 text-gray-500 whitespace-nowrap">
                                                {p.asal_sekolah || '-'}
                                            </td>
                                            {activityMatrix.columns?.map((col: any) => {
                                                const prog = activityMatrix.progress[p.user_id]?.[col.id];
                                                const isCompleted = prog?.status === 'completed' || (col.item_type === 'quiz' && prog) || (col.item_type === 'assignment' && prog);
                                                return (
                                                    <td key={col.id} className="px-6 py-4 border-l border-gray-100 text-center">
                                                        {isCompleted ? (
                                                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">Belum ada data aktivitas</p>
                    )}
                </div>
            )}

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

            {activeTab === 'leaderboard' && activityModalOpen && selectedParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] flex flex-col">
                        <button 
                            onClick={() => setActivityModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        
                        <div className="mb-6 pb-4 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Rincian Aktivitas Leaderboard</h3>
                            <p className="text-sm text-gray-500 mt-1">Peserta: <span className="font-semibold text-gray-800">{(selectedParticipant as any).user_name}</span></p>
                        </div>

                        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                            {(selectedParticipant as any).activities?.map((act: any, idx: number) => (
                                <div key={idx} className="bg-gray-50 rounded-lg p-4 flex gap-4 items-start border border-gray-100">
                                    <div className={`p-2 rounded-lg shrink-0 ${
                                        act.type === 'Kuis' ? 'bg-blue-100 text-blue-600' :
                                        act.type === 'Tugas' ? 'bg-purple-100 text-purple-600' :
                                        'bg-green-100 text-green-600'
                                    }`}>
                                        {act.type === 'Kuis' && <CheckCircle className="w-5 h-5" />}
                                        {act.type === 'Tugas' && <FileText className="w-5 h-5" />}
                                        {act.type === 'Absensi' && <Calendar className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-semibold text-gray-900 truncate" title={act.title}>{act.title}</h4>
                                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 shrink-0">
                                                {new Date(act.date).toLocaleString('id-ID', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2 items-center text-sm">
                                            {act.type !== 'Absensi' && (
                                                <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-medium">Nilai: {act.score}</span>
                                            )}
                                            {act.bonus > 0 && (
                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                                                    <Trophy className="w-3 h-3" /> Bonus +{act.bonus} Poin
                                                </span>
                                            )}
                                            {act.deadline && (
                                                <span className="text-gray-500 text-xs flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Tenggat: {new Date(act.deadline).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!(selectedParticipant as any).activities?.length && (
                                <p className="text-gray-500 text-center py-8">Belum ada aktivitas yang tercatat</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'participants' && (
                <ParticipantActivityModal
                    isOpen={activityModalOpen}
                    onClose={() => setActivityModalOpen(false)}
                    eventId={id || ''}
                    userId={selectedParticipant?.user_id || ''}
                    userName={selectedParticipant?.nama || ''}
                />
            )}

            {/* Modal Detail Peserta (Cek Data & Copas No. HP) */}
            {viewingParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/70 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shadow-sm">
                                    <Eye className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Detail Peserta Event</h2>
                                    <p className="text-xs text-gray-500">Informasi profil dan data kontak peserta</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setViewingParticipant(null)} 
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors"
                                title="Tutup"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body Modal */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-5">
                            {/* Kartu Profil Peserta */}
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-slate-50 border border-blue-100">
                                <div className="w-16 h-16 rounded-full bg-white shadow-sm overflow-hidden border border-blue-200 shrink-0">
                                    {viewingParticipant.foto_profile ? (
                                        <img src={getFileUrl(viewingParticipant.foto_profile)} alt={viewingParticipant.nama} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-xl">
                                            {viewingParticipant.nama.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base font-bold text-gray-900 truncate">{viewingParticipant.nama}</h3>
                                    <p className="text-xs text-gray-600 truncate mt-0.5">{viewingParticipant.email}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {viewingParticipant.role && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
                                                {viewingParticipant.role}
                                            </span>
                                        )}
                                        {viewingParticipant.asal_sekolah && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 truncate max-w-full">
                                                {viewingParticipant.asal_sekolah}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* KARTU KONTAK & NO. HP / WHATSAPP (FOKUS UTAMA) */}
                            <div className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Phone className="w-4 h-4 text-emerald-600" />
                                        Nomor Handphone / WhatsApp
                                    </span>
                                    {viewingParticipant.no_hp && (
                                        <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                                            Terdaftar
                                        </span>
                                    )}
                                </div>

                                {viewingParticipant.no_hp ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                        <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-950 tracking-wider select-all">
                                            {viewingParticipant.no_hp}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => copyPhoneNumber(viewingParticipant.no_hp!, viewingParticipant.nama)}
                                                className={`h-9 px-3.5 text-xs font-medium shadow-sm transition-all ${
                                                    copiedPhone 
                                                        ? 'bg-emerald-700 text-white' 
                                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                }`}
                                                title="Salin nomor HP ke clipboard"
                                            >
                                                {copiedPhone ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                                                {copiedPhone ? 'Tersalin!' : 'Salin No. HP'}
                                            </Button>

                                            {formatWhatsAppUrl(viewingParticipant.no_hp) && (
                                                <a
                                                    href={formatWhatsAppUrl(viewingParticipant.no_hp)!}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center h-9 px-3.5 text-xs font-medium text-emerald-700 bg-white hover:bg-emerald-100/70 border border-emerald-300 rounded-lg shadow-sm transition-colors"
                                                    title="Buka chat WhatsApp di tab baru"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                                    Chat WA
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-500 italic py-1 bg-white/60 p-2.5 rounded border border-gray-200">
                                        Peserta belum mencantumkan nomor HP di akun profilnya.
                                    </div>
                                )}
                            </div>

                            {/* Informasi Detail Pendaftaran & Status */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rincian Kegiatan & Status</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="text-gray-500 mb-1">Waktu Pendaftaran</div>
                                        <div className="font-semibold text-gray-800">{formatDate(viewingParticipant.registered_at)}</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="text-gray-500 mb-1">Status Kepegawaian</div>
                                        <div className="font-semibold text-gray-800">{viewingParticipant.status_kepegawaian || '-'}</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="text-gray-500 mb-1">Pendidikan Terakhir</div>
                                        <div className="font-semibold text-gray-800">{viewingParticipant.pendidikan_terakhir || '-'}</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="text-gray-500 mb-1">Kehadiran</div>
                                        <div className="font-semibold text-gray-800 flex items-center justify-between">
                                            <span>
                                                {viewingParticipant.attendance_count || 0} / {event?.total_days || 1} Hari
                                                {Number(viewingParticipant.is_hadir) === 1 && (
                                                    <span className="ml-1 text-green-600 font-normal">(Hadir Manual)</span>
                                                )}
                                            </span>
                                            <button
                                                onClick={() => handleStatusUpdate(viewingParticipant.user_id, Number(viewingParticipant.is_hadir))}
                                                className="text-[11px] text-blue-600 hover:underline"
                                            >
                                                {Number(viewingParticipant.is_hadir) === 1 ? 'Batalkan' : 'Set Hadir'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="text-gray-500 mb-1">Status Kelulusan</div>
                                        <div className="flex items-center justify-between">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                                                Number(viewingParticipant.is_passed) === 1 
                                                    ? 'bg-blue-100 text-blue-800' 
                                                    : 'bg-gray-200 text-gray-700'
                                            }`}>
                                                {Number(viewingParticipant.is_passed) === 1 ? 'Lulus' : 'Belum Lulus'}
                                            </span>
                                            <button
                                                onClick={() => handlePassedUpdate(viewingParticipant.user_id, viewingParticipant.is_passed)}
                                                className="text-[11px] text-blue-600 hover:underline"
                                            >
                                                Ubah
                                            </button>
                                        </div>
                                    </div>
                                    {(isPaidEvent || viewingParticipant.payment_proof_url || (Boolean(viewingParticipant.payment_status) && viewingParticipant.payment_status !== 'free')) && (
                                        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 col-span-1 sm:col-span-2 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Banknote className="w-4 h-4 text-emerald-600" /> Informasi Pembayaran
                                                </span>
                                                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                                                    viewingParticipant.payment_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                    viewingParticipant.payment_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    viewingParticipant.payment_status === 'waiting_confirmation' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {viewingParticipant.payment_status === 'confirmed' ? 'Lunas' :
                                                     viewingParticipant.payment_status === 'rejected' ? 'Ditolak' :
                                                     viewingParticipant.payment_status === 'waiting_confirmation' ? 'Menunggu Konfirmasi' : 'Belum Bayar'}
                                                </span>
                                            </div>

                                            {viewingParticipant.payment_proof_url ? (
                                                <div className="space-y-2 pt-2 border-t border-gray-200/60">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-500 font-medium">Bukti Transfer:</span>
                                                        <a 
                                                            href={getFileUrl(viewingParticipant.payment_proof_url)} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" /> Buka Ukuran Penuh
                                                        </a>
                                                    </div>
                                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white max-h-56 flex items-center justify-center p-1">
                                                        <img 
                                                            src={getFileUrl(viewingParticipant.payment_proof_url)} 
                                                            alt="Bukti Transfer" 
                                                            className="object-contain max-h-52 w-full rounded cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => window.open(getFileUrl(viewingParticipant.payment_proof_url), '_blank')}
                                                        />
                                                    </div>
                                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                                                        {viewingParticipant.payment_status !== 'confirmed' && (
                                                            <button
                                                                onClick={() => handlePaymentUpdate(viewingParticipant.user_id, 'confirm-payment')}
                                                                className="px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                                                            >
                                                                <Check className="w-3.5 h-3.5" /> Terima Pembayaran
                                                            </button>
                                                        )}
                                                        {viewingParticipant.payment_status !== 'rejected' && (
                                                            <button
                                                                onClick={() => handlePaymentUpdate(viewingParticipant.user_id, 'reject-payment')}
                                                                className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                                                            >
                                                                <X className="w-3.5 h-3.5" /> Tolak
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-200/60">
                                                    <span className="italic">Belum ada file bukti transfer yang diunggah.</span>
                                                    {viewingParticipant.payment_status !== 'confirmed' && (
                                                        <button
                                                            onClick={() => handlePaymentUpdate(viewingParticipant.user_id, 'confirm-payment')}
                                                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                                        >
                                                            Tandai Lunas Manual
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {event?.has_lms && (
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 col-span-1 sm:col-span-2 flex items-center justify-between">
                                            <div>
                                                <div className="text-gray-500 mb-1">LMS / Nilai Rata-rata</div>
                                                <div className="font-bold text-gray-800">
                                                    {viewingParticipant.lms_score !== undefined && viewingParticipant.lms_score !== null 
                                                        ? Number(viewingParticipant.lms_score).toFixed(1) 
                                                        : '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                                    Number(viewingParticipant.is_approved) === 1 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    Akses LMS: {Number(viewingParticipant.is_approved) === 1 ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 px-6 border-t border-gray-100 bg-gray-50/80 shrink-0 flex items-center justify-between">
                            {viewingParticipant.no_hp ? (
                                <button
                                    onClick={() => copyPhoneNumber(viewingParticipant.no_hp!, viewingParticipant.nama)}
                                    className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 font-medium transition-colors"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Salin No. HP ({viewingParticipant.no_hp})</span>
                                </button>
                            ) : <div />}
                            <Button 
                                variant="outline"
                                onClick={() => setViewingParticipant(null)}
                                className="h-9 px-4 text-xs font-medium"
                            >
                                Tutup
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
