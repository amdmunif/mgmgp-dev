import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentManagementService } from '../../../services/contentManagementService';
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getFileUrl } from '../../../lib/api';
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
}

interface EventDetail {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    image_url: string;
    is_registration_open: boolean;
}

export function AdminEventDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
            setEvent(eventData as unknown as EventDetail);
            setParticipants(participantsData);
        } catch (error) {
            console.error('Error loading event data:', error);
            toast.error('Gagal memuat data event');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (userId: string, currentStatus: string) => {
        if (!id) return;
        const isAttended = currentStatus === 'attended';
        const newStatus = isAttended ? 'registered' : 'attended';
        try {
            await contentManagementService.updateParticipantStatus(id, userId, newStatus);
            const updatedParticipants = participants.map(p =>
                p.user_id === userId
                    ? { ...p, status: newStatus, is_hadir: !isAttended ? 1 : 0 }
                    : p
            );
            setParticipants(updatedParticipants);
            toast.success(!isAttended ? 'Peserta ditandai hadir' : 'Absensi dibatalkan');
        } catch (error) {
            toast.error('Gagal memperbarui status');
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
            setParticipants(current => current.map(p =>
                selectedIds.includes(p.user_id)
                    ? { ...p, status: status, is_hadir: isAttended ? 1 : 0 }
                    : p
            ));
            setSelectedIds([]); // Clear selection after action
        } catch (error) {
            console.error('Bulk update failed:', error);
            toast.error('Gagal memperbarui status peserta');
        }
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(participants.map(p => p.user_id));
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

    const columns = useMemo(() => [
        {
            header: (
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={participants.length > 0 && selectedIds.length === participants.length}
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
            header: "Status",
            accessorKey: "status" as keyof Participant,
            cell: (item: Participant) => {
                const isPresent = item.is_hadir === 1;
                return (
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isPresent
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {isPresent ? 'Sudah Absen' : 'Belum Absen'}
                    </span>
                );
            },
            className: "text-center"
        },
        {
            header: "Aksi",
            cell: (item: Participant) => {
                const isPresent = item.is_hadir === 1;
                return (
                    <div className="flex justify-center">
                        <button
                            onClick={() => handleStatusUpdate(item.user_id, item.status)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${isPresent
                                ? 'text-red-700 bg-red-50 hover:bg-red-100'
                                : 'text-green-700 bg-green-50 hover:bg-green-100'
                                }`}
                        >
                            {isPresent ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            {isPresent ? 'Batal' : 'Absen'}
                        </button>
                    </div>
                );
            },
            className: "text-center"
        }
    ], [participants, selectedIds]);

    if (loading) return <div className="p-8 text-center">Memuat...</div>;
    if (!event) return <div className="p-8 text-center">Event tidak ditemukan</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/events')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">{event.title}</h1>
                        <div className="flex items-center gap-4 text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(event.date)}
                            </span>
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-100 text-center min-w-[100px]">
                        <div className="text-xl font-bold text-blue-600">{participants.length}</div>
                        <div className="text-xs text-blue-800 font-medium">TOTAL PESERTA</div>
                    </div>
                    <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-100 text-center min-w-[100px]">
                        <div className="text-xl font-bold text-green-600">
                            {participants.filter(p => p.is_hadir === 1).length}
                        </div>
                        <div className="text-xs text-green-800 font-medium">SUDAH ABSEN</div>
                    </div>
                    <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 text-center min-w-[100px]">
                        <div className="text-xl font-bold text-gray-600">
                            {participants.filter(p => p.is_hadir === 0).length}
                        </div>
                        <div className="text-xs text-gray-800 font-medium">BELUM ABSEN</div>
                    </div>
                </div>
            </div>

            {/* Participants List */}
            <div className="space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-600" />
                            Daftar Peserta
                        </h2>
                        {selectedIds.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleBulkUpdate('attended')}
                                >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Tandai Sudah Absen ({selectedIds.length})
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => handleBulkUpdate('registered')}
                                >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Batal Absen ({selectedIds.length})
                                </Button>
                            </div>
                        )}
                    </div>

                    <DataTable
                        columns={columns}
                        data={participants}
                        searchKeys={['nama', 'email']}
                        pageSize={10}
                    />
                </div>
            </div>
        </div>
    );
}
