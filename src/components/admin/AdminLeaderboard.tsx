import { useState, useEffect } from 'react';
import { statsService } from '../../services/statsService';
import { Trophy, Medal, Filter } from 'lucide-react';
import { DataTable } from '../ui/DataTable';

export function AdminLeaderboard() {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [memberType, setMemberType] = useState('all'); // all, premium, reguler
    const [eventType, setEventType] = useState('all'); // all, premium, umum
    const [roleType, setRoleType] = useState('all'); // all, pengurus, anggota

    useEffect(() => {
        fetchLeaderboard();
    }, [memberType, eventType, roleType]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const data = await statsService.getLeaderboard(memberType, eventType, roleType);
            const rankedData = (data as any[]).map((item, index) => ({ ...item, rank: index + 1 }));
            setLeaderboard(rankedData);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: 'Peringkat',
            accessorKey: 'rank',
            cell: (row: any) => (
                <div className="flex items-center gap-2 font-bold">
                    {row.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500" />}
                    {row.rank === 2 && <Medal className="w-5 h-5 text-gray-400" />}
                    {row.rank === 3 && <Medal className="w-5 h-5 text-amber-600" />}
                    {row.rank > 3 && <span className="text-gray-500 w-5 text-center">{row.rank}</span>}
                </div>
            )
        },
        {
            header: 'Nama',
            accessorKey: 'nama',
            cell: (row: any) => (
                <div>
                    <div className="font-medium text-gray-900">{row.nama}</div>
                    {row.premium_until && new Date(row.premium_until) > new Date() ? (
                        <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">
                            Premium
                        </span>
                    ) : (
                        <span className="inline-block mt-1 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium uppercase">
                            Reguler
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Asal Sekolah',
            accessorKey: 'asal_sekolah',
            cell: (row: any) => <div className="text-gray-600 text-sm">{row.asal_sekolah || '-'}</div>
        },
        {
            header: 'Total Kehadiran',
            accessorKey: 'total_events_attended',
            cell: (row: any) => (
                <div className="font-bold text-blue-600 text-lg">
                    {row.total_events_attended} <span className="text-xs text-gray-500 font-normal">Kegiatan</span>
                </div>
            )
        }
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Leaderboard Kepesertaan</h3>
                        <p className="text-sm text-gray-500">Peringkat anggota berdasarkan jumlah kehadiran kegiatan.</p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 w-full sm:w-auto">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select 
                            value={memberType} 
                            onChange={e => setMemberType(e.target.value)}
                            className="bg-transparent border-none text-sm outline-none w-full cursor-pointer text-gray-700"
                        >
                            <option value="all">Semua Anggota</option>
                            <option value="premium">Hanya Member Premium</option>
                            <option value="reguler">Hanya Member Reguler</option>
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 w-full sm:w-auto">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select 
                            value={eventType} 
                            onChange={e => setEventType(e.target.value)}
                            className="bg-transparent border-none text-sm outline-none w-full cursor-pointer text-gray-700"
                        >
                            <option value="all">Semua Kegiatan</option>
                            <option value="premium">Kegiatan Premium</option>
                            <option value="umum">Kegiatan Umum</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 w-full sm:w-auto">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select 
                            value={roleType} 
                            onChange={e => setRoleType(e.target.value)}
                            className="bg-transparent border-none text-sm outline-none w-full cursor-pointer text-gray-700"
                        >
                            <option value="all">Semua Role</option>
                            <option value="pengurus">Hanya Pengurus</option>
                            <option value="anggota">Hanya Anggota</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                    Memuat data leaderboard...
                </div>
            ) : (
                <div className="p-0">
                    <DataTable 
                        data={leaderboard} 
                        columns={columns} 
                        searchKeys={['nama', 'asal_sekolah']} 
                        pageSize={15}
                    />
                </div>
            )}
        </div>
    );
}
