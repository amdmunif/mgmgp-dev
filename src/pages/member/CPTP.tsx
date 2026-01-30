import { useState } from 'react';
import { BookOpen, Target, Tag } from 'lucide-react';

export function CPTP() {
    const [activeTab, setActiveTab] = useState<'CP' | 'TP'>('CP');

    // Filters State
    const [selectedMapel, setSelectedMapel] = useState<'Informatika' | 'KKA'>('Informatika');
    const [selectedKelas, setSelectedKelas] = useState<'7' | '8' | '9'>('7');
    const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

    // Mock Data for TP
    const tpData = [
        {
            id: 1,
            mapel: 'Informatika',
            kelas: '7',
            semester: 'Ganjil',
            tujuan: 'Membedakan fakta dan opini.',
            tag: 'Mengenal Fakta dan Opini'
        },
        {
            id: 2,
            mapel: 'Informatika',
            kelas: '7',
            semester: 'Ganjil',
            tujuan: 'Mendeskripsikan komponen, fungsi, dan cara kerja komputer.',
            tag: 'Sistem Komputer'
        },
        {
            id: 3,
            mapel: 'Informatika',
            kelas: '7',
            semester: 'Ganjil',
            tujuan: 'Mengenal ekosistem media pers digital.',
            tag: 'Literasi Digital'
        },
        {
            id: 4,
            mapel: 'Informatika',
            kelas: '7',
            semester: 'Ganjil',
            tujuan: 'Memahami cara kerja dan penggunaan mesin pencari di internet.',
            tag: 'Pengenalan Mesin Pencari'
        },
        {
            id: 5,
            mapel: 'Informatika',
            kelas: '7',
            semester: 'Ganjil',
            tujuan: 'Mengetahui kredibilitas sumber informasi digital.',
            tag: 'Informasi Digital'
        },
        {
            id: 6,
            mapel: 'Informatika',
            kelas: '8',
            semester: 'Ganjil',
            tujuan: 'Memahami konsep himpunan data terstruktur dalam kehidupan sehari-hari.',
            tag: 'Berpikir Komputasional'
        },
        {
            id: 7,
            mapel: 'KKA',
            kelas: '9',
            semester: 'Genap',
            tujuan: 'Menggunakan aplikasi perkantoran untuk pengolahan data dan presentasi.',
            tag: 'Aplikasi Perkantoran'
        }
    ];

    const filteredData = tpData.filter(item =>
        item.mapel === selectedMapel &&
        item.kelas === selectedKelas &&
        item.semester === selectedSemester
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
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Berpikir Komputasional</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                                        Pada akhir fase D, peserta didik mampu memahami konsep himpunan data terstruktur dalam kehidupan sehari-hari, memahami konsep lembar kerja pengolah data dan menerapkan berpikir komputasional dalam menyelesaikan persoalan yang mengandung himpunan data berstruktur sederhana dengan volume kecil, dan mendisposisikan berpikir komputasional yang diperlukan pada berbagai bidang; mampu menuliskan sekumpulan instruksi dengan menggunakan sekumpulan kosakata terbatas atau simbol dalam format pseudocode.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Literasi Digital</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                                        Pada akhir fase D, peserta didik mampu memahami cara kerja dan penggunaan mesin pencari di internet, mengetahui kredibilitas sumber informasi digital dan mengenal ekosistem media pers digital, membedakan fakta dan opini, memahami pemanfaatan perkakas teknologi digital untuk membuat laporan, presentasi, serta analisis dan interpretasi data, mampu mendeskripsikan komponen, fungsi, dan cara kerja komputer; memahami konsep dan penerapan konektivitas jaringan lokal dan internet baik kabel maupun nirkabel, mengetahui jenis ruang publik virtual, memahami pemanfaatan media digital untuk produksi dan diseminasi konten; mampu memahami pentingnya menjaga rekam jejak digital, mengamalkan toleransi dan empati di dunia digital, memahami dampak perundungan digital, membuat kata sandi yang kuat, serta memahami etika dalam berkomunikasi di ruang digital.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: KKA */}
                        <div className="bg-green-50/50 rounded-xl border border-green-100 overflow-hidden">
                            <div className="bg-green-100 p-4 border-b border-green-200">
                                <h2 className="text-lg font-bold text-green-800">Keterampilan Komputer & Akomodasi (KKA)</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Mekanisme & Prosedur</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                                        Menerapkan berpikir komputasional untuk masalah sehari-hari maupun komputasi. Memahami konsep himpunan data terstruktur dan lembar kerja pengolah data. Menyelesaikan persoalan dengan data berstruktur sederhana. Menuliskan instruksi menggunakan kosakata terbatas atau simbol (pseudocode).
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Penggunaan Perangkat Lunak</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                                        Menggunakan mesin pencari dan mengevaluasi kualitas informasi digital. Mengenal ekosistem media pers digital, membedakan fakta, opini, dan hoaks. Memanfaatkan aplikasi pengolah dokumen, lembar kerja, presentasi. Memahami komponen, fungsi, cara kerja komputer, serta konektivitas jaringan.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Algoritma & Pemrograman Dasar</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                                        Menulis teks algoritmik terstruktur (logis, sistematis, bertahap). Membuat instruksi yang dapat dijalankan manusia maupun komputer. Menerapkan paradigma pemrograman prosedural dengan kompleksitas bertahap.
                                    </p>
                                </div>
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
                            {filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <div key={item.id} className="flex gap-4 group">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                                            <p className="text-gray-800 font-medium text-lg mb-2">{item.tujuan}</p>
                                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                <Tag className="w-3 h-3" />
                                                {item.tag}
                                            </div>
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
