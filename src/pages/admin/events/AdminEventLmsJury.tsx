import { useState, useEffect, useMemo } from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { toast } from 'react-hot-toast';
import { lmsService } from '../../../services/lmsService';
import { contentManagementService } from '../../../services/contentManagementService';
import { DataTable } from '../../../components/ui/DataTable';

export function AdminEventLmsJury({ eventId }: { eventId: string }) {
    const [participants, setParticipants] = useState<any[]>([]);
    const [juries, setJuries] = useState<any[]>([]);
    const [gradeSettings, setGradeSettings] = useState<any[]>([]);
    const [participantsWithActiveness, setParticipantsWithActiveness] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'juries' | 'activeness' | 'group_tasks' | 'settings'>('juries');

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [fetchedParticipants, fetchedJuries, fetchedSettings, fetchedActiveness, fetchedGroups] = await Promise.all([
                contentManagementService.getEventParticipants(eventId),
                lmsService.getJuries(eventId),
                lmsService.getGradeSettings(),
                lmsService.getParticipantsWithActiveness(eventId),
                lmsService.getGroups(eventId)
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
            setGroups(fetchedGroups || []);
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
            setParticipantsWithActiveness(prev => prev.map(p => p.user_id === userId ? { ...p, grade } : p));
        } catch (error) {
            toast.error("Gagal menyimpan nilai keaktifan");
        }
    };

    const handleEvaluateGroup = async (groupId: string, grade: string) => {
        if (!grade) return;
        try {
            await lmsService.juryEvaluateGroup({
                target_group_id: groupId,
                grade: grade
            });
            toast.success("Nilai tugas kelompok berhasil disimpan");
            setGroups(prev => prev.map(g => {
                if (g.id === groupId) {
                    return { ...g, jury_grades: [{ grade: grade }] };
                }
                return g;
            }));
        } catch (error) {
            toast.error("Gagal menyimpan nilai tugas kelompok");
        }
    };

    const juryIds = useMemo(() => juries.map(j => j.user_id), [juries]);

    const juriesColumns = useMemo(() => [
        {
            header: "Nama",
            accessorKey: "nama",
            cell: (item: any) => <span className="font-medium">{item.nama}</span>
        },
        {
            header: "Role",
            accessorKey: "role",
            cell: (item: any) => (
                item.role === 'Pengurus' ? (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold">Pengurus</span>
                ) : (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Anggota</span>
                )
            )
        },
        {
            header: "Asal Sekolah",
            accessorKey: "asal_sekolah"
        },
        {
            header: "Status Juri",
            cell: (item: any) => {
                const isJury = juryIds.includes(item.user_id);
                return isJury ? <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">JURI</span> : <span className="text-gray-400">-</span>;
            },
            className: "text-center"
        },
        {
            header: "Aksi",
            cell: (item: any) => {
                const isJury = juryIds.includes(item.user_id);
                return (
                    <Button 
                        size="sm" 
                        variant={isJury ? "destructive" : "outline"}
                        onClick={() => toggleJury(item.user_id, isJury)}
                    >
                        {isJury ? 'Cabut Juri' : 'Jadikan Juri'}
                    </Button>
                );
            },
            className: "text-center"
        }
    ], [juryIds]);

    const activenessColumns = useMemo(() => [
        {
            header: "Nama Peserta",
            accessorKey: "nama",
            cell: (item: any) => <span className="font-medium">{item.nama}</span>
        },
        {
            header: "Asal Sekolah",
            accessorKey: "asal_sekolah"
        },
        {
            header: "Nilai Saat Ini",
            cell: (item: any) => (
                item.grade ? (
                    <span className="bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded">{item.grade}</span>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            ),
            className: "text-center"
        },
        {
            header: "Ubah Nilai",
            cell: (item: any) => (
                <div className="flex justify-center gap-1">
                    {['A', 'B', 'C', 'D', 'E'].map(g => (
                        <button
                            key={g}
                            onClick={() => handleEvaluateParticipant(item.user_id, g)}
                            className={`w-8 h-8 rounded font-bold text-sm transition-colors ${
                                (item.grade || 'E') === g 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            ),
            className: "text-center"
        }
    ], []);

    const groupTasksColumns = useMemo(() => [
        {
            header: "Kelompok",
            accessorKey: "name",
            cell: (item: any) => (
                <div>
                    <span className="font-medium">{item.name}</span>
                    <div className="text-xs text-gray-500 font-normal">{item.members?.length || 0} Anggota</div>
                </div>
            )
        },
        {
            header: "Tugas Terkumpul",
            cell: (item: any) => (
                item.is_submitted === 1 ? (
                    <a href={item.task_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1">
                        Lihat Tugas
                    </a>
                ) : (
                    <span className="text-red-500">Belum Dikumpulkan</span>
                )
            )
        },
        {
            header: "Nilai Saat Ini",
            cell: (item: any) => {
                const currentGrade = item.jury_grades?.[0]?.grade;
                return currentGrade ? (
                    <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded">{currentGrade}</span>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
            className: "text-center"
        },
        {
            header: "Ubah Nilai",
            cell: (item: any) => {
                const currentGrade = item.jury_grades?.[0]?.grade;
                return (
                    <div className="flex justify-center gap-1">
                        {['A', 'B', 'C', 'D', 'E'].map(gradeOpt => (
                            <button
                                key={gradeOpt}
                                onClick={() => handleEvaluateGroup(item.id, gradeOpt)}
                                className={`w-8 h-8 rounded font-bold text-sm transition-colors ${
                                    currentGrade === gradeOpt 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {gradeOpt}
                            </button>
                        ))}
                    </div>
                );
            },
            className: "text-center"
        }
    ], []);

    if (loading) return <div>Memuat...</div>;

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
                    className={`px-4 py-2 ${activeTab === 'activeness' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('activeness')}
                >
                    Nilai Sikap (Keaktifan)
                </button>
                <button 
                    className={`px-4 py-2 ${activeTab === 'group_tasks' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('group_tasks')}
                >
                    Nilai Tugas Kelompok
                </button>
                <button 
                    className={`px-4 py-2 flex items-center gap-2 ${activeTab === 'settings' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <Settings className="w-4 h-4" /> Pengaturan Poin Grade
                </button>
            </div>

            {activeTab === 'juries' && (
                <div className="bg-white rounded-lg border shadow-sm">
                    <div className="p-4 bg-gray-50 border-b">
                        <h4 className="font-bold">Daftar Peserta & Juri</h4>
                    </div>
                    <DataTable 
                        data={participants} 
                        columns={juriesColumns} 
                        searchKeys={['nama', 'asal_sekolah']} 
                        pageSize={10} 
                    />
                </div>
            )}

            {activeTab === 'activeness' && (
                <div className="bg-white rounded-lg border shadow-sm">
                    <div className="p-4 bg-gray-50 border-b">
                        <h4 className="font-bold">Penilaian Keaktifan Peserta</h4>
                        <p className="text-sm text-gray-500">Berikan nilai sikap / keaktifan untuk masing-masing peserta. Nilai akan diakumulasikan ke Leaderboard berdasarkan pengaturan Poin Grade.</p>
                    </div>
                    <DataTable 
                        data={participantsWithActiveness} 
                        columns={activenessColumns} 
                        searchKeys={['nama', 'asal_sekolah']} 
                        pageSize={10} 
                    />
                </div>
            )}

            {activeTab === 'group_tasks' && (
                <div className="bg-white rounded-lg border shadow-sm">
                    <div className="p-4 bg-gray-50 border-b">
                        <h4 className="font-bold">Penilaian Tugas Kelompok</h4>
                        <p className="text-sm text-gray-500">Berikan nilai proyek akhir / tugas kelompok. Nilai akan diakumulasikan ke Leaderboard.</p>
                    </div>
                    <DataTable 
                        data={groups} 
                        columns={groupTasksColumns} 
                        searchKeys={['name']} 
                        pageSize={10} 
                    />
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
