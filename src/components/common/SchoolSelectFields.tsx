import React, { useState, useEffect } from 'react';
import { School, MapPin, Info, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { KECAMATAN_LIST, getSchoolsByKecamatan, findSchoolByName, matchSchoolFuzzy, getSchoolsList, type SchoolItem } from '../../data/schoolsData';
import { schoolService } from '../../services/schoolService';

interface SchoolSelectFieldsProps {
    value: string;
    onChange: (schoolName: string) => void;
    error?: string;
    required?: boolean;
    className?: string;
    showBadge?: boolean;
    label?: string;
    schools?: SchoolItem[];
}

export function SchoolSelectFields({
    value,
    onChange,
    error,
    required = false,
    className = '',
    showBadge = true,
    label = 'Asal Sekolah',
    schools: propSchools
}: SchoolSelectFieldsProps) {
    const [manualKecamatan, setManualKecamatan] = useState<string>('');
    const [isCustomSelected, setIsCustomSelected] = useState<boolean>(false);
    const [loadedSchools, setLoadedSchools] = useState<SchoolItem[]>(propSchools || getSchoolsList());

    useEffect(() => {
        if (propSchools && propSchools.length > 0) {
            setLoadedSchools(propSchools);
        } else {
            schoolService.getSchools().then((data) => {
                if (data && data.length > 0) {
                    setLoadedSchools(data);
                }
            });
        }
    }, [propSchools]);

    // Derive matched official school from value using dynamic list
    const matchedSchool = findSchoolByName(value, loadedSchools) || matchSchoolFuzzy(value, loadedSchools);

    // Derived active kecamatan
    const activeKecamatan = manualKecamatan || (matchedSchool ? matchedSchool.kecamatan : '');

    // In custom mode if user explicitly selected custom, or selected 'Lainnya', or if value is set but doesn't match official
    const isCustomMode = isCustomSelected || activeKecamatan === 'Lainnya' || (!matchedSchool && Boolean(value.trim()));

    // Active school choice for dropdown
    const activeSchoolChoice = isCustomMode
        ? '__CUSTOM__'
        : (matchedSchool ? matchedSchool.nama : (value ? '__CUSTOM__' : ''));

    const schoolsInKecamatan = activeKecamatan && activeKecamatan !== 'Lainnya'
        ? getSchoolsByKecamatan(activeKecamatan, loadedSchools)
        : [];

    const isOfficialSchool = Boolean(matchedSchool && !isCustomMode);

    const handleKecamatanChange = (kec: string) => {
        setManualKecamatan(kec);
        if (kec === 'Lainnya') {
            setIsCustomSelected(true);
        } else {
            setIsCustomSelected(false);
        }
        onChange('');
    };

    const handleSchoolChange = (schoolVal: string) => {
        if (schoolVal === '__CUSTOM__') {
            setIsCustomSelected(true);
            onChange('');
        } else {
            setIsCustomSelected(false);
            onChange(schoolVal);
        }
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleCustomBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        onChange(e.target.value.trim());
    };

    return (
        <div className={`space-y-3 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm ${className}`}>
            <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <School className="w-4 h-4 text-primary-600" />
                    <span>{label}</span>
                    {required && <span className="text-red-500">*</span>}
                </label>
                {showBadge && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-200">
                        {isOfficialSchool ? (
                            <>
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                <span>Terstandarisasi</span>
                            </>
                        ) : (
                            <span>Standarisasi MGMP</span>
                        )}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Dropdown 1: Kecamatan */}
                <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary-600" />
                        <span>1. Kecamatan Sekolah</span>
                        {required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                        <select
                            value={activeKecamatan}
                            onChange={(e) => handleKecamatanChange(e.target.value)}
                            className="block w-full rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 py-2.5 px-3.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none appearance-none cursor-pointer pr-10 hover:border-gray-300"
                        >
                            <option value="">-- Pilih Kecamatan --</option>
                            {KECAMATAN_LIST.map((kec) => (
                                <option key={kec} value={kec}>
                                    Kec. {kec}
                                </option>
                            ))}
                            <option value="Lainnya">Luar Wonosobo / Lainnya</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 px-3 flex items-center pointer-events-none text-gray-400">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* Dropdown 2: Nama Sekolah */}
                <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-primary-600" />
                        <span>2. Nama Sekolah</span>
                        {required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                        <select
                            value={activeSchoolChoice}
                            disabled={!activeKecamatan || activeKecamatan === 'Lainnya'}
                            onChange={(e) => handleSchoolChange(e.target.value)}
                            className={`block w-full rounded-xl border bg-white shadow-sm transition-all duration-200 py-2.5 px-3.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none appearance-none cursor-pointer pr-10 ${
                                !activeKecamatan || activeKecamatan === 'Lainnya'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <option value="">
                                {!activeKecamatan
                                    ? 'Pilih kecamatan terlebih dahulu'
                                    : activeKecamatan === 'Lainnya'
                                    ? 'Tuliskan nama sekolah di bawah'
                                    : `-- Pilih Sekolah di Kec. ${activeKecamatan} --`}
                            </option>
                            {schoolsInKecamatan.map((s) => (
                                <option key={s.npsn || s.nama} value={s.nama}>
                                    {s.nama}
                                </option>
                            ))}
                            {activeKecamatan && activeKecamatan !== 'Lainnya' && (
                                <option value="__CUSTOM__" className="font-semibold text-primary-700 bg-amber-50">
                                    + Sekolah Belum Ada di Daftar (Sarankan Baru)
                                </option>
                            )}
                        </select>
                        <div className="absolute inset-y-0 right-0 px-3 flex items-center pointer-events-none text-gray-400">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom school input if needed */}
            {isCustomMode && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start gap-2 text-amber-900 text-xs leading-relaxed">
                        <Info className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                        <div>
                            Tuliskan nama lengkap sekolah Anda jika belum tertera pada daftar di atas. Data tetap tersimpan secara aman.
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1">
                            Nama Sekolah Lengkap {required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="text"
                            value={value}
                            onChange={handleCustomChange}
                            onBlur={handleCustomBlur}
                            placeholder="Contoh: SMP Negeri 4 Satu Atap Kejajar / SMP Islam ..."
                            className="block w-full rounded-xl border border-amber-300 bg-white shadow-sm py-2 px-3.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                        />
                    </div>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-500 font-medium flex items-center animate-in slide-in-from-top-1 ml-0.5">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
}
