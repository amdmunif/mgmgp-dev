import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { User, Loader2 } from 'lucide-react';
import { api, getFileUrl } from '../../lib/api';
import type { SiteSettings } from '../../types';

type Tab = 'visi-misi' | 'sejarah' | 'struktur';

export function Profile() {
    const [activeTab, setActiveTab] = useState<Tab>('visi-misi');
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await api.get<SiteSettings>('/settings');
                setSettings(data);
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const parseJson = (data: any, fallback: any = []) => {
        if (!data) return fallback;
        if (typeof data !== 'string') return data;
        try {
            return JSON.parse(data);
        } catch (e) {
            return fallback;
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    const visi = settings?.profile_visi || 'Visi belum diatur';
    const misi = parseJson(settings?.profile_misi, []);
    const sejarah = settings?.profile_sejarah || 'Sejarah belum diatur';
    const struktur = parseJson(settings?.profile_struktur, []);

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900">Tentang Kami</h1>
                <p className="text-gray-500 mt-2">Mengenal lebih dekat MGMP Informatika Kabupaten Wonosobo.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex justify-center mb-8 border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('visi-misi')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap",
                        activeTab === 'visi-misi' ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    Visi & Misi
                    {activeTab === 'visi-misi' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('sejarah')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap",
                        activeTab === 'sejarah' ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    Sejarah
                    {activeTab === 'sejarah' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('struktur')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap",
                        activeTab === 'struktur' ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    Struktur Organisasi
                    {activeTab === 'struktur' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
                </button>
            </div>

            {/* Tab Content */}
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
                {activeTab === 'visi-misi' && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Visi</h2>
                            <p className="text-lg text-center text-gray-700 leading-relaxed italic">"{visi}"</p>
                        </div>
                        <hr className="border-gray-100" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Misi</h2>
                            <ul className="space-y-3">
                                {Array.isArray(misi) && misi.map((item: string, idx: number) => (
                                    <li key={idx} className="flex gap-3 text-gray-700">
                                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-sm">{idx + 1}</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                                {misi.length === 0 && <p className="text-center text-gray-400">Misi belum diatur</p>}
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'sejarah' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Sejarah Singkat</h2>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{sejarah}</p>
                    </div>
                )}

                {activeTab === 'struktur' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
                        {Array.isArray(struktur) && struktur.map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
                                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-white shadow-md bg-gray-200 flex items-center justify-center">
                                    {item.image ? (
                                        <img
                                            src={getFileUrl(item.image)}
                                            alt={item.nama}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <User className={cn("w-10 h-10 text-gray-400", item.image ? "hidden" : "")} />
                                </div>
                                <h3 className="font-bold text-gray-900">{item.nama}</h3>
                                <span className="text-primary-600 font-medium text-sm mb-1">{item.jabatan}</span>
                                {item.nip && <span className="text-xs text-gray-500">NIP. {item.nip}</span>}
                            </div>
                        ))}
                        {struktur.length === 0 && (
                            <div className="col-span-full text-center py-10 text-gray-400">
                                Struktur organisasi belum diatur
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
