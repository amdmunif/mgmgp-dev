import { useState, useEffect, useMemo } from 'react';
import { 
    X, School, Users, MapPin, CheckCircle2, 
    XCircle, Search, Copy, Check, 
    FileSpreadsheet, Sparkles, Building, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';
import { schoolService } from '../../services/schoolService';
import { getSchoolsList, KECAMATAN_LIST, type SchoolItem } from '../../data/schoolsData';
import { 
    exportEventSchoolCoverageExcel, 
    type SchoolCoverageExportItem, 
    type KecamatanCoverageSummary,
    type EventCoverageExportInfo 
} from '../../utils/exportEventSchoolCoverageExcel';

interface ParticipantItem {
    user_id: string;
    nama: string;
    email?: string;
    asal_sekolah?: string;
    no_hp?: string;
}

interface EventSchoolCoverageModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: EventCoverageExportInfo;
    participants: ParticipantItem[];
}

export function EventSchoolCoverageModal({
    isOpen,
    onClose,
    event,
    participants
}: EventSchoolCoverageModalProps) {
    const [schools, setSchools] = useState<SchoolItem[]>(getSchoolsList());
    const [selectedTab, setSelectedTab] = useState<'all' | 'unregistered' | 'registered'>('unregistered');
    const [selectedKecamatan, setSelectedKecamatan] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [copiedWA, setCopiedWA] = useState<boolean>(false);

    // Fetch fresh schools from API
    useEffect(() => {
        if (isOpen) {
            schoolService.getSchools().then(data => {
                if (data && data.length > 0) {
                    setSchools(data);
                }
            }).catch(err => {
                console.error('Failed to load fresh schools catalog', err);
            });
        }
    }, [isOpen]);

    // Helper to normalize strings for comparison
    const cleanSchoolName = (name: string) => {
        return name
            .toLowerCase()
            .replace(/smp\s*n\s*/g, 'smp negeri ')
            .replace(/mts\s*n\s*/g, 'mts negeri ')
            .replace(/[^a-z0-9]/g, '')
            .trim();
    };

    // Analyze School Coverage
    const { 
        schoolCoverageList, 
        totalSchools, 
        registeredCount, 
        unregisteredCount, 
        coveragePercentage,
        kecamatanSummaries,
        activeKecamatanCount
    } = useMemo(() => {
        // Build map of normalized participant school names
        const participantSchoolMap = new Map<string, ParticipantItem[]>();
        
        participants.forEach(p => {
            if (!p.asal_sekolah) return;
            const clean = cleanSchoolName(p.asal_sekolah);
            if (!participantSchoolMap.has(clean)) {
                participantSchoolMap.set(clean, []);
            }
            participantSchoolMap.get(clean)!.push(p);
        });

        // Match with master schools
        const coverageList: SchoolCoverageExportItem[] = schools.map(sch => {
            const cleanMaster = cleanSchoolName(sch.nama);
            
            // Exact cleaned match
            let matchedParticipants = participantSchoolMap.get(cleanMaster) || [];

            // Fallback match: if exact match didn't find, look for inclusion
            if (matchedParticipants.length === 0) {
                for (const [pClean, pList] of participantSchoolMap.entries()) {
                    if (cleanMaster.includes(pClean) || pClean.includes(cleanMaster)) {
                        matchedParticipants = pList;
                        break;
                    }
                }
            }

            return {
                nama: sch.nama,
                kecamatan: sch.kecamatan || 'Luar Wonosobo',
                npsn: sch.npsn,
                isRegistered: matchedParticipants.length > 0,
                participantCount: matchedParticipants.length,
                participantNames: matchedParticipants.map(p => p.nama)
            };
        });

        const total = coverageList.length;
        const reg = coverageList.filter(s => s.isRegistered).length;
        const unreg = total - reg;
        const pct = total > 0 ? (reg / total) * 100 : 0;

        // Group by kecamatan for summary
        const kecMap = new Map<string, { total: number; registered: number }>();
        KECAMATAN_LIST.forEach(k => {
            kecMap.set(k, { total: 0, registered: 0 });
        });

        coverageList.forEach(s => {
            const k = s.kecamatan;
            if (!kecMap.has(k)) {
                kecMap.set(k, { total: 0, registered: 0 });
            }
            const item = kecMap.get(k)!;
            item.total += 1;
            if (s.isRegistered) item.registered += 1;
        });

        const summaries: KecamatanCoverageSummary[] = [];
        let activeKec = 0;

        kecMap.forEach((val, key) => {
            if (val.total > 0) {
                if (val.registered > 0) activeKec++;
                summaries.push({
                    kecamatan: key,
                    totalSchools: val.total,
                    registeredSchools: val.registered,
                    unregisteredSchools: val.total - val.registered,
                    percentage: (val.registered / val.total) * 100
                });
            }
        });

        return {
            schoolCoverageList: coverageList,
            totalSchools: total,
            registeredCount: reg,
            unregisteredCount: unreg,
            coveragePercentage: pct,
            kecamatanSummaries: summaries,
            activeKecamatanCount: activeKec
        };
    }, [schools, participants]);

    // Filtered list for display
    const filteredSchools = useMemo(() => {
        return schoolCoverageList.filter(item => {
            // Tab filter
            if (selectedTab === 'registered' && !item.isRegistered) return false;
            if (selectedTab === 'unregistered' && item.isRegistered) return false;

            // Kecamatan filter
            if (selectedKecamatan !== 'all' && item.kecamatan !== selectedKecamatan) {
                return false;
            }

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = item.nama.toLowerCase().includes(q);
                const matchKec = item.kecamatan.toLowerCase().includes(q);
                const matchNpsn = item.npsn ? item.npsn.includes(q) : false;
                const matchTeacher = item.participantNames.some(t => t.toLowerCase().includes(q));
                return matchName || matchKec || matchNpsn || matchTeacher;
            }

            return true;
        });
    }, [schoolCoverageList, selectedTab, selectedKecamatan, searchQuery]);

    // Copy to WhatsApp message
    const handleCopyWAMessage = () => {
        const unregList = schoolCoverageList.filter(s => !s.isRegistered);
        if (unregList.length === 0) {
            toast.success('Luar biasa! Semua sekolah sudah mendaftar.');
            return;
        }

        // Group unregistered schools by kecamatan
        const grouped = new Map<string, typeof unregList>();
        unregList.forEach(s => {
            if (!grouped.has(s.kecamatan)) {
                grouped.set(s.kecamatan, []);
            }
            grouped.get(s.kecamatan)!.push(s);
        });

        let msg = `*📌 DAFTAR SEKOLAH BELUM MENDAFTAR*\n`;
        msg += `*Acara:* ${event.title}\n`;
        if (event.date) {
            msg += `*Waktu:* ${new Date(event.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}\n`;
        }
        msg += `*Status:* ${unregisteredCount} dari ${totalSchools} Sekolah Belum Terwakili\n\n`;
        msg += `Mohon bantuan rekan-rekan Pengurus Sub-Rayon MGMP Informatika untuk saling mengingatkan perwakilan sekolah berikut:\n\n`;

        grouped.forEach((list, kec) => {
            msg += `📍 *KECAMATAN ${kec.toUpperCase()}* (${list.length} Belum Daftar):\n`;
            list.forEach(s => {
                msg += `• ${s.nama}\n`;
            });
            msg += `\n`;
        });

        msg += `Mari sukseskan pemerataan partisipasi kegiatan MGMP Informatika Wonosobo. Terima kasih! 🙏`;

        navigator.clipboard.writeText(msg).then(() => {
            setCopiedWA(true);
            toast.success('Daftar sekolah siap dibagikan ke WhatsApp!');
            setTimeout(() => setCopiedWA(false), 3000);
        }).catch(() => {
            toast.error('Gagal menyalin teks ke clipboard');
        });
    };

    const handleExportExcel = () => {
        try {
            exportEventSchoolCoverageExcel(event, schoolCoverageList, kecamatanSummaries);
            toast.success('File Excel pemerataan sekolah berhasil diunduh');
        } catch (err) {
            console.error('Failed to export coverage excel', err);
            toast.error('Gagal mengekspor data ke Excel');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
                
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <School className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-gray-900 leading-tight">Analisis Pemerataan Sekolah</h2>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Coverage Tool
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-xl">
                                Acara: <strong className="text-gray-800 font-semibold">{event.title}</strong>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={handleCopyWAMessage}
                            variant="outline" 
                            size="sm"
                            className="hidden sm:inline-flex border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 shadow-sm text-xs font-semibold h-9"
                            title="Salin daftar sekolah yang belum mendaftar ke format WhatsApp"
                        >
                            {copiedWA ? <Check className="w-4 h-4 mr-1.5 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1.5 text-emerald-600" />}
                            {copiedWA ? 'Tersalin!' : 'Salin Format WA'}
                        </Button>

                        <Button 
                            onClick={handleExportExcel}
                            size="sm"
                            className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs font-semibold h-9"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                            Unduh Rekap Excel
                        </Button>

                        <button 
                            onClick={onClose}
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    
                    {/* KPI Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {/* 1. Rasio Pemerataan */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-md shadow-emerald-500/10 relative overflow-hidden">
                            <div className="absolute -right-3 -bottom-3 opacity-15">
                                <School className="w-24 h-24" />
                            </div>
                            <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Tingkat Pemerataan</span>
                            <div className="text-2xl sm:text-3xl font-black mt-1">
                                {coveragePercentage.toFixed(1)}%
                            </div>
                            <p className="text-xs text-emerald-100 mt-1">
                                <strong>{registeredCount}</strong> dari {totalSchools} sekolah
                            </p>
                        </div>

                        {/* 2. Sekolah Belum Terwakili */}
                        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-4 text-white shadow-md shadow-rose-500/10 relative overflow-hidden">
                            <div className="absolute -right-3 -bottom-3 opacity-15">
                                <XCircle className="w-24 h-24" />
                            </div>
                            <span className="text-xs font-medium text-rose-100 uppercase tracking-wider">Belum Ada Peserta</span>
                            <div className="text-2xl sm:text-3xl font-black mt-1">
                                {unregisteredCount} <span className="text-sm font-normal text-rose-200">Sekolah</span>
                            </div>
                            <p className="text-xs text-rose-100 mt-1">
                                Target utama follow-up panitia
                            </p>
                        </div>

                        {/* 3. Cakupan Kecamatan */}
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-md shadow-blue-500/10 relative overflow-hidden">
                            <div className="absolute -right-3 -bottom-3 opacity-15">
                                <MapPin className="w-24 h-24" />
                            </div>
                            <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">Cakupan Wilayah</span>
                            <div className="text-2xl sm:text-3xl font-black mt-1">
                                {activeKecamatanCount} / 15
                            </div>
                            <p className="text-xs text-blue-100 mt-1">
                                Kecamatan memiliki perwakilan
                            </p>
                        </div>

                        {/* 4. Total Guru Peserta */}
                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-4 text-white shadow-md shadow-purple-500/10 relative overflow-hidden">
                            <div className="absolute -right-3 -bottom-3 opacity-15">
                                <Users className="w-24 h-24" />
                            </div>
                            <span className="text-xs font-medium text-purple-100 uppercase tracking-wider">Total Guru Terdaftar</span>
                            <div className="text-2xl sm:text-3xl font-black mt-1">
                                {participants.length} <span className="text-sm font-normal text-purple-200">Guru</span>
                            </div>
                            <p className="text-xs text-purple-100 mt-1">
                                Peserta aktif pada kegiatan ini
                            </p>
                        </div>
                    </div>

                    {/* Quick Kecamatan Progress Grid (Visual Overview) */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-slate-600" />
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Partisipasi 15 Kecamatan Se-Kabupaten Wonosobo
                                </h3>
                            </div>
                            <span className="text-[11px] text-slate-500">Klik kecamatan untuk menyaring daftar</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {kecamatanSummaries.slice(0, 15).map(k => {
                                const isSelected = selectedKecamatan === k.kecamatan;
                                const isFull = k.percentage === 100;
                                const isZero = k.registeredSchools === 0;

                                return (
                                    <button
                                        key={k.kecamatan}
                                        onClick={() => setSelectedKecamatan(isSelected ? 'all' : k.kecamatan)}
                                        className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between gap-1.5 ${
                                            isSelected 
                                                ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-sm' 
                                                : isZero
                                                    ? 'bg-rose-50/40 border-rose-200 hover:bg-rose-50 text-gray-700'
                                                    : isFull
                                                        ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50 text-gray-700'
                                                        : 'bg-white border-gray-200/90 hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-bold truncate text-[11px]">{k.kecamatan}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                                isZero 
                                                    ? 'bg-rose-100 text-rose-700' 
                                                    : isFull 
                                                        ? 'bg-emerald-100 text-emerald-700' 
                                                        : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {k.registeredSchools}/{k.totalSchools}
                                            </span>
                                        </div>

                                        {/* Mini progress bar */}
                                        <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isZero ? 'bg-rose-400' : isFull ? 'bg-emerald-500' : 'bg-blue-500'
                                                }`}
                                                style={{ width: `${Math.max(k.percentage, 5)}%` }}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Filter & Controls Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                        {/* Tab Toggle */}
                        <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                            <button
                                onClick={() => setSelectedTab('unregistered')}
                                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    selectedTab === 'unregistered'
                                        ? 'bg-white text-rose-700 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                Belum Mendaftar ({unregisteredCount})
                            </button>

                            <button
                                onClick={() => setSelectedTab('registered')}
                                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    selectedTab === 'registered'
                                        ? 'bg-white text-emerald-700 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                Sudah Mendaftar ({registeredCount})
                            </button>

                            <button
                                onClick={() => setSelectedTab('all')}
                                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    selectedTab === 'all'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Layers className="w-3.5 h-3.5 text-gray-500" />
                                Semua ({totalSchools})
                            </button>
                        </div>

                        {/* Search & Kecamatan Selector */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 sm:w-60">
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    placeholder="Cari sekolah, NPSN, guru..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                                />
                            </div>

                            <div className="relative">
                                <select
                                    value={selectedKecamatan}
                                    onChange={(e) => setSelectedKecamatan(e.target.value)}
                                    className="pl-3 pr-8 py-1.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                                >
                                    <option value="all">Semua Kecamatan</option>
                                    {KECAMATAN_LIST.map(kec => (
                                        <option key={kec} value={kec}>Kec. {kec}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-600">
                                <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4 w-12 text-center">No</th>
                                        <th className="py-3 px-4">Nama Sekolah</th>
                                        <th className="py-3 px-4">Kecamatan</th>
                                        <th className="py-3 px-4">NPSN</th>
                                        <th className="py-3 px-4 text-center">Status Partisipasi</th>
                                        <th className="py-3 px-4">Guru Pendaftar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredSchools.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-10 text-gray-400">
                                                Tidak ada sekolah yang cocok dengan filter yang dipilih.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSchools.map((item, idx) => (
                                            <tr 
                                                key={item.nama}
                                                className={`hover:bg-gray-50/80 transition-colors ${
                                                    !item.isRegistered ? 'bg-rose-50/20' : ''
                                                }`}
                                            >
                                                <td className="py-3 px-4 text-center font-medium text-gray-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <School className={`w-4 h-4 shrink-0 ${
                                                            item.isRegistered ? 'text-emerald-600' : 'text-rose-400'
                                                        }`} />
                                                        <span>{item.nama}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                                                        <MapPin className="w-3 h-3 text-blue-500" />
                                                        {item.kecamatan}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                                                    {item.npsn || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {item.isRegistered ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                            {item.participantCount} Guru Terdaftar
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                            <XCircle className="w-3 h-3 text-rose-600" />
                                                            Belum Ada Peserta
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {item.participantNames.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.participantNames.map((name, i) => (
                                                                <span 
                                                                    key={i} 
                                                                    className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium"
                                                                >
                                                                    {name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[11px]">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Modal */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                    <div>
                        Menampilkan <strong>{filteredSchools.length}</strong> sekolah (Filter: <em>{selectedTab === 'unregistered' ? 'Belum Mendaftar' : selectedTab === 'registered' ? 'Sudah Mendaftar' : 'Semua Sekolah'}</em>, Kec: <em>{selectedKecamatan === 'all' ? 'Semua' : selectedKecamatan}</em>).
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button 
                            onClick={handleCopyWAMessage}
                            variant="outline" 
                            size="sm"
                            className="sm:hidden w-full border-emerald-300 text-emerald-700 bg-white"
                        >
                            <Copy className="w-4 h-4 mr-1 text-emerald-600" />
                            Salin Format WA
                        </Button>
                        <Button 
                            onClick={handleExportExcel}
                            size="sm"
                            className="sm:hidden w-full bg-emerald-600 text-white"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-1" />
                            Unduh Excel
                        </Button>
                        <Button 
                            onClick={onClose}
                            variant="outline" 
                            size="sm"
                            className="w-full sm:w-auto"
                        >
                            Tutup
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
