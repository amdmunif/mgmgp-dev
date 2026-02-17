import { useState, useEffect } from 'react';
import { BookOpen, Target, Loader2 } from 'lucide-react';
import { curriculumService } from '../../services/curriculumService';
import type { CPData, TPData } from '../../types';

import { useOutletContext } from 'react-router-dom';

export function CPTP() {
    const { setPageHeader } = useOutletContext<any>();
    const [activeTab, setActiveTab] = useState<'CP' | 'TP'>('CP');
    const [loading, setLoading] = useState(false);

    // CP State
    const [cpInformatika, setCpInformatika] = useState<CPData | null>(null);
    const [cpKKA, setCpKKA] = useState<CPData | null>(null);

    // TP State
    const [tps, setTps] = useState<TPData[]>([]);
    const [tpMapel, setTpMapel] = useState<'Informatika' | 'KKA'>('Informatika');
    const [tpKelas, setTpKelas] = useState<string>('7');
    const [tpSemester, setTpSemester] = useState<string>('Ganjil');

    useEffect(() => {
        setPageHeader({
            title: 'Referensi Pembelajaran',
            description: 'Capaian dan Tujuan Pembelajaran Informatika & KKA',
            icon: <BookOpen className="w-6 h-6 text-blue-600" />
        });
    }, []);

    useEffect(() => {
        if (activeTab === 'CP') {
            fetchCPs();
        } else {
            fetchTPs();
        }
    }, [activeTab, tpMapel, tpKelas, tpSemester]);

    const fetchCPs = async () => {
        setLoading(true);
        try {
            const [inf, kka] = await Promise.all([
                curriculumService.getCP('Informatika'),
                curriculumService.getCP('KKA')
            ]);
            setCpInformatika(inf);
            setCpKKA(kka);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTPs = async () => {
        setLoading(true);
        try {
            const data = await curriculumService.getTPs({
                mapel: tpMapel,
                kelas: tpKelas,
                semester: tpSemester
            });
            setTps(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Tabs */}
            <div className="flex justify-center">
                <div className="inline-flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    <button
                        onClick={() => setActiveTab('CP')}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'CP'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <BookOpen className="w-4 h-4" /> Capaian Pembelajaran
                    </button>
                    <button
                        onClick={() => setActiveTab('TP')}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'TP'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <Target className="w-4 h-4" /> Tujuan Pembelajaran
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : activeTab === 'CP' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Informatika */}
                        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
                            <div className="bg-blue-50/50 p-6 border-b border-blue-100">
                                <h2 className="text-xl font-bold text-blue-900">Informatika</h2>
                                <p className="text-sm text-blue-600 mt-1">Capaian Pembelajaran</p>
                            </div>
                            <div className="p-8">
                                {cpInformatika ? (
                                    <div
                                        className="prose prose-blue prose-sm max-w-none text-gray-600 leading-relaxed text-justify"
                                        dangerouslySetInnerHTML={{ __html: cpInformatika.content }}
                                    />
                                ) : (
                                    <p className="text-gray-500 italic text-center py-8">Belum ada data CP Informatika.</p>
                                )}
                            </div>
                        </div>

                        {/* KKA */}
                        <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
                            <div className="bg-green-50/50 p-6 border-b border-green-100">
                                <h2 className="text-xl font-bold text-green-900">KKA</h2>
                                <p className="text-sm text-green-600 mt-1">Keterampilan Komputer & Akomodasi</p>
                            </div>
                            <div className="p-8">
                                {cpKKA ? (
                                    <div
                                        className="prose prose-green prose-sm max-w-none text-gray-600 leading-relaxed text-justify"
                                        dangerouslySetInnerHTML={{ __html: cpKKA.content }}
                                    />
                                ) : (
                                    <p className="text-gray-500 italic text-center py-8">Belum ada data CP KKA.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center justify-center gap-4 bg-white p-2 rounded-xl border border-gray-200 shadow-sm w-fit mx-auto">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setTpMapel('Informatika')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${tpMapel === 'Informatika' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Informatika
                                </button>
                                <button
                                    onClick={() => setTpMapel('KKA')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${tpMapel === 'KKA' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    KKA
                                </button>
                            </div>

                            <div className="h-6 w-px bg-gray-300 hidden md:block" />

                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {['7', '8', '9'].map((k) => (
                                    <button
                                        key={k}
                                        onClick={() => setTpKelas(k)}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${tpKelas === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Kelas {k}
                                    </button>
                                ))}
                            </div>

                            <div className="h-6 w-px bg-gray-300 hidden md:block" />

                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {['Ganjil', 'Genap'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setTpSemester(s)}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${tpSemester === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Semester {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {tps.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {tps.map((tp, index) => (
                                        <div key={tp.id} className="p-6 hover:bg-gray-50 transition-colors group">
                                            <div className="flex gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {index + 1}
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {tp.code && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                                {tp.code}
                                                            </span>
                                                        )}
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            {tp.materi}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-900 leading-relaxed">
                                                        {tp.tujuan}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-gray-50">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <Target className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">Belum ada data</h3>
                                    <p className="text-gray-500 mt-1">Tidak ada Tujuan Pembelajaran untuk filter yang dipilih.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
