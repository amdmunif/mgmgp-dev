import { useState, useEffect, useMemo } from 'react';
import { Gamepad2, Play, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { gameService } from '../../services/gameService';
import type { Game } from '../../types';
import { useOutletContext } from 'react-router-dom';
import { DataTable } from '../../components/ui/DataTable';

export function Games() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const { setPageHeader } = useOutletContext<any>();
    const [filterAccess, setFilterAccess] = useState('all');

    useEffect(() => {
        setPageHeader({
            title: 'Bank Games Edukasi',
            description: 'Belajar sambil bermain dengan koleksi game interaktif.',
            icon: <Gamepad2 className="w-6 h-6 text-purple-600" />
        });
    }, [setPageHeader]);

    useEffect(() => {
        const loadGames = async () => {
            try {
                const data = await gameService.getAll();
                setGames(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadGames();
    }, []);

    const filteredGames = useMemo(() => {
        if (filterAccess === 'Premium') return games.filter(g => g.is_premium);
        if (filterAccess === 'Gratis') return games.filter(g => !g.is_premium);
        return games;
    }, [games, filterAccess]);

    const columns = useMemo(() => [
        {
            header: "Game Edukasi",
            accessorKey: "title" as keyof Game,
            cell: (item: Game) => (
                <div className="flex items-start gap-4 py-1">
                    <div className="flex-shrink-0 w-16 h-12 bg-purple-50 rounded-lg border border-purple-100 flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                            <Gamepad2 className="w-6 h-6 text-purple-300" />
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {item.title}
                            {item.is_premium && (
                                <span className="ml-2 inline-block bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-yellow-200 align-middle">
                                    Premium
                                </span>
                            )}
                        </div>
                        {item.description && <div className="text-sm text-gray-500 line-clamp-2 mt-0.5">{item.description}</div>}
                    </div>
                </div>
            )
        },
        {
            header: "Aksi",
            cell: (item: Game) => (
                <div className="flex justify-end pr-2 gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="bg-white hover:bg-gray-50 text-gray-600 h-8"
                        onClick={() => {
                            navigator.clipboard.writeText(item.link_url);
                            toast.success('Link disalin ke clipboard');
                        }}
                        title="Copy Link"
                    >
                        <Copy className="w-4 h-4" />
                    </Button>
                    <a href={item.link_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 w-24">
                            <Play className="w-4 h-4 mr-1.5" /> Mainkan
                        </Button>
                    </a>
                </div>
            ),
            className: "w-40 text-right"
        }
    ], []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Memuat data game...</div>
                ) : (
                    <DataTable
                        data={filteredGames}
                        columns={columns}
                        searchKeys={['title', 'description']}
                        pageSize={10}
                        filterContent={
                            <select
                                className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 h-[38px] w-auto"
                                value={filterAccess}
                                onChange={(e) => setFilterAccess(e.target.value)}
                            >
                                <option value="all">Semua Akses</option>
                                <option value="Gratis">Akses Publik</option>
                                <option value="Premium">Khusus Premium</option>
                            </select>
                        }
                    />
                )}
            </div>
        </div>
    );
}
