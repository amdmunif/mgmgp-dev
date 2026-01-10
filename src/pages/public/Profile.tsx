import { useState } from 'react';
import { MOCK_PROFILE } from '../../lib/mock';
import { cn } from '../../lib/utils';
import { User } from 'lucide-react';

type Tab = 'visi-misi' | 'sejarah' | 'struktur';

export function Profile() {
    const [activeTab, setActiveTab] = useState<Tab>('visi-misi');

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900">Tentang Kami</h1>
                <p className="text-gray-500 mt-2">Mengenal lebih dekat MGMP Informatika Kabupaten Wonosobo.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex justify-center mb-8 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('visi-misi')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative",
                        activeTab === 'visi-misi' ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    Visi & Misi
                    {activeTab === 'visi-misi' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('sejarah')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative",
                        activeTab === 'sejarah' ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    Sejarah
                    {activeTab === 'sejarah' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('struktur')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative",
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
                            <p className="text-lg text-center text-gray-700 leading-relaxed italic">"{MOCK_PROFILE.visi}"</p>
                        </div>
                        <hr className="border-gray-100" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Misi</h2>
                            <ul className="space-y-3">
                                {MOCK_PROFILE.misi.map((item, idx) => (
                                    <li key={idx} className="flex gap-3 text-gray-700">
                                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-sm">{idx + 1}</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'sejarah' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Sejarah Singkat</h2>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{MOCK_PROFILE.sejarah}</p>
                        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                            <p><strong>Catatan:</strong> Sejarah lengkap dapat ditambahkan melalui panel admin.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'struktur' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
                        {MOCK_PROFILE.struktur.map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
                                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-white shadow-md bg-gray-200 flex items-center justify-center">
                                    {item.image ? (
                                        <img src={item.image} alt={item.nama} className="w-full h-full object-cover" onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }} />
                                    ) : null}
                                    <User className={cn("w-10 h-10 text-gray-400", item.image ? "hidden" : "")} />
                                </div>
                                <h3 className="font-bold text-gray-900">{item.nama}</h3>
                                <span className="text-primary-600 font-medium text-sm mb-1">{item.jabatan}</span>
                                <span className="text-xs text-gray-500">NIP. {item.nip}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
