export interface SchoolItem {
    id?: number;
    no?: number;
    npsn?: string | null;
    nama: string;
    kecamatan: string;
    is_verified?: number;
}

export const SCHOOLS_DATA: SchoolItem[] = [
    { no: 1, npsn: "70030618", nama: "SMP Al-Islah", kecamatan: "Garung" },
    { no: 2, npsn: "20341101", nama: "SMP Darul Falach", kecamatan: "Garung" },
    { no: 3, npsn: "20306775", nama: "SMP Ma'arif Mlandi", kecamatan: "Garung" },
    { no: 4, npsn: "20306796", nama: "SMP Negeri 1 Garung", kecamatan: "Garung" },
    { no: 5, npsn: "20306849", nama: "SMP Negeri 2 Garung", kecamatan: "Garung" },
    { no: 6, npsn: "20306844", nama: "SMP Negeri 3 Garung", kecamatan: "Garung" },

    { no: 7, npsn: "20306776", nama: "SMP Ma'arif Kalibawang", kecamatan: "Kalibawang" },
    { no: 8, npsn: "20306795", nama: "SMP Negeri 1 Kalibawang", kecamatan: "Kalibawang" },
    { no: 9, npsn: "20306848", nama: "SMP Negeri 2 Kalibawang", kecamatan: "Kalibawang" },
    { no: 10, npsn: "20306832", nama: "SMP Negeri 3 Kalibawang", kecamatan: "Kalibawang" },
    { no: 11, npsn: "20341092", nama: "SMP Negeri 4 Satu Atap Kalibawang", kecamatan: "Kalibawang" },
    { no: 12, npsn: "20360529", nama: "SMP Negeri 5 Satu Atap Kalibawang", kecamatan: "Kalibawang" },

    { no: 13, npsn: "20306794", nama: "SMP Negeri 1 Kalikajar", kecamatan: "Kalikajar" },
    { no: 14, npsn: "20306847", nama: "SMP Negeri 2 Kalikajar", kecamatan: "Kalikajar" },
    { no: 15, npsn: "20306831", nama: "SMP Negeri 3 Kalikajar", kecamatan: "Kalikajar" },
    { no: 16, npsn: "20306843", nama: "SMP Negeri 4 Kalikajar", kecamatan: "Kalikajar" },
    { no: 17, npsn: "20341088", nama: "SMP Negeri 5 Satu Atap Kalikajar", kecamatan: "Kalikajar" },

    { no: 18, npsn: "70011625", nama: "SMP Darussalam Islamic Boarding School", kecamatan: "Kaliwiro" },
    { no: 19, npsn: "20306772", nama: "SMP Muhammadiyah Kaliwiro", kecamatan: "Kaliwiro" },
    { no: 20, npsn: "20306793", nama: "SMP Negeri 1 Kaliwiro", kecamatan: "Kaliwiro" },
    { no: 21, npsn: "20306846", nama: "SMP Negeri 2 Kaliwiro", kecamatan: "Kaliwiro" },
    { no: 22, npsn: "20306830", nama: "SMP Negeri 3 Kaliwiro", kecamatan: "Kaliwiro" },
    { no: 23, npsn: "20306842", nama: "SMP Negeri 4 Kaliwiro", kecamatan: "Kaliwiro" },
    { no: 24, npsn: "20306838", nama: "SMP Negeri 5 Kaliwiro", kecamatan: "Kaliwiro" },
    { no: 25, npsn: "20341087", nama: "SMP Negeri 6 Satu Atap Kaliwiro", kecamatan: "Kaliwiro" },
    { no: 26, npsn: "20362777", nama: "SMP Negeri 7 Satu Atap Kaliwiro", kecamatan: "Kaliwiro" },

    { no: 27, npsn: "70028317", nama: "SMP Al-Munawaroh", kecamatan: "Kejajar" },
    { no: 28, npsn: "20306770", nama: "SMP Muhammadiyah Tieng", kecamatan: "Kejajar" },
    { no: 29, npsn: "20306792", nama: "SMP Negeri 1 Kejajar", kecamatan: "Kejajar" },
    { no: 30, npsn: "20306855", nama: "SMP Negeri 2 Kejajar", kecamatan: "Kejajar" },
    { no: 31, npsn: "20341090", nama: "SMP Negeri 3 Satu Atap Kejajar", kecamatan: "Kejajar" },
    { no: 32, npsn: "69930689", nama: "SMP Takhassus Al-Quran Sirojus Syuhada", kecamatan: "Kejajar" },

    { no: 33, npsn: "70047118", nama: "SMP Darul Ulum Gadingrejo", kecamatan: "Kepil" },
    { no: 34, npsn: "20306791", nama: "SMP Negeri 1 Kepil", kecamatan: "Kepil" },
    { no: 35, npsn: "20306856", nama: "SMP Negeri 2 Kepil", kecamatan: "Kepil" },
    { no: 36, npsn: "20306829", nama: "SMP Negeri 3 Kepil", kecamatan: "Kepil" },
    { no: 37, npsn: "20306841", nama: "SMP Negeri 4 Kepil", kecamatan: "Kepil" },
    { no: 38, npsn: "20306837", nama: "SMP Negeri 5 Kepil", kecamatan: "Kepil" },
    { no: 39, npsn: "20341095", nama: "SMP Negeri 6 Satu Atap Kepil", kecamatan: "Kepil" },
    { no: 40, npsn: "20360531", nama: "SMP Negeri 7 Satu Atap Kepil", kecamatan: "Kepil" },
    { no: 41, npsn: "20306768", nama: "SMP PGRI 3 Kepil", kecamatan: "Kepil" },

    { no: 42, npsn: "20306773", nama: "SMP Muhammadiyah Kertek", kecamatan: "Kertek" },
    { no: 43, npsn: "20306790", nama: "SMP Negeri 1 Kertek", kecamatan: "Kertek" },
    { no: 44, npsn: "20306865", nama: "SMP Negeri 2 Kertek", kecamatan: "Kertek" },
    { no: 45, npsn: "20306828", nama: "SMP Negeri 3 Kertek", kecamatan: "Kertek" },
    { no: 46, npsn: "20360623", nama: "SMP Negeri 4 Kertek", kecamatan: "Kertek" },
    { no: 47, npsn: "70048769", nama: "SMP Qur`aniyyah", kecamatan: "Kertek" },
    { no: 48, npsn: "70008284", nama: "SMP Takhassus Al Quran Al Fathoniyyah", kecamatan: "Kertek" },

    { no: 49, npsn: "20306771", nama: "SMP Muhammadiyah 3 Leksono", kecamatan: "Leksono" },
    { no: 50, npsn: "20306767", nama: "SMP Negeri 1 Leksono", kecamatan: "Leksono" },
    { no: 51, npsn: "20306863", nama: "SMP Negeri 2 Leksono", kecamatan: "Leksono" },
    { no: 52, npsn: "20331801", nama: "SMP Negeri 3 Leksono", kecamatan: "Leksono" },
    { no: 53, npsn: "20306779", nama: "SMP PGRI Leksono", kecamatan: "Leksono" },

    { no: 54, npsn: "69961599", nama: "SMP Alfa Ali Masykur", kecamatan: "Mojotengah" },
    { no: 55, npsn: "20306822", nama: "SMP Negeri 1 Mojotengah", kecamatan: "Mojotengah" },
    { no: 56, npsn: "20306862", nama: "SMP Negeri 2 Mojotengah", kecamatan: "Mojotengah" },
    { no: 57, npsn: "20306827", nama: "SMP Negeri 3 Mojotengah", kecamatan: "Mojotengah" },
    { no: 58, npsn: "20341093", nama: "SMP Nusantara", kecamatan: "Mojotengah" },
    { no: 59, npsn: "69978382", nama: "SMP Pelita Al Qur'an", kecamatan: "Mojotengah" },
    { no: 60, npsn: "20306797", nama: "SMP Takhassus Al Quran Kalibeber", kecamatan: "Mojotengah" },
    { no: 61, npsn: "20360532", nama: "SMP Takhassus Al-Qur'an 2", kecamatan: "Mojotengah" },

    { no: 62, npsn: "20306774", nama: "SMP Muhammadiyah Sapuran", kecamatan: "Sapuran" },
    { no: 63, npsn: "20306866", nama: "SMP Negeri 1 Sapuran", kecamatan: "Sapuran" },
    { no: 64, npsn: "20306861", nama: "SMP Negeri 2 Sapuran", kecamatan: "Sapuran" },
    { no: 65, npsn: "20341086", nama: "SMP Negeri 3 Satu Atap Sapuran", kecamatan: "Sapuran" },
    { no: 66, npsn: "20341505", nama: "SMP Negeri 4 Sapuran", kecamatan: "Sapuran" },
    { no: 67, npsn: "20360249", nama: "SMP Negeri 5 Satu Atap Sapuran", kecamatan: "Sapuran" },
    { no: 68, npsn: "20341319", nama: "SMP RIfaiyah 01 Sapuran", kecamatan: "Sapuran" },

    { no: 69, npsn: "70041244", nama: "SMP Entreprenuer Ar-Ridwan", kecamatan: "Selomerto" },
    { no: 70, npsn: "20306799", nama: "SMP Kristen Bendungan", kecamatan: "Selomerto" },
    { no: 71, npsn: "20306854", nama: "SMP Negeri 1 Selomerto", kecamatan: "Selomerto" },
    { no: 72, npsn: "20306860", nama: "SMP Negeri 2 Selomerto", kecamatan: "Selomerto" },
    { no: 73, npsn: "20306825", nama: "SMP Negeri 3 Selomerto", kecamatan: "Selomerto" },
    { no: 74, npsn: "20306798", nama: "SMP PGRI Selomerto", kecamatan: "Selomerto" },
    { no: 75, npsn: "69918284", nama: "SMP Takhassus Al-Quran An Nida Selomerto", kecamatan: "Selomerto" },
    { no: 76, npsn: "69774560", nama: "SMPS Alawiyah", kecamatan: "Selomerto" },

    { no: 77, npsn: "20306853", nama: "SMP Negeri 1 Sukoharjo", kecamatan: "Sukoharjo" },
    { no: 78, npsn: "20306859", nama: "SMP Negeri 2 Sukoharjo", kecamatan: "Sukoharjo" },
    { no: 79, npsn: "20306824", nama: "SMP Negeri 3 Sukoharjo", kecamatan: "Sukoharjo" },
    { no: 80, npsn: "20341091", nama: "SMP Negeri 4 Satu Atap Sukoharjo", kecamatan: "Sukoharjo" },
    { no: 81, npsn: "20360530", nama: "SMP Negeri 5 Satu Atap Sukoharjo", kecamatan: "Sukoharjo" },

    { no: 82, npsn: "20306813", nama: "SMP Islam Wadaslintang", kecamatan: "Wadaslintang" },
    { no: 83, npsn: "20306852", nama: "SMP Negeri 1 Wadaslintang", kecamatan: "Wadaslintang" },
    { no: 84, npsn: "20360528", nama: "SMP Negeri 10 Satu Atap Wadaslintang", kecamatan: "Wadaslintang" },
    { no: 85, npsn: "20306858", nama: "SMP Negeri 2 Wadaslintang", kecamatan: "Wadaslintang" },
    { no: 86, npsn: "20306833", nama: "SMP Negeri 3 Wadaslintang", kecamatan: "Wadaslintang" },
    { no: 87, npsn: "20306839", nama: "SMP Negeri 4 Wadaslintang", kecamatan: "Wadaslintang" },
    { no: 88, npsn: "20306835", nama: "SMP Negeri 5 Wadaslintang", kecamatan: "Wadaslintang" },
    { no: 89, npsn: "20306823", nama: "SMP Negeri 6 Wadaslintang", kecamatan: "Wadaslintang" },
    { no: 90, npsn: "20331693", nama: "SMP Negeri 7 Satu Atap Wadaslintang", kecamatan: "Wadaslintang" },
    { no: 91, npsn: "20350845", nama: "SMP Negeri 9 Satu Atap Wadaslintang", kecamatan: "Wadaslintang" },

    { no: 92, npsn: "20306851", nama: "SMP Negeri 1 Watumalang", kecamatan: "Watumalang" },
    { no: 93, npsn: "20306857", nama: "SMP Negeri 2 Watumalang", kecamatan: "Watumalang" },
    { no: 94, npsn: "20306834", nama: "SMP Negeri 3 Watumalang", kecamatan: "Watumalang" },
    { no: 95, npsn: "20341089", nama: "SMP Negeri 4 Satu Atap Watumalang", kecamatan: "Watumalang" },
    { no: 96, npsn: "20341506", nama: "SMP Negeri 5 Watumalang", kecamatan: "Watumalang" },
    { no: 97, npsn: "20350846", nama: "SMP Negeri 6 Satu Atap Watumalang", kecamatan: "Watumalang" },
    { no: 98, npsn: "69962891", nama: "SMP NU 1 Watumalang", kecamatan: "Watumalang" },

    { no: 99, npsn: "69895564", nama: "SMP Al-Madina Wonosobo", kecamatan: "Wonosobo" },
    { no: 100, npsn: "20306814", nama: "SMP Bhakti Mulia", kecamatan: "Wonosobo" },
    { no: 101, npsn: "20306812", nama: "SMP Islam Wonosobo", kecamatan: "Wonosobo" },
    { no: 102, npsn: "20306800", nama: "SMP Kristen 1 Wonosobo", kecamatan: "Wonosobo" },
    { no: 103, npsn: "20306769", nama: "SMP Muhammadiyah Wonosobo", kecamatan: "Wonosobo" },
    { no: 104, npsn: "20306850", nama: "SMP Negeri 1 Wonosobo", kecamatan: "Wonosobo" },
    { no: 105, npsn: "20306845", nama: "SMP Negeri 2 Wonosobo", kecamatan: "Wonosobo" },
    { no: 106, npsn: "20331802", nama: "SMP Negeri 3 Wonosobo", kecamatan: "Wonosobo" },
    { no: 107, npsn: "69856671", nama: "SMP Negeri 4 Wonosobo", kecamatan: "Wonosobo" },
    { no: 108, npsn: "20306778", nama: "SMP PGRI Wonosobo", kecamatan: "Wonosobo" },
    { no: 109, npsn: "69899426", nama: "SMPIT Insan Mulia Wonosobo", kecamatan: "Wonosobo" }
];

export const KECAMATAN_LIST: string[] = [
    "Garung",
    "Kalibawang",
    "Kalikajar",
    "Kaliwiro",
    "Kejajar",
    "Kepil",
    "Kertek",
    "Leksono",
    "Mojotengah",
    "Sapuran",
    "Selomerto",
    "Sukoharjo",
    "Wadaslintang",
    "Watumalang",
    "Wonosobo"
];

let dynamicSchools: SchoolItem[] = [...SCHOOLS_DATA];

export function getSchoolsList(): SchoolItem[] {
    return dynamicSchools;
}

export function updateSchoolsCache(schools: SchoolItem[]) {
    if (Array.isArray(schools) && schools.length > 0) {
        const map = new Map<string, SchoolItem>();
        // Start with official static 109
        for (const s of SCHOOLS_DATA) {
            map.set(s.nama.toLowerCase().trim(), s);
        }
        // Merge dynamic database items
        for (const s of schools) {
            map.set(s.nama.toLowerCase().trim(), s);
        }
        dynamicSchools = Array.from(map.values());
    }
}

export function addSchoolToCache(school: SchoolItem) {
    const key = school.nama.toLowerCase().trim();
    const existingIdx = dynamicSchools.findIndex(s => s.nama.toLowerCase().trim() === key);
    if (existingIdx >= 0) {
        dynamicSchools[existingIdx] = { ...dynamicSchools[existingIdx], ...school };
    } else {
        dynamicSchools.push(school);
    }
}

export function getSchoolsByKecamatan(kecamatan: string, customList?: SchoolItem[]): SchoolItem[] {
    if (!kecamatan) return [];
    const list = customList || dynamicSchools;
    return list.filter(s => s.kecamatan.toLowerCase() === kecamatan.toLowerCase());
}

export function findSchoolByName(name: string, customList?: SchoolItem[]): SchoolItem | undefined {
    if (!name) return undefined;
    const list = customList || dynamicSchools;
    return list.find(s => s.nama.toLowerCase() === name.trim().toLowerCase());
}

export function findKecamatanBySchoolName(name: string, customList?: SchoolItem[]): string | undefined {
    const school = findSchoolByName(name, customList) || matchSchoolFuzzy(name, customList);
    return school?.kecamatan;
}

export function matchSchoolFuzzy(rawName: string, customList?: SchoolItem[]): SchoolItem | undefined {
    if (!rawName) return undefined;
    const list = customList || dynamicSchools;
    const exact = findSchoolByName(rawName, list);
    if (exact) return exact;

    let clean = rawName.toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    clean = clean
        .replace(/\bsmpn\b/g, "smp negeri")
        .replace(/\bsmp n\b/g, "smp negeri")
        .replace(/\bsatap\b/g, "satu atap")
        .replace(/\bmaarif\b/g, "ma'arif")
        .replace(/\bma arif\b/g, "ma'arif")
        .replace(/\bwsb\b/g, "wonosobo")
        .replace(/\bal quran\b/g, "al-quran")
        .replace(/\bal qur an\b/g, "al-quran");

    for (const item of list) {
        const itemClean = item.nama.toLowerCase()
            .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
            .replace(/\s+/g, " ")
            .replace(/\bmaarif\b/g, "ma'arif")
            .replace(/\bal quran\b/g, "al-quran")
            .trim();
        if (itemClean === clean) return item;
    }

    return undefined;
}

