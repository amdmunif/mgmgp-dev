import { useState, useEffect } from 'react';
import { Gamepad2, Play } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { gameService } from '../../services/gameService';
import type { Game } from '../../types';
import { useOutletContext } from 'react-router-dom';

export function Games() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const { setPageHeader } = useOutletContext<any>();

    useEffect(() => {
        setPageHeader({
            title: 'Bank Games Edukasi',
            description: 'Belajar sambil bermain dengan koleksi game interaktif.',
            icon: <Gamepad2 className="w-6 h-6 text-purple-600" />
        });
    }, []);

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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {loading ? (
                <div className="text-center py-20 text-gray-500">Memuat games...</div>
            ) : games.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                    <Gamepad2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Belum ada game tersedia.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {games.map((game) => (
                        <div key={game.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all group flex flex-col h-full">
                            <div className={`h-40 bg-purple-50 flex items-center justify-center relative overflow-hidden`}>
                                {game.image_url ? (
                                    <img src={game.image_url} alt={game.title} className="w-full h-full object-cover" />
                                ) : (
                                    <Gamepad2 className="w-16 h-16 text-purple-200" />
                                )}
                                {game.is_premium && (
                                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                        PREMIUM
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{game.title}</h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{game.description}</p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                    <span className="text-xs font-medium text-gray-400">{game.plays_count || 0} Plays</span>
                                    <a href={game.link_url} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                            <Play className="w-4 h-4 mr-1" /> Mainkan
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
