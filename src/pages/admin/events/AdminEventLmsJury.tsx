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
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'juries' | 'settings'>('juries');

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [fetchedParticipants, fetchedJuries, fetchedSettings] = await Promise.all([
                contentManagementService.getEventParticipants(eventId),
                lmsService.getJuries(eventId),
                lmsService.getGradeSettings()
            ]);
            setParticipants(fetchedParticipants || []);
            setJuries(fetchedJuries || []);
            setGradeSettings(fetchedSettings || [
                { grade: 'A', points: 10 },
                { grade: 'B', points: 8 },
                { grade: 'C', points: 7 },
                { grade: 'D', points: 5 },
                { grade: 'E', points: 3 },
            ]);
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

    if (loading) return <div>Memuat...</div>;

    const juryIds = juries.map(j => j.user_id);

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
            </div>

            {activeTab === 'juries' && (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <h4 className="font-bold">Daftar Peserta & Juri</h4>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="p-3">Nama</th>
                                    <th className="p-3">Asal Sekolah</th>
                                    <th className="p-3 text-center">Status Juri</th>
                                    <th className="p-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.map(p => {
                                    const isJury = juryIds.includes(p.user_id);
                                    return (
                                        <tr key={p.user_id} className="border-b">
                                            <td className="p-3">{p.user_name}</td>
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
        </div>
    );
}
