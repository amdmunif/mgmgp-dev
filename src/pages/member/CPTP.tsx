import { useState, useEffect } from 'react';
import { BookOpen, Target } from 'lucide-react';
import { learningService } from '../../services/learningService';
import type { LearningMaterial } from '../../types';

export function CPTP() {
    const [activeTab, setActiveTab] = useState<'CP' | 'TP'>('CP');

    // Filters State
    const [selectedMapel, setSelectedMapel] = useState<'Informatika' | 'KKA'>('Informatika');
    const [selectedKelas, setSelectedKelas] = useState<'7' | '8' | '9'>('7');
    const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

    // State
    const [tpData, setTpData] = useState<LearningMaterial[]>([]);
    const [cpData, setCpData] = useState<LearningMaterial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cps, tps] = await Promise.all([
                    learningService.getAll('cp'),
                    learningService.getAll('tp')
                ]);
                setCpData(cps);
                setTpData(tps);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredData = tpData.filter(item =>
        item.mapel === selectedMapel &&
        item.kelas === selectedKelas &&
        String(item.semester) === selectedSemester
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Referensi Pembelajaran</h1>
                <p className="text-gray-500">Capaian dan Tujuan Pembelajaran Informatika & KKA</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center">
                <div className="inline-flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('CP')}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'CP'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <BookOpen className="w-4 h-4" /> Capaian Pembelajaran
                    </button>
                    <button
                        onClick={() => setActiveTab('TP')}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'TP'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <Target className="w-4 h-4" /> Tujuan Pembelajaran
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[500px]">
                {activeTab === 'CP' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1: Informatika */}
                        <div className="bg-blue-50/50 rounded-xl border border-blue-100 overflow-hidden">
                            <div className="bg-blue-100 p-4 border-b border-blue-200">
                                <h2 className="text-lg font-bold text-blue-800">Informatika</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                {loading && <p className="text-gray-500 text-sm">Loading...</p>}
                                {!loading && cpData.filter(i => i.mapel === 'Informatika').length === 0 && (
                                    <p className="text-gray-500 text-sm italic">Belum ada data CP Informatika.</p>
                                )}
                                {cpData.filter(i => i.mapel === 'Informatika').map(item => (
                                    <div key={item.id}>
                                        <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                                        <div
                                            className="prose prose-sm max-w-none text-gray-600 leading-relaxed text-justify"
                                            dangerouslySetInnerHTML={{ __html: item.content }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column 2: KKA */}
                        <div className="bg-green-50/50 rounded-xl border border-green-100 overflow-hidden">
                            <div className="bg-green-100 p-4 border-b border-green-200">
                                <h2 className="text-lg font-bold text-green-800">Keterampilan Komputer & Akomodasi (KKA)</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                {loading && <p className="text-gray-500 text-sm">Loading...</p>}
                                {!loading && cpData.filter(i => i.mapel === 'KKA').length === 0 && (
                                    <p className="text-gray-500 text-sm italic">Belum ada data CP KKA.</p>
                                )}
                                {cpData.filter(i => i.mapel === 'KKA').map(item => (
                                    <div key={item.id}>
                                        <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                                        <div
                                            className="prose prose-sm max-w-none text-gray-600 leading-relaxed text-justify"
                                            dangerouslySetInnerHTML={{ __html: item.content }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden p-1">
                                <button
                                    onClick={() => setSelectedMapel('Informatika')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${selectedMapel === 'Informatika' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Informatika
                                </button>
                                <button
                                    onClick={() => setSelectedMapel('KKA')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${selectedMapel === 'KKA' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    KKA
                                </button>
                            </div>

                            <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>

                            <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden p-1">
                                {['7', '8', '9'].map((k) => (
                                    <button
                                        key={k}
                                        onClick={() => setSelectedKelas(k as any)}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${selectedKelas === k ? 'bg-slate-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        Kelas {k}
                                    </button>
                                ))}
                            </div>

                            <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>

                            <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden p-1">
                                {['Ganjil', 'Genap'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setSelectedSemester(s as any)}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${selectedSemester === s ? 'bg-slate-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title Display */}
                        <div className="text-center py-4">
                            <h2 className="text-xl font-bold text-gray-800">
                                Tujuan Pembelajaran {selectedMapel} - Kelas {selectedKelas} Semester {selectedSemester}
                            </h2>
                        </div>

                        {/* Results List */}
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-12 text-gray-500">Loading...</div>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <div key={item.id} className="flex gap-4 group">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                                            <p className="text-gray-800 font-medium text-lg mb-2">{item.title}</p>
                                            <div
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                                                dangerouslySetInnerHTML={{ __html: item.content ? `<span class="flex items-center gap-1"><svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>${item.content}</span>` : 'Topik' }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p>Belum ada data Tujuan Pembelajaran untuk filter ini.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
