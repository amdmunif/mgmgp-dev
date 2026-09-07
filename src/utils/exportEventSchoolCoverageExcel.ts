import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export interface SchoolCoverageExportItem {
    nama: string;
    kecamatan: string;
    npsn?: string | null;
    isRegistered: boolean;
    participantCount: number;
    participantNames: string[];
}

export interface KecamatanCoverageSummary {
    kecamatan: string;
    totalSchools: number;
    registeredSchools: number;
    unregisteredSchools: number;
    percentage: number;
}

export interface EventCoverageExportInfo {
    id: string;
    title: string;
    date: string;
    location?: string;
}

function sanitizeFilename(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 40);
}

/**
 * Ekspor data analisis pemerataan sekolah pada acara ke format Excel (.xlsx) dengan 3 lembar kerja (sheets)
 */
export function exportEventSchoolCoverageExcel(
    event: EventCoverageExportInfo,
    schoolsCoverage: SchoolCoverageExportItem[],
    kecamatanSummaries: KecamatanCoverageSummary[]
) {
    const exportTimestamp = format(new Date(), 'dd/MM/yyyy HH:mm');
    const totalSchools = schoolsCoverage.length;
    const registeredSchools = schoolsCoverage.filter(s => s.isRegistered).length;
    const unregisteredSchools = totalSchools - registeredSchools;
    const overallPercentage = totalSchools > 0 ? ((registeredSchools / totalSchools) * 100).toFixed(1) : '0';

    const wb = XLSX.utils.book_new();

    // ==========================================
    // STYLES
    // ==========================================
    const fontMain = { name: 'Arial', sz: 10, color: { rgb: '1F2937' } };
    const fontBold = { name: 'Arial', sz: 10, bold: true, color: { rgb: '111827' } };
    const fontHeader = { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } };
    const fontTitle = { name: 'Arial', sz: 14, bold: true, color: { rgb: '065F46' } };
    const fontSubtitle = { name: 'Arial', sz: 11, bold: true, color: { rgb: '1E40AF' } };

    const thinBorder = {
        top: { style: 'thin', color: { rgb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
        left: { style: 'thin', color: { rgb: 'D1D5DB' } },
        right: { style: 'thin', color: { rgb: 'D1D5DB' } }
    };

    const headerFillEmerald = { fgColor: { rgb: '059669' } };
    const headerFillBlue = { fgColor: { rgb: '2563EB' } };
    const headerFillRed = { fgColor: { rgb: 'DC2626' } };

    const rowEvenFill = { fgColor: { rgb: 'F9FAFB' } };
    const rowWhiteFill = { fgColor: { rgb: 'FFFFFF' } };

    // ==========================================
    // SHEET 1: REKAPITULASI KECAMATAN
    // ==========================================
    const aoa1: (string | number)[][] = [
        ['MGMP INFORMATIKA SMP KABUPATEN WONOSOBO'],
        ['LAPORAN ANALISIS PEMERATAAN PENDAFTARAN SEKOLAH'],
        [`Nama Acara: ${event.title}`],
        [`Tanggal Acara: ${event.date ? format(new Date(event.date), 'dd MMMM yyyy') : '-'} | Lokasi: ${event.location || '-'}`],
        [`Waktu Unduh: ${exportTimestamp} | Total Sekolah Terdaftar: ${registeredSchools}/${totalSchools} (${overallPercentage}%)`],
        [],
        ['NO', 'KECAMATAN', 'TOTAL SEKOLAH', 'SEKOLAH TERDAFTAR', 'BELUM TERDAFTAR', 'PERSENTASE PARTISIPASI']
    ];

    let totalAllKec = 0;
    let totalRegKec = 0;
    let totalUnregKec = 0;

    kecamatanSummaries.forEach((k, idx) => {
        totalAllKec += k.totalSchools;
        totalRegKec += k.registeredSchools;
        totalUnregKec += k.unregisteredSchools;

        aoa1.push([
            idx + 1,
            k.kecamatan.toUpperCase(),
            k.totalSchools,
            k.registeredSchools,
            k.unregisteredSchools,
            `${k.percentage.toFixed(1)}%`
        ]);
    });

    // Total Row
    const totalPercentage = totalAllKec > 0 ? ((totalRegKec / totalAllKec) * 100).toFixed(1) : '0';
    aoa1.push([
        '',
        'TOTAL KESELURUHAN',
        totalAllKec,
        totalRegKec,
        totalUnregKec,
        `${totalPercentage}%`
    ]);

    const ws1 = XLSX.utils.aoa_to_sheet(aoa1);
    ws1['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 24 }];

    // Styling ws1
    const range1 = XLSX.utils.decode_range(ws1['!ref'] || 'A1:F1');
    for (let R = range1.s.r; R <= range1.e.r; ++R) {
        for (let C = range1.s.c; C <= range1.e.c; ++C) {
            const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws1[cellAddr]) continue;

            if (R === 0) ws1[cellAddr].s = { font: fontTitle };
            else if (R === 1) ws1[cellAddr].s = { font: fontSubtitle };
            else if (R >= 2 && R <= 4) ws1[cellAddr].s = { font: { ...fontMain, color: { rgb: '4B5563' } } };
            else if (R === 6) {
                // Table Header
                ws1[cellAddr].s = {
                    font: fontHeader,
                    fill: headerFillEmerald,
                    alignment: { horizontal: C === 0 ? 'center' : C === 1 ? 'left' : 'center', vertical: 'center' },
                    border: thinBorder
                };
            } else if (R > 6 && R < range1.e.r) {
                // Table Body
                const isEven = (R - 7) % 2 === 0;
                ws1[cellAddr].s = {
                    font: fontMain,
                    fill: isEven ? rowWhiteFill : rowEvenFill,
                    alignment: { horizontal: C === 0 || C >= 2 ? 'center' : 'left', vertical: 'center' },
                    border: thinBorder
                };
            } else if (R === range1.e.r) {
                // Table Footer Total
                ws1[cellAddr].s = {
                    font: fontBold,
                    fill: { fgColor: { rgb: 'E5E7EB' } },
                    alignment: { horizontal: C === 0 || C >= 2 ? 'center' : 'left', vertical: 'center' },
                    border: thinBorder
                };
            }
        }
    }

    XLSX.utils.book_append_sheet(wb, ws1, 'Rekapitulasi Kecamatan');

    // ==========================================
    // SHEET 2: SEKOLAH BELUM MENDAFTAR
    // ==========================================
    const unregisteredList = schoolsCoverage.filter(s => !s.isRegistered);
    const aoa2: (string | number)[][] = [
        ['MGMP INFORMATIKA SMP KABUPATEN WONOSOBO'],
        ['DAFTAR SEKOLAH YANG BELUM MENDAFTAR (PERLU FOLLOW-UP)'],
        [`Nama Acara: ${event.title}`],
        [`Total Sekolah Belum Terwakili: ${unregisteredSchools} dari ${totalSchools} Sekolah | Waktu Unduh: ${exportTimestamp}`],
        [],
        ['NO', 'KECAMATAN', 'NAMA SEKOLAH', 'NPSN', 'STATUS PARTISIPASI', 'CATATAN FOLLOW-UP']
    ];

    unregisteredList.forEach((s, idx) => {
        aoa2.push([
            idx + 1,
            s.kecamatan,
            s.nama,
            s.npsn || '-',
            'Belum Ada Peserta',
            ''
        ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(aoa2);
    ws2['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 42 }, { wch: 14 }, { wch: 22 }, { wch: 30 }];

    const range2 = XLSX.utils.decode_range(ws2['!ref'] || 'A1:F1');
    for (let R = range2.s.r; R <= range2.e.r; ++R) {
        for (let C = range2.s.c; C <= range2.e.c; ++C) {
            const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws2[cellAddr]) continue;

            if (R === 0) ws2[cellAddr].s = { font: fontTitle };
            else if (R === 1) ws2[cellAddr].s = { font: { ...fontSubtitle, color: { rgb: 'DC2626' } } };
            else if (R >= 2 && R <= 3) ws2[cellAddr].s = { font: { ...fontMain, color: { rgb: '4B5563' } } };
            else if (R === 5) {
                ws2[cellAddr].s = {
                    font: fontHeader,
                    fill: headerFillRed,
                    alignment: { horizontal: C === 0 ? 'center' : C === 3 ? 'center' : 'left', vertical: 'center' },
                    border: thinBorder
                };
            } else if (R > 5) {
                const isEven = (R - 6) % 2 === 0;
                ws2[cellAddr].s = {
                    font: fontMain,
                    fill: isEven ? rowWhiteFill : rowEvenFill,
                    alignment: { horizontal: C === 0 || C === 3 ? 'center' : 'left', vertical: 'center' },
                    border: thinBorder
                };
            }
        }
    }

    XLSX.utils.book_append_sheet(wb, ws2, 'Belum Mendaftar');

    // ==========================================
    // SHEET 3: SEKOLAH SUDAH MENDAFTAR
    // ==========================================
    const registeredList = schoolsCoverage.filter(s => s.isRegistered);
    const aoa3: (string | number)[][] = [
        ['MGMP INFORMATIKA SMP KABUPATEN WONOSOBO'],
        ['DAFTAR SEKOLAH YANG SUDAH MENDAFTAR'],
        [`Nama Acara: ${event.title}`],
        [`Total Sekolah Terdaftar: ${registeredSchools} Sekolah | Waktu Unduh: ${exportTimestamp}`],
        [],
        ['NO', 'KECAMATAN', 'NAMA SEKOLAH', 'NPSN', 'JUMLAH GURU', 'DAFTAR NAMA GURU PESERTA']
    ];

    registeredList.forEach((s, idx) => {
        aoa3.push([
            idx + 1,
            s.kecamatan,
            s.nama,
            s.npsn || '-',
            s.participantCount,
            s.participantNames.join(', ')
        ]);
    });

    const ws3 = XLSX.utils.aoa_to_sheet(aoa3);
    ws3['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 42 }, { wch: 14 }, { wch: 15 }, { wch: 50 }];

    const range3 = XLSX.utils.decode_range(ws3['!ref'] || 'A1:F1');
    for (let R = range3.s.r; R <= range3.e.r; ++R) {
        for (let C = range3.s.c; C <= range3.e.c; ++C) {
            const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws3[cellAddr]) continue;

            if (R === 0) ws3[cellAddr].s = { font: fontTitle };
            else if (R === 1) ws3[cellAddr].s = { font: { ...fontSubtitle, color: { rgb: '2563EB' } } };
            else if (R >= 2 && R <= 3) ws3[cellAddr].s = { font: { ...fontMain, color: { rgb: '4B5563' } } };
            else if (R === 5) {
                ws3[cellAddr].s = {
                    font: fontHeader,
                    fill: headerFillBlue,
                    alignment: { horizontal: C === 0 || C === 3 || C === 4 ? 'center' : 'left', vertical: 'center' },
                    border: thinBorder
                };
            } else if (R > 5) {
                const isEven = (R - 6) % 2 === 0;
                ws3[cellAddr].s = {
                    font: fontMain,
                    fill: isEven ? rowWhiteFill : rowEvenFill,
                    alignment: { horizontal: C === 0 || C === 3 || C === 4 ? 'center' : 'left', vertical: 'center' },
                    border: thinBorder
                };
            }
        }
    }

    XLSX.utils.book_append_sheet(wb, ws3, 'Sudah Mendaftar');

    // ==========================================
    // SAVE TO FILE
    // ==========================================
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });

    const cleanTitle = sanitizeFilename(event.title || 'Event');
    const filename = `Pemerataan_Sekolah_${cleanTitle}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    saveAs(blob, filename);
}
