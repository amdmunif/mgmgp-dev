import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { toast } from 'react-hot-toast';
import { lmsService } from '../../../services/lmsService';
import { contentManagementService } from '../../../services/contentManagementService';
// import type { Participant } from '../../../types';

export function AdminEventLmsJury({ eventId }: { eventId: string }) {
    const [participants, setParticipants] = useState<any[]>([]);
    const [juries, setJuries] = useState<any[]>([]);
    const [gradeSettings, setGradeSettings] = useState<any[]>([]);
    const [participantsWithActiveness, setParticipantsWithActiveness] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'juries' | 'settings' | 'activeness'>('juries');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [fetchedParticipants, fetchedJuries, fetchedSettings, fetchedActiveness] = await Promise.all([
                contentManagementService.getEventParticipants(eventId),
                lmsService.getJuries(eventId),
                lmsService.getGradeSettings(),
                lmsService.getParticipantsWithActiveness(eventId)
            ]);
            setParticipants(fetchedParticipants || []);
            setJuries(fetchedJuries || []);
            setGradeSettings(fetchedSettings && fetchedSettings.length > 0 ? fetchedSettings : [
                { grade: 'A', points: 10 },
                { grade: 'B', points: 8 },
                { grade: 'C', points: 7 },
                { grade: 'D', points: 5 },
                { grade: 'E', points: 3 },
            ]);
            setParticipantsWithActiveness(fetchedActiveness || []);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data juri");
        } finally {
            setLoading(false);
        }
    };

    const toggleJury = async (userId: string, isCurrentlyJury: boolean) => {
        try {
            await lmsService.setJuryRole({ event_id: eventId, user_id: userId, is_jury: isCurrentlyJury ? 0 : 1 });
            toast.success(isCurrentlyJury ? "Role Juri dicabut" : "Berhasil ditunjuk sebagai Juri");
            loadData();
        } catch (error) {
            toast.error("Gagal mengubah role juri");
        }
    };

    const handleSaveSettings = async () => {
        try {
            await lmsService.updateGradeSettings(gradeSettings);
            toast.success("Pengaturan bobot nilai berhasil disimpan");
        } catch (error) {
            toast.error("Gagal menyimpan pengaturan");
        }
    };

    const updateGradePoint = (grade: string, points: string) => {
        setGradeSettings(prev => prev.map(s => s.grade === grade ? { ...s, points: parseInt(points) || 0 } : s));
    };

    const handleEvaluateParticipant = async (userId: string, grade: string) => {
        if (!grade) return;
        try {
            await lmsService.juryEvaluateParticipant({
                event_id: eventId,
                target_user_id: userId,
                grade: grade
            });
            toast.success("Nilai keaktifan berhasil disimpan");
            // Update local state without reloading everything
            setParticipantsWithActiveness(prev => prev.map(p => p.user_id === userId ? { ...p, grade } : p));
        } catch (error) {
            toast.error("Gagal menyimpan nilai keaktifan");
        }
    };

    if (loading) return <div>Memuat...</div>;

    const juryIds = juries.map(j => j.user_id);

    const filteredParticipants = participants.filter(p => {
        const matchesSearch = (p.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (p.asal_sekolah || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        if (filterRole !== 'all' && p.role !== filterRole) return false;
        
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex border-b">
                <button 
                    className={`px-4 py-2 ${activeTab === 'juries' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('juries')}
                >
                    Pilih Juri
                </button>
                <button 
                    className={`px-4 py-2 flex items-center gap-2 ${activeTab === 'settings' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <Settings className="w-4 h-4" /> Pengaturan Poin Grade
                </button>
                <button 
                    className={`px-4 py-2 ${activeTab === 'activeness' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('activeness')}
                >
                    Nilai Sikap (Keaktifan)
                </button>
            </div>

            {activeTab === 'juries' && (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                        <h4 className="font-bold">Daftar Peserta & Juri</h4>
                        <div className="flex gap-2 w-full md:w-auto">
                            <input 
                                type="text" 
                                placeholder="Cari nama atau sekolah..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="border rounded-md px-3 py-1.5 text-sm w-full md:w-64"
                            />
                            <select 
                                value={filterRole}
                                onChange={e => setFilterRole(e.target.value)}
                                className="border rounded-md px-3 py-1.5 text-sm bg-white"
                            >
                                <option value="all">Semua Role</option>
                                <option value="Pengurus">Pengurus</option>
                                <option value="Anggota">Anggota</option>
                            </select>
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="p-3">Nama</th>
                                    <th className="p-3">Role</th>
                                    <th className="p-3">Asal Sekolah</th>
                                    <th className="p-3 text-center">Status Juri</th>
                                    <th className="p-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParticipants.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center p-4 text-gray-500">Tidak ada data yang sesuai</td>
                                    </tr>
                                ) : filteredParticipants.map(p => {
                                    const isJury = juryIds.includes(p.user_id);
                                    return (
                                        <tr key={p.user_id} className="border-b">
                                            <td className="p-3">{p.nama}</td>
                                            <td className="p-3">
                                                {p.role === 'Pengurus' ? (
                                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold">Pengurus</span>
                                                ) : (
                                                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Anggota</span>
                                                )}
                                            </td>
                                            <td className="p-3">{p.asal_sekolah}</td>
                                            <td className="p-3 text-center">
                                                {isJury ? <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">JURI</span> : <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="p-3 text-center">
                                                <Button 
                                                    size="sm" 
                                                    variant={isJury ? "destructive" : "outline"}
                                                    onClick={() => toggleJury(p.user_id, isJury)}
                                                >
                                                    {isJury ? 'Cabut Juri' : 'Jadikan Juri'}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="bg-white rounded-lg border shadow-sm p-6 max-w-md">
                    <h4 className="font-bold mb-4">Pengaturan Bobot Grade Juri</h4>
                    <p className="text-sm text-gray-500 mb-6">Tentukan nilai poin untuk setiap grade (A - E) yang diberikan oleh Juri. Nilai ini akan diakumulasikan ke Leaderboard.</p>
                    
                    <div className="space-y-4">
                        {gradeSettings.map(s => (
                            <div key={s.grade} className="flex items-center gap-4">
                                <div className="w-16 h-10 flex items-center justify-center bg-gray-100 rounded font-bold text-lg">
                                    {s.grade}
                                </div>
                                <span className="text-gray-500">=</span>
                                <input 
                                    type="number" 
                                    value={s.points} 
                                    onChange={(e) => updateGradePoint(s.grade, e.target.value)}
                                    className="border rounded px-3 py-2 w-24 text-center"
                                />
                                <span className="text-gray-500 text-sm">Poin</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t flex justify-end">
                        <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                            <Save className="w-4 h-4" /> Simpan Pengaturan
                        </Button>
                    </div>
                </div>
            )}

            {activeTab === 'activeness' && (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h4 className="font-bold">Penilaian Keaktifan Peserta</h4>
                            <p className="text-sm text-gray-500">Berikan nilai sikap / keaktifan untuk masing-masing peserta. Nilai akan diakumulasikan ke Leaderboard berdasarkan pengaturan Poin Grade.</p>
                        </div>
                        <div className="w-full md:w-auto">
                            <input 
                                type="text" 
                                placeholder="Cari nama atau sekolah..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="border rounded-md px-3 py-1.5 text-sm w-full md:w-64"
                            />
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="p-3">Nama Peserta</th>
                                    <th className="p-3">Asal Sekolah</th>
                                    <th className="p-3 text-center">Nilai Saat Ini</th>
                                    <th className="p-3 text-center">Ubah Nilai</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participantsWithActiveness
                                    .filter(p => {
                                        const matchesSearch = (p.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                            (p.asal_sekolah || '').toLowerCase().includes(searchQuery.toLowerCase());
                                        return matchesSearch;
                                    })
                                    .map(p => (
                                    <tr key={p.user_id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium">{p.nama}</td>
                                        <td className="p-3 text-gray-500">{p.asal_sekolah}</td>
                                        <td className="p-3 text-center">
                                            {p.grade ? (
                                                <span className="bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded">{p.grade}</span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex justify-center gap-1">
                                                {['A', 'B', 'C', 'D', 'E'].map(g => (
                                                    <button
                                                        key={g}
                                                        onClick={() => handleEvaluateParticipant(p.user_id, g)}
                                                        className={`w-8 h-8 rounded font-bold text-sm transition-colors ${
                                                            (p.grade || 'E') === g 
                                                                ? 'bg-blue-600 text-white' 
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {g}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
