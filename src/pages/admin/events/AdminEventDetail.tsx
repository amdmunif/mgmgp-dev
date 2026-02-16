import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentManagementService } from '../../../services/contentManagementService';
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle, XCircle, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredParticipants = participants.filter(p =>
        p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center">Memuat...</div>;
    if (!event) return <div className="p-8 text-center">Event tidak ditemukan</div>;

    return (
        <div className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Event Stats / Info Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 relative">
                            {event.image_url ? (
                                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    No Image
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold mb-3">Statistik Kehadiran</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-600">{participants.length}</div>
                                    <div className="text-xs text-blue-800 mt-1 font-medium">TOTAL PESERTA</div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {participants.filter(p => p.status === 'attended' || p.is_hadir === 1).length}
                                    </div>
                                    <div className="text-xs text-green-800 mt-1 font-medium">HADIR</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Participants List */}
                <div className="md:col-span-2 space-y-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-600" />
                                Daftar Peserta
                            </h2>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 text-sm"
                                />
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-100">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Peserta</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Waktu Daftar</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredParticipants.map((participant) => {
                                        const isPresent = participant.status === 'attended' || participant.is_hadir === 1;
                                        return (
                                            <tr key={participant.user_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            {participant.foto_profile ? (
                                                                <img className="h-10 w-10 rounded-full object-cover border border-gray-200" src={participant.foto_profile} alt="" />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                                    {participant.nama.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{participant.nama}</div>
                                                            <div className="text-xs text-gray-500">{participant.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                                    {formatDate(participant.registered_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isPresent
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {isPresent ? 'Hadir' : 'Terdaftar'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <button
                                                        onClick={() => handleStatusUpdate(participant.user_id, participant.status)}
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${isPresent
                                                            ? 'text-red-700 bg-red-50 hover:bg-red-100'
                                                            : 'text-green-700 bg-green-50 hover:bg-green-100'
                                                            }`}
                                                    >
                                                        {isPresent ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                                        {isPresent ? 'Batalkan' : 'Hadir'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {filteredParticipants.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Users className="w-8 h-8 text-gray-300" />
                                                    <p>Tidak ada peserta ditemukan</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
