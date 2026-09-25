import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { toast } from 'react-hot-toast';
import { lmsService } from '../../../services/lmsService';
import { contentManagementService } from '../../../services/contentManagementService';
// import type { Participant } from '../../../types';

export function AdminEventLmsGroupTasks({ eventId }: { eventId: string }) {
    const [groups, setGroups] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [eventDetail, setEventDetail] = useState<any>(null);
    const [availableAt, setAvailableAt] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [formName, setFormName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [fetchedGroups, fetchedParticipants, fetchedEvent] = await Promise.all([
                lmsService.getGroups(eventId),
                contentManagementService.getEventParticipants(eventId),
                contentManagementService.getEventById(eventId)
            ]);
            setGroups(fetchedGroups || []);
            setParticipants(fetchedParticipants || []);
            setEventDetail(fetchedEvent);
            if (fetchedEvent?.group_task_available_at) {
                // Convert database datetime (YYYY-MM-DD HH:mm:ss) to datetime-local input format (YYYY-MM-DDTHH:mm)
                setAvailableAt(fetchedEvent.group_task_available_at.replace(' ', 'T').slice(0, 16));
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data kelompok");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (group?: any) => {
        if (group) {
            setEditingGroup(group);
            setFormName(group.name);
            setSelectedMembers(group.members.map((m: any) => m.user_id));
        } else {
            setEditingGroup(null);
            setFormName('');
            setSelectedMembers([]);
        }
        setSearchQuery('');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            toast.error("Nama kelompok tidak boleh kosong");
            return;
        }

        try {
            const payload = {
                event_id: eventId,
                name: formName,
                members: selectedMembers
            };

            if (editingGroup) {
                await lmsService.updateGroup(editingGroup.id, payload);
                toast.success("Kelompok diperbarui");
            } else {
                await lmsService.createGroup(payload);
                toast.success("Kelompok ditambahkan");
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            toast.error("Gagal menyimpan kelompok");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus kelompok ini?")) return;
        try {
            await lmsService.deleteGroup(id);
            toast.success("Kelompok dihapus");
            loadData();
        } catch (error) {
            toast.error("Gagal menghapus kelompok");
        }
    };

    const handleSaveSettings = async () => {
        if (!eventDetail) return;
        try {
            setSavingSettings(true);
            const dateVal = availableAt ? availableAt.replace('T', ' ') + ':00' : null;
            await contentManagementService.updateEvent(eventId, {
                ...eventDetail,
                group_task_available_at: dateVal
            });
            toast.success("Pengaturan waktu berhasil disimpan");
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan pengaturan waktu");
        } finally {
            setSavingSettings(false);
        }
    };

    const toggleMember = (userId: string) => {
        setSelectedMembers(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    if (loading) return <div>Memuat...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Manajemen Kelompok Tugas</h3>
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Tambah Kelompok
                </Button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex items-end gap-4">
                <div className="flex-1 max-w-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Buka Akses Tugas Kelompok Pada:
                    </label>
                    <input 
                        type="datetime-local" 
                        value={availableAt}
                        onChange={(e) => setAvailableAt(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Kosongkan jika ingin tugas kelompok langsung dapat diakses.
                    </p>
                </div>
                <Button onClick={handleSaveSettings} disabled={savingSettings}>
                    {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map(g => (
                    <div key={g.id} className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-800">{g.name}</h4>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenModal(g)} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(g.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                            <Users className="inline w-4 h-4 mr-1" /> {g.members.length} Anggota
                        </div>
                        <ul className="text-xs text-gray-500 mb-3 pl-5 list-disc min-h-[4rem]">
                            {g.members.map((m: any) => (
                                <li key={m.user_id}>{m.user_name || m.nama}</li>
                            ))}
                        </ul>
                        <div className="text-xs text-gray-500 mb-2">
                            Tugas: {g.is_submitted === 1 ? <a href={g.task_url} target="_blank" rel="noreferrer" className="text-blue-500 underline">Lihat URL</a> : 'Belum Dikumpulkan'}
                        </div>
                        <div className="text-xs flex gap-3 text-gray-500">
                            <span>👍 {g.likes} Suka</span>
                            <span>👎 {g.dislikes} Tidak Suka</span>
                        </div>
                        {g.jury_grades?.length > 0 && (
                            <div className="mt-2 text-xs font-semibold text-purple-600">
                                Nilai Juri: {g.jury_grades[0].grade}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">{editingGroup ? 'Edit Kelompok' : 'Tambah Kelompok'}</h2>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelompok</label>
                                <input 
                                    type="text" 
                                    value={formName} 
                                    onChange={e => setFormName(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Contoh: Kelompok 1"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Pilih Anggota</label>
                                    <input 
                                        type="text" 
                                        placeholder="Cari nama atau sekolah..." 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="border rounded-md px-2 py-1 text-sm w-48"
                                    />
                                </div>
                                <div className="space-y-2 border rounded-md p-2 h-64 overflow-y-auto">
                                    {participants.filter(p => 
                                        (p.user_name || p.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        (p.asal_sekolah || '').toLowerCase().includes(searchQuery.toLowerCase())
                                    ).map(p => {
                                        const otherGroup = groups.find(g => g.id !== editingGroup?.id && g.members.some((m: any) => m.user_id === p.user_id));
                                        return (
                                        <div key={p.user_id} className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                            <input 
                                                type="checkbox" 
                                                id={`member-${p.user_id}`}
                                                checked={selectedMembers.includes(p.user_id)}
                                                onChange={() => toggleMember(p.user_id)}
                                                disabled={!!otherGroup}
                                                className="rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <label htmlFor={`member-${p.user_id}`} className={`text-sm cursor-pointer select-none flex-1 ${otherGroup ? 'text-gray-400 cursor-not-allowed' : ''}`}>
                                                {p.user_name || p.nama} <span className="text-xs">({p.asal_sekolah})</span>
                                                {otherGroup && (
                                                    <span className="ml-2 text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">
                                                        Di {otherGroup.name}
                                                    </span>
                                                )}
                                            </label>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                            <Button onClick={handleSave}>Simpan</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
