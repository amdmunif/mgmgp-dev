import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, Calendar, MapPin, Eye, Pencil } from 'lucide-react';
import { contentManagementService } from '../../../services/contentManagementService';
import type { Event } from '../../../types';
import { Link, useOutletContext } from 'react-router-dom';
import { DataTable } from '../../../components/ui/DataTable';

export function AdminEvents() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Agenda Kegiatan',
                description: 'Jadwal pertemuan dan kegiatan MGMP.',
                icon: <Calendar className="w-6 h-6" />
            });
        }
        loadData();
    }, [setPageHeader]);

    const loadData = async () => {
        try {
            const data = await contentManagementService.getAllEvents();
            setEvents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus agenda ini?')) return;
        try {
            await contentManagementService.deleteEvent(id);
            loadData();
        } catch (error) {
            alert('Gagal menghapus');
        }
    };

    // Filter Logic integrated via DataTable searchKeys/searchValue
    // But since backend doesn't support complex search easily here, we filter client side via DataTable usually, or...
    // The previous code filtered manually:
    // const filteredEvents = events.filter(...)
    // With DataTable controlled search, we can use the same logic if we want, OR let DataTable handle client-side search.
    // DataTable "onSearchChange" allows us to control the value.
    // If we pass `data={filteredEvents}`, then DataTable just renders it.
    // Let's use controlled search to filter the data array passed to DataTable.


    // Sort by date descending
    const filteredEvents = events
        .filter(e =>
            e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.location.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const stripHtml = (html: string) => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    const columns = [
        {
            header: "Nama Kegiatan",
            accessorKey: "title" as keyof Event,
            cell: (item: Event) => (
                <div>
                    <div className="font-bold text-gray-900 text-lg">{item.title}</div>
                    <p className="text-xs text-gray-500 line-clamp-1">{stripHtml(item.description)}</p>
                </div>
            )
        },
        {
            header: "Waktu & Lokasi",
            accessorKey: "date" as keyof Event,
            cell: (item: Event) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 text-red-500" />
                        {item.location}
                    </div>
                </div>
            )
        },
        {
            header: "Aksi",
            cell: (item: Event) => (
                <div className="flex items-center justify-end gap-2">
                    <Link
                        to={`/admin/events/${item.id}`}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Lihat Agenda"
                    >
                        <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                        to={`/admin/events/edit/${item.id}`}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                        title="Edit Agenda"
                    >
                        <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Hapus Agenda"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
            className: "text-right"
        }
    ];

    return (
        <div className="space-y-6">
            {/* Action Bar */}


            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <DataTable
                    data={filteredEvents}
                    columns={columns}
                    searchKeys={['title', 'location', 'description']}
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    pageSize={10}
                    filterContent={
                        <Link to="/admin/events/create">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 h-9">
                                <Plus className="w-4 h-4 mr-2" /> Buat Agenda
                            </Button>
                        </Link>
                    }
                />
            )}
        </div>
    );
}
