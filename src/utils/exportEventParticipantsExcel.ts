import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export interface EventParticipantExportData {
    user_id: string;
    nama: string;
    email: string;
    asal_sekolah?: string | null;
    no_hp?: string | null;
    status_kepegawaian?: string | null;
    registered_at: string;
    is_hadir: number;
    attendance_count?: number;
    is_passed?: number | boolean;
    payment_status?: string;
    is_approved?: number | boolean;
    lms_score?: number | string;
}

export interface EventInfoExportData {
    id: string;
    title: string;
    date: string;
    location?: string;
    total_days?: number;
    quota?: number;
    is_paid?: boolean;
    has_lms?: boolean | number;
}

interface ExportOptions {
    filterStatus?: string;
}

function sanitizeFilename(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 40);
}

function formatPhoneNumber(phone: string | undefined | null): string {
    if (!phone) return '-';
    const clean = String(phone).trim();
    return clean || '-';
}

function formatSafeDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return format(d, 'dd/MM/yyyy HH:mm');
    } catch {
        return String(dateStr);
    }
}

function formatSimpleDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return format(d, 'dd/MM/yyyy');
    } catch {
        return String(dateStr);
    }
}

/**
 * Ekspor data peserta acara ke file Excel (.xlsx) dengan format dan styling profesional
 */
export function exportEventParticipantsExcel(
    event: EventInfoExportData,
    participants: EventParticipantExportData[],
    options: ExportOptions = {}
) {
    if (!participants || participants.length === 0) {
        throw new Error('Tidak ada data peserta untuk diekspor');
    }

    const exportTimestamp = format(new Date(), 'dd/MM/yyyy HH:mm');
    const isPaid = !!event.is_paid;
    const hasLms = !!event.has_lms;
    const totalDays = event.total_days || 1;

    // Filter label
    const filterMap: Record<string, string> = {
        all: 'Semua Peserta',
        passed: 'Hanya yang Lulus',
        not_passed: 'Belum Lulus',
        attended: 'Hadir (Selesai)',
        not_attended: 'Belum Hadir'
    };
    const filterLabel = filterMap[options.filterStatus || 'all'] || 'Semua Peserta';

    // 1. Susun Kolom Header
    const headers: string[] = [
        'NO',
        'NAMA LENGKAP',
        'EMAIL',
        'NO. WHATSAPP / HP',
        'ASAL SEKOLAH',
        'STATUS KEPEGAWAIAN',
        'WAKTU DAFTAR',
        'PRESENSI / KEHADIRAN',
        'STATUS KELULUSAN'
    ];

    const defaultColWidths: number[] = [
        6,   // NO
        32,  // NAMA LENGKAP
        30,  // EMAIL
        20,  // NO. HP
        34,  // ASAL SEKOLAH
        22,  // STATUS KEPEGAWAIAN
        20,  // WAKTU DAFTAR
        22,  // KEHADIRAN
        18   // KELULUSAN
    ];

    if (isPaid) {
        headers.push('STATUS PEMBAYARAN');
        defaultColWidths.push(20);
    }

    if (hasLms) {
        headers.push('SKOR LMS');
        headers.push('AKSES LMS');
        defaultColWidths.push(15);
        defaultColWidths.push(16);
    }

    const colMaxLens = defaultColWidths.slice();

    // 2. Susun Data AOA (Array of Arrays)
    const aoa: (string | number)[][] = [];

    // Baris 0: Kop Lembaga
    aoa.push(['MGMP INFORMATIKA SMP KABUPATEN WONOSOBO']);
    // Baris 1: Judul Acara
    aoa.push([`DAFTAR PESERTA KEGIATAN: ${event.title.toUpperCase()}`]);
    // Baris 2: Informasi Agenda Acara
    const eventDateFormatted = formatSimpleDate(event.date);
    const eventLocation = event.location || 'Kabupaten Wonosobo';
    const quotaInfo = event.quota ? `${event.quota} Peserta` : 'Tidak Dibatasi';
    aoa.push([`Tanggal: ${eventDateFormatted} | Lokasi: ${eventLocation} | Durasi: ${totalDays} Hari | Kuota: ${quotaInfo}`]);
    // Baris 3: Metadata Ekspor
    aoa.push([`Filter Data: ${filterLabel} | Waktu Ekspor: ${exportTimestamp} WIB | Jumlah Peserta: ${participants.length} Orang`]);
    // Baris 4: Baris kosong pemisah
    aoa.push([]);
    // Baris 5: Header Tabel Kolom
    aoa.push(headers);

    const headerRowIdx = 5;
    const firstDataRowIdx = 6;

    let totalLulus = 0;
    let totalHadirPenuh = 0;

    // 3. Masukkan Baris Data Peserta
    participants.forEach((p, idx) => {
        const no = idx + 1;
        const nama = p.nama || '-';
        const email = p.email || '-';
        const noHp = formatPhoneNumber(p.no_hp);
        const sekolah = p.asal_sekolah || '-';
        const statusPegawai = p.status_kepegawaian || '-';
        const waktuDaftar = formatSafeDate(p.registered_at);

        // Kehadiran
        const attendCount = p.attendance_count || 0;
        const isManualHadir = Number(p.is_hadir) === 1;
        let kehadiranLabel = `${attendCount} / ${totalDays} Hari`;
        if (isManualHadir && attendCount === 0) {
            kehadiranLabel = 'Hadir (Manual)';
        } else if (attendCount >= totalDays) {
            kehadiranLabel = `${attendCount} / ${totalDays} Hari (Penuh)`;
        }
        if (attendCount > 0 || isManualHadir) {
            totalHadirPenuh++;
        }

        // Kelulusan
        const isPassed = Number(p.is_passed) === 1;
        if (isPassed) totalLulus++;
        const kelulusanLabel = isPassed ? 'Lulus' : 'Belum Lulus';

        const row: (string | number)[] = [
            no,
            nama,
            email,
            noHp,
            sekolah,
            statusPegawai,
            waktuDaftar,
            kehadiranLabel,
            kelulusanLabel
        ];

        // Jika event berbayar
        if (isPaid) {
            const payStatusMap: Record<string, string> = {
                free: 'Gratis',
                pending: 'Belum Bayar',
                waiting_confirmation: 'Menunggu Konfirmasi',
                confirmed: 'Lunas',
                rejected: 'Ditolak'
            };
            const paymentLabel = payStatusMap[p.payment_status || ''] || p.payment_status || 'Belum Bayar';
            row.push(paymentLabel);
        }

        // Jika event menggunakan LMS
        if (hasLms) {
            const skor = p.lms_score !== undefined && p.lms_score !== null && p.lms_score !== ''
                ? Number(p.lms_score).toFixed(1)
                : '-';
            const aksesLms = Number(p.is_approved) === 1 ? 'Aktif (ON)' : 'Nonaktif (OFF)';
            row.push(skor);
            row.push(aksesLms);
        }

        // Hitung auto-width
        row.forEach((cellVal, cIdx) => {
            const str = String(cellVal ?? '');
            if (str.length + 3 > colMaxLens[cIdx]) {
                colMaxLens[cIdx] = str.length + 3;
            }
        });

        aoa.push(row);
    });

    // 4. Baris Footer Ringkasan
    const footerRowIdx = aoa.length;
    const footerRow = new Array(headers.length).fill('');
    footerRow[0] = `TOTAL PESERTA: ${participants.length} ORANG | HADIR: ${totalHadirPenuh} | LULUS: ${totalLulus}`;
    aoa.push(footerRow);

    // 5. Inisialisasi Worksheet
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    const numCols = headers.length;
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }, // Kop 1
        { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } }, // Kop 2
        { s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } }, // Kop 3
        { s: { r: 3, c: 0 }, e: { r: 3, c: numCols - 1 } }, // Kop 4
        { s: { r: footerRowIdx, c: 0 }, e: { r: footerRowIdx, c: numCols - 1 } } // Footer
    ];

    // Tinggi Baris (!rows)
    const rowHeights: { hpt: number }[] = [
        { hpt: 26 }, // Baris 1: Judul Utama
        { hpt: 22 }, // Baris 2: Judul Acara
        { hpt: 18 }, // Baris 3: Info Agenda
        { hpt: 18 }, // Baris 4: Metadata Ekspor
        { hpt: 10 }, // Baris 5: Spacer
        { hpt: 28 }  // Baris 6: Header Tabel
    ];

    for (let r = 0; r < participants.length; r++) {
        rowHeights.push({ hpt: 22 });
    }
    rowHeights.push({ hpt: 25 }); // Footer
    ws['!rows'] = rowHeights;

    // Lebar Kolom (!cols)
    ws['!cols'] = colMaxLens.map(width => ({ wch: Math.min(width, 50) }));

    // 6. Styling Borders & Palet Warna
    const BORDER_HEADER = {
        top: { style: 'medium', color: { rgb: '0F172A' } },
        bottom: { style: 'medium', color: { rgb: '0F172A' } },
        left: { style: 'thin', color: { rgb: '334155' } },
        right: { style: 'thin', color: { rgb: '334155' } }
    };

    const BORDER_DATA = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    };

    const BORDER_FOOTER = {
        top: { style: 'medium', color: { rgb: '0F172A' } },
        bottom: { style: 'double', color: { rgb: '0F172A' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    };

    // Styling Baris Kop (0 - 3)
    const cellA1 = ws['A1'];
    if (cellA1) {
        cellA1.s = {
            font: { name: 'Calibri', sz: 15, bold: true, color: { rgb: '1E3A8A' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };
    }

    const cellA2 = ws['A2'];
    if (cellA2) {
        cellA2.s = {
            font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '334155' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };
    }

    const cellA3 = ws['A3'];
    if (cellA3) {
        cellA3.s = {
            font: { name: 'Calibri', sz: 9.5, bold: false, color: { rgb: '475569' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };
    }

    const cellA4 = ws['A4'];
    if (cellA4) {
        cellA4.s = {
            font: { name: 'Calibri', sz: 9, italic: true, color: { rgb: '64748B' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };
    }

    // Styling Header Kolom (Baris 5)
    for (let c = 0; c < numCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRowIdx, c });
        if (ws[cellRef]) {
            ws[cellRef].s = {
                font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '1E3A8A' } },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                border: BORDER_HEADER
            };
        }
    }

    // Indeks Kolom Penting untuk Format Khusus
    const colIdxNo = 0;
    const colIdxNama = 1;
    const colIdxPhone = 3;
    const colIdxKelulusan = 8;
    const colIdxPembayaran = isPaid ? 9 : -1;
    const colIdxSkorLms = hasLms ? (isPaid ? 10 : 9) : -1;
    const colIdxAksesLms = hasLms ? (isPaid ? 11 : 10) : -1;

    // Styling Data Rows
    for (let r = 0; r < participants.length; r++) {
        const rowIdx = firstDataRowIdx + r;
        const isOdd = r % 2 === 1;
        const rowBg = isOdd ? 'F8FAFC' : 'FFFFFF';
        const p = participants[r];

        const isPassed = Number(p.is_passed) === 1;

        for (let c = 0; c < numCols; c++) {
            const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c });
            let cell = ws[cellRef];
            if (!cell) {
                cell = { t: 's', v: '' };
                ws[cellRef] = cell;
            }

            let horizontalAlign: 'left' | 'center' | 'right' = 'left';
            if ([0, 3, 5, 6, 7, 8].includes(c) || c === colIdxPembayaran || c === colIdxSkorLms || c === colIdxAksesLms) {
                horizontalAlign = 'center';
            }

            let fontColor = '1E293B';
            let isBold = false;
            let cellBgColor = rowBg;

            if (c === colIdxNo) {
                fontColor = '64748B';
                isBold = true;
                cell.t = 'n';
            } else if (c === colIdxNama) {
                fontColor = '0F172A';
                isBold = true;
            } else if (c === colIdxPhone) {
                cell.t = 's';
                cell.z = '@';
            } else if (c === colIdxKelulusan) {
                if (isPassed) {
                    cellBgColor = 'DCFCE7'; // soft green
                    fontColor = '166534';   // dark green
                    isBold = true;
                } else {
                    fontColor = '64748B';
                }
            } else if (c === colIdxPembayaran) {
                if (p.payment_status === 'confirmed') {
                    cellBgColor = 'DCFCE7';
                    fontColor = '166534';
                    isBold = true;
                } else if (p.payment_status === 'waiting_confirmation') {
                    cellBgColor = 'DBEAFE';
                    fontColor = '1E40AF';
                    isBold = true;
                } else if (p.payment_status === 'pending') {
                    cellBgColor = 'FEF3C7';
                    fontColor = '9A3412';
                    isBold = true;
                }
            } else if (c === colIdxAksesLms) {
                if (Number(p.is_approved) === 1) {
                    fontColor = '166534';
                    isBold = true;
                } else {
                    fontColor = 'DC2626';
                }
            }

            cell.s = {
                font: { name: 'Calibri', sz: 10, bold: isBold, color: { rgb: fontColor } },
                fill: { fgColor: { rgb: cellBgColor } },
                alignment: { horizontal: horizontalAlign, vertical: 'center' },
                border: BORDER_DATA
            };
        }
    }

    // Styling Baris Footer
    for (let c = 0; c < numCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: footerRowIdx, c });
        let cell = ws[cellRef];
        if (!cell) {
            cell = { t: 's', v: '' };
            ws[cellRef] = cell;
        }

        cell.s = {
            font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: '0F172A' } },
            fill: { fgColor: { rgb: 'E2E8F0' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: BORDER_FOOTER
        };
    }

    // Buat Workbook & Tulis File
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Peserta Acara');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });

    const safeTitle = sanitizeFilename(event.title || 'Acara');
    const filename = `Daftar_Peserta_${safeTitle}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    saveAs(dataBlob, filename);
}
