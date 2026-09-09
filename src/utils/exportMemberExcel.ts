import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import type { Profile } from '../services/memberService';

interface ExportMemberOptions {
    activeTab?: 'active' | 'inactive' | 'duplicates' | 'unstandardized';
    filterRole?: string;
    filterPremium?: string;
}

/**
 * Format string array atau JSON string menjadi teks yang dipisahkan koma
 */
function formatArrayOrString(val: string | string[] | undefined | null): string {
    if (!val) return '-';
    if (Array.isArray(val)) {
        const cleaned = val.filter(Boolean);
        return cleaned.length > 0 ? cleaned.join(', ') : '-';
    }
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    const cleaned = parsed.filter(Boolean);
                    return cleaned.length > 0 ? cleaned.join(', ') : '-';
                }
            } catch {
                // Biarkan sebagai string biasa jika bukan JSON valid
            }
        }
        return trimmed || '-';
    }
    return String(val);
}

/**
 * Pastikan nomor HP tersimpan rapi tanpa karakter berantakan
 */
function formatPhoneNumber(phone: string | undefined | null): string {
    if (!phone) return '-';
    const clean = String(phone).trim();
    return clean || '-';
}

/**
 * Ekspor data anggota ke file Excel (.xlsx) dengan styling profesional
 */
export function exportMembersToExcel(members: Profile[], options: ExportMemberOptions = {}) {
    if (!members || members.length === 0) {
        throw new Error('Tidak ada data anggota untuk diekspor');
    }

    const exportTimestamp = format(new Date(), 'dd/MM/yyyy HH:mm');
    const now = new Date();

    // Tentukan label filter untuk informasi di kop
    let categoryLabel = 'Semua Anggota';
    if (options.activeTab === 'active') categoryLabel = 'Anggota Aktif';
    if (options.activeTab === 'inactive') categoryLabel = 'Verifikasi / Menunggu Aktivasi';

    const roleLabel = options.filterRole && options.filterRole !== 'All' ? `Role: ${options.filterRole}` : 'Semua Role';
    const premiumLabel = options.filterPremium && options.filterPremium !== 'All' ? `Akun: ${options.filterPremium}` : 'Semua Tipe Akun';

    // 1. Susun Definisi Kolom
    const headers = [
        'NO',
        'NAMA LENGKAP',
        'EMAIL',
        'NO. WHATSAPP / HP',
        'ASAL SEKOLAH',
        'STATUS KEPEGAWAIAN',
        'PENDIDIKAN',
        'JURUSAN',
        'MAPEL DIAMPU',
        'KELAS AJAR',
        'UKURAN BAJU',
        'ROLE',
        'STATUS AKUN',
        'TIPE AKUN',
        'MASA AKTIF PREMIUM',
        'HADIR (EVENT)',
        'TANGGAL BERGABUNG'
    ];

    const defaultColWidths = [
        6,   // NO
        32,  // NAMA LENGKAP
        32,  // EMAIL
        20,  // NO. HP
        34,  // ASAL SEKOLAH
        22,  // STATUS KEPEGAWAIAN
        14,  // PENDIDIKAN
        28,  // JURUSAN
        24,  // MAPEL DIAMPU
        16,  // KELAS AJAR
        14,  // UKURAN BAJU
        14,  // ROLE
        16,  // STATUS AKUN
        16,  // TIPE AKUN
        22,  // MASA AKTIF PREMIUM
        16,  // HADIR EVENT
        20   // TANGGAL BERGABUNG
    ];

    // Track panjang maksimum per kolom untuk auto-width
    const colMaxLens = defaultColWidths.slice();

    // 2. Susun Baris AOA (Array of Arrays)
    const aoa: (string | number)[][] = [];

    // Baris 0: Judul Utama
    aoa.push(['MGMP INFORMATIKA SMP KABUPATEN WONOSOBO']);
    // Baris 1: Judul Laporan
    aoa.push(['LAPORAN REKAPITULASI DATA ANGGOTA']);
    // Baris 2: Informasi Metadata / Filter
    aoa.push([`Kategori: ${categoryLabel} | ${roleLabel} | ${premiumLabel} | Waktu Ekspor: ${exportTimestamp} WIB | Total: ${members.length} Anggota`]);
    // Baris 3: Spacer kosong
    aoa.push([]);
    // Baris 4: Header Tabel (Indeks Baris ke-4, Excel Baris ke-5)
    aoa.push(headers);

    const headerRowIdx = 4;
    const firstDataRowIdx = 5;

    let totalAttendance = 0;

    // 3. Masukkan Data Anggota
    members.forEach((m, idx) => {
        const no = idx + 1;
        const nama = m.nama || '-';
        const email = m.email || '-';
        const noHp = formatPhoneNumber(m.no_hp);
        const sekolah = m.asal_sekolah || '-';
        const statusPegawai = m.status_kepegawaian || '-';
        const pendidikan = m.pendidikan_terakhir || '-';
        const jurusan = m.jurusan || '-';
        const mapel = formatArrayOrString(m.mapel);
        const kelas = formatArrayOrString(m.kelas);
        const ukuranBaju = m.ukuran_baju || '-';
        const role = m.role || 'Anggota';

        const isActive = Number(m.is_active) === 1;
        const statusAkun = isActive ? 'Aktif' : 'Pending';

        const isPremium = !!(m.premium_until && new Date(m.premium_until) > now);
        const tipeAkun = isPremium ? 'Premium' : 'Reguler';
        const masaAktif = isPremium ? format(new Date(m.premium_until!), 'dd/MM/yyyy') : '-';

        const attendance = Number(m.attendance_count) || 0;
        totalAttendance += attendance;

        let tglBergabung = '-';
        if (m.created_at) {
            try {
                tglBergabung = format(new Date(m.created_at), 'dd/MM/yyyy');
            } catch {
                tglBergabung = m.created_at;
            }
        }

        const row = [
            no,
            nama,
            email,
            noHp,
            sekolah,
            statusPegawai,
            pendidikan,
            jurusan,
            mapel,
            kelas,
            ukuranBaju,
            role,
            statusAkun,
            tipeAkun,
            masaAktif,
            attendance,
            tglBergabung
        ];

        // Update auto-width tracking
        row.forEach((cellVal, colIdx) => {
            const strVal = String(cellVal || '');
            if (strVal.length + 3 > colMaxLens[colIdx]) {
                colMaxLens[colIdx] = strVal.length + 3;
            }
        });

        aoa.push(row);
    });

    // Baris Ringkasan (Footer Row)
    const footerRowIdx = aoa.length;
    const footerRow = new Array(headers.length).fill('');
    footerRow[0] = `TOTAL ANGGOTA: ${members.length} ORANG`;
    footerRow[15] = totalAttendance;
    aoa.push(footerRow);

    // 4. Buat Worksheet
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Pengaturan Merge Cells
    const numCols = headers.length;
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }, // Judul 1
        { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } }, // Judul 2
        { s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } }, // Metadata
        { s: { r: footerRowIdx, c: 0 }, e: { r: footerRowIdx, c: 14 } } // Footer total label
    ];

    // Pengaturan Tinggi Baris (!rows)
    const rowHeights: { hpt: number }[] = [
        { hpt: 26 }, // Baris 1: Judul
        { hpt: 20 }, // Baris 2: Subjudul
        { hpt: 18 }, // Baris 3: Metadata
        { hpt: 10 }, // Baris 4: Spacer
        { hpt: 28 }  // Baris 5: Header Kolom
    ];

    for (let r = 0; r < members.length; r++) {
        rowHeights.push({ hpt: 22 }); // Data rows
    }
    rowHeights.push({ hpt: 24 }); // Footer row
    ws['!rows'] = rowHeights;

    // Pengaturan Lebar Kolom (!cols)
    ws['!cols'] = colMaxLens.map(width => ({ wch: Math.min(width, 50) }));

    // 5. Palet Warna & Styling
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

    // Styling Baris Kop (Baris 0, 1, 2)
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
            font: { name: 'Calibri', sz: 9.5, italic: true, color: { rgb: '64748B' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };
    }

    // Styling Header Kolom (Baris 4 / Excel Row 5)
    for (let colIdx = 0; colIdx < numCols; colIdx++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRowIdx, c: colIdx });
        if (ws[cellRef]) {
            ws[cellRef].s = {
                font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '1E3A8A' } },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                border: BORDER_HEADER
            };
        }
    }

    // Styling Data Baris (Baris 5 ke N)
    for (let r = 0; r < members.length; r++) {
        const rowIdx = firstDataRowIdx + r;
        const isOdd = r % 2 === 1;
        const rowBgColor = isOdd ? 'F8FAFC' : 'FFFFFF';

        const member = members[r];
        const isActive = Number(member.is_active) === 1;
        const isPremium = !!(member.premium_until && new Date(member.premium_until) > now);

        for (let colIdx = 0; colIdx < numCols; colIdx++) {
            const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
            let cell = ws[cellRef];
            if (!cell) {
                cell = { t: 's', v: '' };
                ws[cellRef] = cell;
            }

            let horizontalAlign: 'left' | 'center' | 'right' = 'left';
            if ([0, 3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16].includes(colIdx)) {
                horizontalAlign = 'center';
            }

            let fontColor = '1E293B';
            let isBold = false;
            let cellBgColor = rowBgColor;

            // Spesifik per kolom:
            if (colIdx === 0) {
                // Kolom No
                fontColor = '64748B';
                isBold = true;
                cell.t = 'n';
            } else if (colIdx === 1) {
                // Kolom Nama Lengkap
                fontColor = '0F172A';
                isBold = true;
            } else if (colIdx === 3) {
                // Kolom No HP: Pastikan format string teks agar awalan 0 tidak hilang
                cell.t = 's';
                cell.z = '@';
            } else if (colIdx === 11) {
                // Kolom Role
                if (member.role === 'Admin') fontColor = '7E22CE';
                if (member.role === 'Pengurus') fontColor = '0369A1';
                isBold = true;
            } else if (colIdx === 12) {
                // Kolom Status Akun (Badge)
                if (isActive) {
                    cellBgColor = 'DCFCE7'; // soft green
                    fontColor = '166534';   // dark green
                    isBold = true;
                } else {
                    cellBgColor = 'FEF3C7'; // soft amber
                    fontColor = '9A3412';   // dark amber
                    isBold = true;
                }
            } else if (colIdx === 13) {
                // Kolom Tipe Akun
                if (isPremium) {
                    cellBgColor = 'EDE9FE'; // soft purple
                    fontColor = '6B21A8';   // dark purple
                    isBold = true;
                } else {
                    fontColor = '64748B';
                }
            } else if (colIdx === 15) {
                // Hadir Event
                cell.t = 'n';
                cell.z = '#,##0';
            }

            cell.s = {
                font: { name: 'Calibri', sz: 10, bold: isBold, color: { rgb: fontColor } },
                fill: { fgColor: { rgb: cellBgColor } },
                alignment: { horizontal: horizontalAlign, vertical: 'center', wrapText: false },
                border: BORDER_DATA
            };
        }
    }

    // Styling Baris Footer (Total)
    for (let colIdx = 0; colIdx < numCols; colIdx++) {
        const cellRef = XLSX.utils.encode_cell({ r: footerRowIdx, c: colIdx });
        let cell = ws[cellRef];
        if (!cell) {
            cell = { t: 's', v: '' };
            ws[cellRef] = cell;
        }

        cell.s = {
            font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: '0F172A' } },
            fill: { fgColor: { rgb: 'E2E8F0' } },
            alignment: {
                horizontal: colIdx === 0 ? 'right' : (colIdx === 15 ? 'center' : 'center'),
                vertical: 'center'
            },
            border: BORDER_FOOTER
        };

        if (colIdx === 15) {
            cell.t = 'n';
            cell.z = '#,##0';
        }
    }

    // Buat Workbook & simpan
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Anggota');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });

    const filename = `Data_Anggota_MGMP_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    saveAs(dataBlob, filename);
}
