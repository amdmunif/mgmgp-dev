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
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [formName, setFormName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [fetchedGroups, fetchedParticipants] = await Promise.all([
                lmsService.getGroups(eventId),
                contentManagementService.getEventParticipants(eventId)
            ]);
            setGroups(fetchedGroups || []);
            setParticipants(fetchedParticipants || []);
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Anggota</label>
                                <div className="space-y-2 border rounded-md p-2 h-64 overflow-y-auto">
                                    {participants.map(p => (
                                        <div key={p.user_id} className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                id={`member-${p.user_id}`}
                                                checked={selectedMembers.includes(p.user_id)}
                                                onChange={() => toggleMember(p.user_id)}
                                                className="rounded border-gray-300"
                                            />
                                            <label htmlFor={`member-${p.user_id}`} className="text-sm cursor-pointer select-none">
                                                {p.user_name} <span className="text-xs text-gray-500">({p.asal_sekolah})</span>
                                            </label>
                                        </div>
                                    ))}
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
