import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, School, Users, MapPin, CheckCircle2, 
    XCircle, Search, Copy, Check, 
    FileSpreadsheet, Sparkles, Building, Layers, 
    Calendar, Loader2, ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../../components/ui/button';
import { contentManagementService } from '../../../services/contentManagementService';
import { schoolService } from '../../../services/schoolService';
import { getSchoolsList, KECAMATAN_LIST, type SchoolItem } from '../../../data/schoolsData';
import { 
    exportEventSchoolCoverageExcel, 
    type SchoolCoverageExportItem, 
    type KecamatanCoverageSummary,
    type EventCoverageExportInfo 
} from '../../../utils/exportEventSchoolCoverageExcel';

interface ParticipantItem {
    user_id: string;
    nama: string;
    email?: string;
    asal_sekolah?: string;
    no_hp?: string;
}

export function AdminEventSchoolCoverage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [event, setEvent] = useState<any>(null);
    const [participants, setParticipants] = useState<ParticipantItem[]>([]);
    const [schools, setSchools] = useState<SchoolItem[]>(getSchoolsList());
    const [loading, setLoading] = useState(true);

    const [selectedTab, setSelectedTab] = useState<'all' | 'unregistered' | 'registered'>('unregistered');
    const [selectedKecamatan, setSelectedKecamatan] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [copiedWA, setCopiedWA] = useState<boolean>(false);

    // Fetch Event, Participants, and fresh Schools catalog
    useEffect(() => {
        if (!id) return;

        const loadData = async () => {
            try {
                setLoading(true);
                const [eventData, participantsData, freshSchools] = await Promise.all([
                    contentManagementService.getEventById(id),
                    contentManagementService.getEventParticipants(id),
                    schoolService.getSchools().catch(() => getSchoolsList())
                ]);

                setEvent(eventData);
                setParticipants(participantsData || []);
                if (freshSchools && freshSchools.length > 0) {
                    setSchools(freshSchools);
                }
            } catch (err) {
                console.error('Failed to load event coverage data', err);
                toast.error('Gagal memuat data acara atau peserta');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    // Helper to normalize school strings for accurate matching
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
        const participantSchoolMap = new Map<string, ParticipantItem[]>();
        
        participants.forEach(p => {
            if (!p.asal_sekolah) return;
            const clean = cleanSchoolName(p.asal_sekolah);
            if (!participantSchoolMap.has(clean)) {
                participantSchoolMap.set(clean, []);
            }
            participantSchoolMap.get(clean)!.push(p);
        });

        const coverageList: SchoolCoverageExportItem[] = schools.map(sch => {
            const cleanMaster = cleanSchoolName(sch.nama);
            
            let matchedParticipants = participantSchoolMap.get(cleanMaster) || [];

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
            if (selectedTab === 'registered' && !item.isRegistered) return false;
            if (selectedTab === 'unregistered' && item.isRegistered) return false;

            if (selectedKecamatan !== 'all' && item.kecamatan !== selectedKecamatan) {
                return false;
            }

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

    // Copy to WhatsApp format
    const handleCopyWAMessage = () => {
        const unregList = schoolCoverageList.filter(s => !s.isRegistered);
        if (unregList.length === 0) {
            toast.success('Luar biasa! Semua sekolah sudah mendaftar.');
            return;
        }

        const grouped = new Map<string, typeof unregList>();
        unregList.forEach(s => {
            if (!grouped.has(s.kecamatan)) {
                grouped.set(s.kecamatan, []);
            }
            grouped.get(s.kecamatan)!.push(s);
        });

        let msg = `*📌 DAFTAR SEKOLAH BELUM MENDAFTAR*\n`;
        msg += `*Acara:* ${event?.title || 'Kegiatan MGMP'}\n`;
        if (event?.date) {
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
            toast.success('Daftar sekolah berhasil disalin untuk WhatsApp!');
            setTimeout(() => setCopiedWA(false), 3000);
        }).catch(() => {
            toast.error('Gagal menyalin teks ke clipboard');
        });
    };

    // Export Excel
    const handleExportExcel = () => {
        if (!event) return;
        try {
            const eventInfo: EventCoverageExportInfo = {
                id: event.id,
                title: event.title,
                date: event.date,
                location: event.location
            };
            exportEventSchoolCoverageExcel(eventInfo, schoolCoverageList, kecamatanSummaries);
            toast.success('File Excel pemerataan sekolah berhasil diunduh');
        } catch (err) {
            console.error('Failed to export coverage excel', err);
            toast.error('Gagal mengekspor data ke Excel');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-sm font-medium text-gray-500">Menganalisis data sebaran sekolah...</p>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 max-w-lg mx-auto mt-12">
                <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900">Acara Tidak Ditemukan</h3>
                <p className="text-sm text-gray-500 mt-1 mb-5">Data acara tidak tersedia atau telah dihapus.</p>
                <Button onClick={() => navigate('/admin/events')} variant="outline">
                    Kembali ke Daftar Acara
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            
            {/* Header & Navigation */}
            <div className="bg-white p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <button
                        onClick={() => navigate(`/admin/events/${id}`)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors mt-0.5 shrink-0 text-gray-500"
                        title="Kembali ke Detail Acara"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                Coverage & Distribution Analytics
                            </span>
                            <span className="text-xs text-gray-400 font-medium">| Acara MGMP Wonosobo</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight tracking-tight">
                            Analisis Pemerataan Sekolah
                        </h1>
                        <p className="text-sm font-semibold text-gray-700 mt-1 flex items-center gap-2">
                            <span>Acara:</span>
                            <span className="text-emerald-700 font-bold underline decoration-emerald-300 underline-offset-4">
                                {event.title}
                            </span>
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 mt-2">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                {event.date ? new Date(event.date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}
                            </span>
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                {event.location || '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pl-12 lg:pl-0 shrink-0">
                    <Button 
                        onClick={handleCopyWAMessage}
                        variant="outline"
                        size="sm"
                        className="border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 shadow-sm h-9 font-semibold text-xs"
                        title="Salin daftar sekolah yang belum mendaftar ke format teks WhatsApp"
                    >
                        {copiedWA ? <Check className="w-4 h-4 mr-1.5 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1.5 text-emerald-600" />}
                        {copiedWA ? 'Tersalin!' : 'Salin Format WA'}
                    </Button>

                    <Button 
                        onClick={handleExportExcel}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9 font-semibold text-xs"
                        title="Unduh laporan Excel 3 sheet lengkap"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                        Unduh Rekap Excel (.xlsx)
                    </Button>

                    <Button 
                        onClick={() => navigate(`/admin/events/${id}`)}
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm h-9 font-medium text-xs"
                    >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        Daftar Peserta
                    </Button>
                </div>
            </div>

            {/* KPI Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Rasio Pemerataan */}
                <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/10 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-15">
                        <School className="w-28 h-28" />
                    </div>
                    <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Tingkat Pemerataan</span>
                    <div className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
                        {coveragePercentage.toFixed(1)}%
                    </div>
                    <p className="text-xs text-emerald-100 mt-1 font-medium">
                        <strong>{registeredCount}</strong> dari {totalSchools} sekolah resmi
                    </p>
                </div>

                {/* 2. Sekolah Belum Terwakili */}
                <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 rounded-3xl p-5 text-white shadow-lg shadow-rose-500/10 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-15">
                        <XCircle className="w-28 h-28" />
                    </div>
                    <span className="text-xs font-bold text-rose-100 uppercase tracking-wider">Belum Ada Peserta</span>
                    <div className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
                        {unregisteredCount} <span className="text-base font-normal text-rose-200">Sekolah</span>
                    </div>
                    <p className="text-xs text-rose-100 mt-1 font-medium">
                        Target prioritas follow-up panitia
                    </p>
                </div>

                {/* 3. Cakupan Kecamatan */}
                <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-lg shadow-blue-500/10 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-15">
                        <MapPin className="w-28 h-28" />
                    </div>
                    <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Cakupan Wilayah</span>
                    <div className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
                        {activeKecamatanCount} / 15
                    </div>
                    <p className="text-xs text-blue-100 mt-1 font-medium">
                        Kecamatan telah memiliki perwakilan
                    </p>
                </div>

                {/* 4. Total Guru Peserta */}
                <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-800 rounded-3xl p-5 text-white shadow-lg shadow-purple-500/10 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-15">
                        <Users className="w-28 h-28" />
                    </div>
                    <span className="text-xs font-bold text-purple-100 uppercase tracking-wider">Total Guru Terdaftar</span>
                    <div className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
                        {participants.length} <span className="text-base font-normal text-purple-200">Guru</span>
                    </div>
                    <p className="text-xs text-purple-100 mt-1 font-medium">
                        Peserta aktif terdaftar di acara ini
                    </p>
                </div>
            </div>

            {/* Visual Overview 15 Kecamatan Grid */}
            <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                            <Building className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                Partisipasi 15 Kecamatan Se-Kabupaten Wonosobo
                            </h3>
                            <p className="text-xs text-gray-500">Klik kartu kecamatan di bawah untuk langsung menyaring daftar sekolah</p>
                        </div>
                    </div>
                    {selectedKecamatan !== 'all' && (
                        <button
                            onClick={() => setSelectedKecamatan('all')}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 self-start sm:self-auto"
                        >
                            Reset Filter Kecamatan (Tampilkan Semua)
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {kecamatanSummaries.slice(0, 15).map(k => {
                        const isSelected = selectedKecamatan === k.kecamatan;
                        const isFull = k.percentage === 100;
                        const isZero = k.registeredSchools === 0;

                        return (
                            <button
                                key={k.kecamatan}
                                onClick={() => setSelectedKecamatan(isSelected ? 'all' : k.kecamatan)}
                                className={`p-3.5 rounded-2xl text-left border transition-all text-xs flex flex-col justify-between gap-2 cursor-pointer ${
                                    isSelected 
                                        ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-md shadow-blue-500/10' 
                                        : isZero
                                            ? 'bg-rose-50/40 border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-gray-700'
                                            : isFull
                                                ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-gray-700'
                                                : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-bold truncate text-xs text-gray-900">{k.kecamatan}</span>
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                        isZero 
                                            ? 'bg-rose-100 text-rose-700' 
                                            : isFull 
                                                ? 'bg-emerald-100 text-emerald-700' 
                                                : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {k.registeredSchools}/{k.totalSchools}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            isZero ? 'bg-rose-500' : isFull ? 'bg-emerald-500' : 'bg-blue-600'
                                        }`}
                                        style={{ width: `${Math.max(k.percentage, 5)}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                                    <span>{k.percentage.toFixed(0)}% terdaftar</span>
                                    {isZero && <span className="text-rose-600 font-bold">0 Peserta</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* School Table Section with Controls */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 p-6 space-y-6">
                
                {/* Control Bar: Tabs + Search + Kecamatan Dropdown */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    
                    {/* Tabs */}
                    <div className="flex items-center bg-gray-100 p-1.5 rounded-2xl w-full lg:w-auto">
                        <button
                            onClick={() => setSelectedTab('unregistered')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                selectedTab === 'unregistered'
                                    ? 'bg-white text-rose-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <XCircle className="w-4 h-4 text-rose-500" />
                            Belum Mendaftar ({unregisteredCount})
                        </button>

                        <button
                            onClick={() => setSelectedTab('registered')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                selectedTab === 'registered'
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Sudah Mendaftar ({registeredCount})
                        </button>

                        <button
                            onClick={() => setSelectedTab('all')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                selectedTab === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Layers className="w-4 h-4 text-gray-500" />
                            Semua Sekolah ({totalSchools})
                        </button>
                    </div>

                    {/* Search & Kecamatan Selector */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative flex-1 sm:w-72">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                            <input
                                type="text"
                                placeholder="Cari nama sekolah, NPSN, atau guru..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium shadow-sm"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={selectedKecamatan}
                                onChange={(e) => setSelectedKecamatan(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white shadow-sm"
                            >
                                <option value="all">Semua Kecamatan</option>
                                {KECAMATAN_LIST.map(kec => (
                                    <option key={kec} value={kec}>Kec. {kec}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-600">
                            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                                <tr>
                                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                                    <th className="py-3.5 px-4">Nama Sekolah</th>
                                    <th className="py-3.5 px-4">Kecamatan</th>
                                    <th className="py-3.5 px-4">NPSN</th>
                                    <th className="py-3.5 px-4 text-center">Status Partisipasi</th>
                                    <th className="py-3.5 px-4">Guru Peserta Terdaftar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSchools.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-400 font-medium">
                                            Tidak ada sekolah yang cocok dengan kriteria filter saat ini.
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
                                            <td className="py-3.5 px-4 text-center font-semibold text-gray-400">
                                                {idx + 1}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-gray-900 text-sm">
                                                <div className="flex items-center gap-2.5">
                                                    <School className={`w-4 h-4 shrink-0 ${
                                                        item.isRegistered ? 'text-emerald-600' : 'text-rose-400'
                                                    }`} />
                                                    <span>{item.nama}</span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                                                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                                    {item.kecamatan}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                                                {item.npsn || '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {item.isRegistered ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        {item.participantCount} Guru Terdaftar
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                        Belum Ada Peserta
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {item.participantNames.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.participantNames.map((name, i) => (
                                                            <span 
                                                                key={i} 
                                                                className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold"
                                                            >
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">Belum ada guru yang mendaftar</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Count */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 pt-2">
                    <span>
                        Menampilkan <strong>{filteredSchools.length}</strong> sekolah dari total <strong>{totalSchools}</strong> sekolah.
                    </span>
                    <div className="flex items-center gap-2 mt-3 sm:mt-0">
                        <Button 
                            onClick={handleCopyWAMessage}
                            variant="outline" 
                            size="sm"
                            className="border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 text-xs font-semibold"
                        >
                            <Copy className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Salin Format WA
                        </Button>
                        <Button 
                            onClick={handleExportExcel}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                            Unduh Rekap Excel
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
}
