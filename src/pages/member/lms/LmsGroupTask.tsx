import { useState, useEffect } from 'react';
import { Users, Upload, CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { toast } from 'react-hot-toast';
import { lmsService } from '../../../services/lmsService';

export function LmsGroupTask({ eventId }: { eventId: string }) {
    const [myGroup, setMyGroup] = useState<any>(null);
    const [otherGroups, setOtherGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submissionUrl, setSubmissionUrl] = useState('');

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [myGroupRes, allGroupsRes] = await Promise.all([
                lmsService.getMyGroup(eventId).catch(() => null),
                lmsService.getGroups(eventId).catch(() => [])
            ]);

            setMyGroup(myGroupRes);
            if (myGroupRes) {
                setOtherGroups(allGroupsRes.filter((g: any) => g.id !== myGroupRes.id));
            } else {
                setOtherGroups(allGroupsRes);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmission = async () => {
        if (!submissionUrl.trim()) {
            toast.error("URL Tugas tidak boleh kosong");
            return;
        }
        try {
            await lmsService.submitGroupTask({
                group_id: myGroup.id,
                task_url: submissionUrl
            });
            toast.success("Tugas berhasil dikumpulkan!");
            loadData();
        } catch (error) {
            toast.error("Gagal mengumpulkan tugas");
        }
    };

    const handlePeerEvaluation = async (targetGroupId: string, evaluation: 'like' | 'dislike') => {
        try {
            await lmsService.peerEvaluateGroup({
                target_group_id: targetGroupId,
                evaluation
            });
            toast.success("Penilaian berhasil disimpan!");
            loadData();
        } catch (error) {
            toast.error("Gagal menyimpan penilaian");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Memuat data kelompok...</div>;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100 mb-10">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tugas Kelompok Akhir</h2>
                <p className="text-gray-500">Kerjakan tugas ini bersama anggota kelompok Anda. Hanya 1 perwakilan kelompok yang perlu mengumpulkan tugas berupa Link URL Google Drive atau dokumen online lainnya.</p>
            </div>

            {/* My Group Section */}
            {myGroup ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-blue-900">{myGroup.name}</h3>
                            <p className="text-sm text-blue-700">Kelompok Anda</p>
                        </div>
                    </div>
                    
                    <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-blue-50">
                        <h4 className="font-medium text-gray-700 mb-2 text-sm">Anggota Kelompok:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {myGroup.members?.map((m: any) => (
                                <li key={m.user_id}>{m.nama}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-50">
                        <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-gray-500" /> Pengumpulan Tugas
                        </h4>
                        
                        {myGroup.is_submitted ? (
                            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex flex-col gap-2">
                                <div className="flex items-center gap-2 font-semibold">
                                    <CheckCircle className="w-5 h-5" />
                                    Tugas telah dikumpulkan
                                </div>
                                <p className="text-sm pl-7">URL: <a href={myGroup.task_url} target="_blank" rel="noreferrer" className="underline font-medium hover:text-green-900">{myGroup.task_url}</a></p>
                                <p className="text-xs text-green-700 pl-7 mt-2">Dapat nilai Juri: {myGroup.jury_grades?.length > 0 ? myGroup.jury_grades[0].grade : 'Belum dinilai'}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tautan Tugas (Google Drive / Canva / dll)</label>
                                    <input 
                                        type="url" 
                                        value={submissionUrl} 
                                        onChange={e => setSubmissionUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                                <Button onClick={handleSubmission} className="w-full sm:w-auto">Kumpulkan Tugas</Button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <Users className="w-12 h-12 text-yellow-500 mb-3" />
                    <h3 className="font-bold text-yellow-900 text-lg mb-1">Belum Punya Kelompok</h3>
                    <p className="text-yellow-700 max-w-md">Anda belum dimasukkan ke kelompok manapun. Silakan hubungi admin atau instruktur kegiatan.</p>
                </div>
            )}

            {/* Peer Evaluation Section */}
            <div className="pt-6 border-t border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Penilaian Kelompok Lain</h3>
                <p className="text-sm text-gray-500 mb-6">Berikan apresiasi untuk hasil karya dari kelompok lain. Anda tidak bisa menilai kelompok Anda sendiri.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {otherGroups.length === 0 ? (
                        <div className="col-span-full text-center text-gray-400 py-8 italic border border-dashed rounded-lg">
                            Belum ada kelompok lain.
                        </div>
                    ) : (
                        otherGroups.map(group => (
                            <div key={group.id} className="border rounded-lg p-5 flex flex-col hover:border-gray-300 transition-colors bg-gray-50">
                                <h4 className="font-bold text-gray-800 mb-2">{group.name}</h4>
                                <div className="text-sm text-gray-600 flex-1 mb-4">
                                    {group.is_submitted ? (
                                        <a href={group.task_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                            Lihat Hasil Tugas <Upload className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 italic">Belum mengumpulkan tugas</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className={`flex-1 ${group.has_peer_evaluated === 'like' ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
                                        onClick={() => handlePeerEvaluation(group.id, 'like')}
                                    >
                                        <ThumbsUp className="w-4 h-4 mr-1" /> Suka ({group.likes || 0})
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className={`flex-1 ${group.has_peer_evaluated === 'dislike' ? 'bg-red-50 border-red-200 text-red-700' : ''}`}
                                        onClick={() => handlePeerEvaluation(group.id, 'dislike')}
                                    >
                                        <ThumbsDown className="w-4 h-4 mr-1" /> Tidak Suka ({group.dislikes || 0})
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
