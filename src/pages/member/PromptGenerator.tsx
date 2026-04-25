import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Wand2, Copy, Check, Save, Globe, X, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { api } from '../../lib/api';
import { authService } from '../../services/authService';

const MAPEL_LIST = ['Informatika', 'KKA', 'Lainnya'];
const KELAS_LIST = ['7', '8', '9'];
const JENIS_SOAL_LIST = [
    { value: 'pilihan_ganda', label: 'Pilihan Ganda' },
    { value: 'pgk', label: 'PG Kompleks' },
    { value: 'isian_singkat', label: 'Isian Singkat' },
    { value: 'menjodohkan', label: 'Menjodohkan' },
    { value: 'essay', label: 'Essay / Uraian' },
];

interface FormData {
    mapel: string;
    mapel_custom: string;
    kelas: string;
    tp_mode: 'manual' | 'database';
    tujuan_pembelajaran: string[];
    jenis_soal: string[]; // Changed to array
    essay_tipe: string;
    jumlah_soal: number;
    persen_mudah: number;
    persen_menengah: number;
    persen_sukar: number;
    jumlah_pilihan: number;
    ada_stimulus: boolean;
    lampirkan_file: boolean;
    format_excel: boolean;
    keterangan_tambahan: string;
}

const defaultForm: FormData = {
    mapel: 'Informatika',
    mapel_custom: '',
    kelas: '8',
    tp_mode: 'manual',
    tujuan_pembelajaran: [''],
    jenis_soal: ['pilihan_ganda'],
    essay_tipe: 'terbuka',
    jumlah_soal: 20,
    persen_mudah: 50,
    persen_menengah: 30,
    persen_sukar: 20,
    jumlah_pilihan: 4,
    ada_stimulus: false,
    lampirkan_file: false,
    format_excel: false,
    keterangan_tambahan: '',
};

function generatePromptText(form: FormData): string {
    const mapel = form.mapel === 'Lainnya' ? form.mapel_custom : form.mapel;
    const tp = form.tujuan_pembelajaran.filter(t => t.trim()).map((t, i) => `${i + 1}. ${t}`).join('\n');
    const selectedJenisLabels = JENIS_SOAL_LIST.filter(j => form.jenis_soal.includes(j.value)).map(j => j.label).join(', ');

    let prompt = `Saya adalah Guru ${mapel} kelas ${form.kelas}, tolong buatkan ${form.jumlah_soal} soal dengan variasi jenis: ${selectedJenisLabels}`;

    if (form.tujuan_pembelajaran.filter(t => t.trim()).length > 0) {
        prompt += ` dengan tujuan pembelajaran:\n${tp}`;
    }

    if (form.lampirkan_file) {
        prompt += `\n\nPembuatan soal harus mengacu pada file yang sudah saya upload sebelumnya.`;
    }

    if (form.ada_stimulus) {
        prompt += ` Untuk setiap soal, buatkan stimulus yang relevan.`;
    }

    if (form.jenis_soal.includes('pilihan_ganda') || form.jenis_soal.includes('pgk')) {
        const pilihanLabels: Record<number, string> = { 4: '(A, B, C, dan D)', 5: '(A, B, C, D, dan E)' };
        prompt += `\n\nUntuk soal Pilihan Ganda/PGK, jawaban terdiri dari ${form.jumlah_pilihan} pilihan ${pilihanLabels[form.jumlah_pilihan] || ''}. Kunci jawaban secara acak dari pilihan yang ada.`;
        prompt += ` Pada pilihan jawaban, pastikan jumlah karakternya hampir sama, jangan sampai ada yang berbeda sehingga terlihat kalau itu jawaban.`;
    }

    if (form.jenis_soal.includes('essay')) {
        const tipeLabel = form.essay_tipe === 'terbuka' ? 'soal terbuka (tidak ada satu jawaban benar)' : 'soal terstruktur (ada jawaban yang diharapkan)';
        prompt += `\n\nUntuk soal Uraian (Essay), gunakan tipe: ${tipeLabel}.`;
    }

    if (form.format_excel) {
        prompt += `\n\nBuatkan dalam format Excel yang saya kasih.`;
    }

    prompt += `\n\nPorsi soal terdiri dari ${form.persen_mudah}% soal mudah, ${form.persen_menengah}% soal menengah, dan ${form.persen_sukar}% soal sukar.`;
    prompt += ` Soal dan pertanyaan harus formal, tidak boleh ada nada bercanda. Bahasa yang digunakan wajib mudah dipahami oleh siswa kelas ${form.kelas}.`;

    if (form.keterangan_tambahan.trim()) {
        prompt += `\n\nKeterangan tambahan:\n${form.keterangan_tambahan}`;
    }

    return prompt;
}

export function PromptGenerator() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormData>(defaultForm);
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveTitle, setSaveTitle] = useState('');
    const [savePublish, setSavePublish] = useState(false);

    // DB TP State
    const [dbTps, setDbTps] = useState<any[]>([]);
    const [loadingTps, setLoadingTps] = useState(false);

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Prompt Generator',
                description: 'Buat prompt AI yang lengkap untuk pembuatan soal secara otomatis.',
                icon: <Wand2 className="w-6 h-6 text-purple-600" />
            });
        }
    }, [setPageHeader]);

    useEffect(() => {
        if (form.tp_mode === 'database') {
            loadTps();
        }
    }, [form.tp_mode, form.mapel, form.kelas]);

    const loadTps = async () => {
        setLoadingTps(true);
        try {
            const data = await api.get<any[]>(`/tp?mapel=${form.mapel}&kelas=${form.kelas}`);
            setDbTps(data || []);
        } catch (e) {
            console.error('Gagal load TP:', e);
        } finally {
            setLoadingTps(false);
        }
    };

    const toggleTPSelection = (tujuan: string) => {
        setForm(prev => {
            const current = prev.tujuan_pembelajaran;
            if (current.includes(tujuan)) {
                return { ...prev, tujuan_pembelajaran: current.filter(t => t !== tujuan) };
            } else {
                return { ...prev, tujuan_pembelajaran: [...current, tujuan] };
            }
        });
    };

    const updateTP = (index: number, value: string) => {
        const newTP = [...form.tujuan_pembelajaran];
        newTP[index] = value;
        setForm(prev => ({ ...prev, tujuan_pembelajaran: newTP }));
    };

    const addTP = () => setForm(prev => ({ ...prev, tujuan_pembelajaran: [...prev.tujuan_pembelajaran, ''] }));
    const removeTP = (index: number) => setForm(prev => ({
        ...prev,
        tujuan_pembelajaran: prev.tujuan_pembelajaran.filter((_, i) => i !== index)
    }));

    const handleGenerate = () => {
        const prompt = generatePromptText(form);
        setGeneratedPrompt(prompt);
        setStep(4);
        const mapel = form.mapel === 'Lainnya' ? form.mapel_custom : form.mapel;
        const jenisLabel = JENIS_SOAL_LIST.filter(j => form.jenis_soal.includes(j.value)).map(j => j.label).join(', ');
        setSaveTitle(`Soal ${jenisLabel} ${mapel} Kelas ${form.kelas}`);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        toast.success('Prompt berhasil disalin!');
    };

    const handleSave = async () => {
        if (!saveTitle.trim()) return toast.error('Judul tidak boleh kosong');
        setSaving(true);
        try {
            const { profile } = await authService.getCurrentUser() || {};
            const userId = profile?.id;
            await api.post('/prompts', {
                title: saveTitle,
                description: `Dibuat via Prompt Generator — ${form.mapel} Kelas ${form.kelas}`,
                category: 'Teaching',
                prompt_content: generatedPrompt,
                is_premium: 1,
                is_published: savePublish ? 1 : 0,
                source_type: 'generator',
                created_by: userId,
                generator_meta: JSON.stringify(form),
            });
            toast.success(savePublish ? 'Prompt disimpan & dipublikasikan ke library!' : 'Prompt disimpan ke koleksi Anda!');
            setShowSaveDialog(false);
        } catch (e: any) {
            toast.error(e.message || 'Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white text-sm';
    const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Step Indicator */}
            <div className="flex items-center gap-2">
                {['Dasar', 'Konfigurasi Soal', 'Stimulus & Extra', 'Hasil Prompt'].map((label, i) => (
                    <div key={i} className="flex items-center gap-2 flex-1">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            step === i + 1 ? 'bg-purple-600 text-white' :
                            step > i + 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                            <span>{i + 1}</span>
                            <span className="hidden sm:inline">{label}</span>
                        </div>
                        {i < 3 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Step 1: Dasar */}
                {step === 1 && (
                    <div className="p-6 md:p-8 space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-black">1</span>
                            Informasi Dasar
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Mata Pelajaran</label>
                                <select className={inputClass} value={form.mapel} onChange={e => setForm(p => ({ ...p, mapel: e.target.value }))}>
                                    {MAPEL_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                {form.mapel === 'Lainnya' && (
                                    <input className={`${inputClass} mt-2`} placeholder="Tulis mata pelajaran..." value={form.mapel_custom}
                                        onChange={e => setForm(p => ({ ...p, mapel_custom: e.target.value }))} />
                                )}
                            </div>
                            <div>
                                <label className={labelClass}>Kelas</label>
                                <select className={inputClass} value={form.kelas} onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))}>
                                    {KELAS_LIST.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelClass}>Tujuan Pembelajaran</label>
                                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                    <button 
                                        onClick={() => setForm(p => ({ ...p, tp_mode: 'manual', tujuan_pembelajaran: [''] }))}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${form.tp_mode === 'manual' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Manual
                                    </button>
                                    <button 
                                        onClick={() => setForm(p => ({ ...p, tp_mode: 'database', tujuan_pembelajaran: [] }))}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${form.tp_mode === 'database' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Database
                                    </button>
                                </div>
                            </div>

                            {form.tp_mode === 'manual' ? (
                                <div className="space-y-2">
                                    {form.tujuan_pembelajaran.map((tp, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input className={inputClass} placeholder={`Tujuan pembelajaran ${i + 1}...`}
                                                value={tp} onChange={e => updateTP(i, e.target.value)} />
                                            {form.tujuan_pembelajaran.length > 1 && (
                                                <button onClick={() => removeTP(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={addTP} className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1">
                                        + Tambah TP Manual
                                    </button>
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="max-h-64 overflow-y-auto p-4 space-y-2 bg-gray-50">
                                        {loadingTps ? (
                                            <div className="py-8 text-center text-gray-500"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Memuat TP...</div>
                                        ) : dbTps.length === 0 ? (
                                            <div className="py-8 text-center text-gray-500 text-xs italic">Tidak ada TP ditemukan untuk filter ini.</div>
                                        ) : (
                                            dbTps.map((tp, i) => (
                                                <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${form.tujuan_pembelajaran.includes(tp.tujuan) ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200 hover:border-purple-100'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={form.tujuan_pembelajaran.includes(tp.tujuan)}
                                                        onChange={() => toggleTPSelection(tp.tujuan)}
                                                        className="mt-1 w-4 h-4 text-purple-600 rounded"
                                                    />
                                                    <span className="text-xs text-gray-700 leading-relaxed">{tp.tujuan}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={() => setStep(2)} className="bg-purple-600 hover:bg-purple-700 gap-2 h-9 text-xs">
                                Lanjut <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Konfigurasi Soal */}
                {step === 2 && (
                    <div className="p-6 md:p-8 space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-black">2</span>
                            Konfigurasi Soal
                        </h2>
                        <div className="grid grid-cols-1 gap-5">
                            <div>
                                <label className={labelClass}>Pilih Jenis Soal (Boleh lebih dari 1)</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {JENIS_SOAL_LIST.map(j => (
                                        <label key={j.value} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${form.jenis_soal.includes(j.value) ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200'}`}>
                                            <input 
                                                type="checkbox" 
                                                checked={form.jenis_soal.includes(j.value)}
                                                onChange={() => {
                                                    setForm(p => {
                                                        const current = p.jenis_soal;
                                                        if (current.includes(j.value)) {
                                                            if (current.length === 1) return p; // Must have at least one
                                                            return { ...p, jenis_soal: current.filter(val => val !== j.value) };
                                                        }
                                                        return { ...p, jenis_soal: [...current, j.value] };
                                                    });
                                                }}
                                                className="w-4 h-4 text-purple-600 rounded"
                                            />
                                            <span className="text-xs font-semibold">{j.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Jumlah Soal Keseluruhan</label>
                                <input type="number" min={1} max={100} className={inputClass} value={form.jumlah_soal}
                                    onChange={e => setForm(p => ({ ...p, jumlah_soal: Number(e.target.value) }))} />
                            </div>
                        </div>

                        {form.jenis_soal.includes('essay') && (
                            <div>
                                <label className={labelClass}>Tipe Uraian</label>
                                <div className="flex gap-3">
                                    {[{ value: 'terbuka', label: 'Soal Terbuka', desc: 'Tidak ada satu jawaban benar' }, { value: 'terstruktur', label: 'Soal Terstruktur', desc: 'Ada jawaban yang diharapkan' }].map(opt => (
                                        <label key={opt.value} className={`flex-1 p-3 border-2 rounded-xl cursor-pointer transition-all ${form.essay_tipe === opt.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'}`}>
                                            <input type="radio" className="sr-only" value={opt.value} checked={form.essay_tipe === opt.value}
                                                onChange={() => setForm(p => ({ ...p, essay_tipe: opt.value }))} />
                                            <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(form.jenis_soal.includes('pilihan_ganda') || form.jenis_soal.includes('pgk')) && (
                            <div>
                                <label className={labelClass}>Jumlah Pilihan Jawaban</label>
                                <div className="flex gap-3">
                                    {[4, 5].map(n => (
                                        <label key={n} className={`flex items-center gap-2 px-4 py-2.5 border-2 rounded-xl cursor-pointer transition-all ${form.jumlah_pilihan === n ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                                            <input type="radio" className="sr-only" checked={form.jumlah_pilihan === n} onChange={() => setForm(p => ({ ...p, jumlah_pilihan: n }))} />
                                            <span className="font-bold text-sm">{n} Pilihan</span>
                                            <span className="text-xs text-gray-400">{n === 4 ? '(A–D)' : '(A–E)'}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className={labelClass}>Distribusi Tingkat Kesulitan (%)</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { key: 'persen_mudah', label: 'Mudah', color: 'text-green-600' },
                                    { key: 'persen_menengah', label: 'Menengah', color: 'text-yellow-600' },
                                    { key: 'persen_sukar', label: 'Sukar', color: 'text-red-600' },
                                ].map(item => (
                                    <div key={item.key}>
                                        <label className={`block text-xs font-bold mb-1 ${item.color}`}>{item.label}</label>
                                        <input type="number" min={0} max={100} className={inputClass}
                                            value={(form as any)[item.key]}
                                            onChange={e => setForm(p => ({ ...p, [item.key]: Number(e.target.value) }))} />
                                        <p className="text-xs text-gray-400 mt-1 text-center">{(form as any)[item.key]}%</p>
                                    </div>
                                ))}
                            </div>
                            {form.persen_mudah + form.persen_menengah + form.persen_sukar !== 100 && (
                                <p className="text-xs text-red-500 mt-1">⚠️ Total harus 100% (sekarang: {form.persen_mudah + form.persen_menengah + form.persen_sukar}%)</p>
                            )}
                        </div>

                        <div className="flex justify-between pt-2">
                            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                                <ChevronLeft className="w-4 h-4" /> Kembali
                            </Button>
                            <Button onClick={() => setStep(3)} className="bg-purple-600 hover:bg-purple-700 gap-2"
                                disabled={form.persen_mudah + form.persen_menengah + form.persen_sukar !== 100}>
                                Lanjut <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Stimulus & Extra */}
                {step === 3 && (
                    <div className="p-6 md:p-8 space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-black">3</span>
                            Stimulus & Keterangan Tambahan
                        </h2>

                        <div className="space-y-4">
                            {[
                                { key: 'ada_stimulus', label: 'Sertakan Stimulus per Soal', desc: 'Setiap soal akan memiliki teks/gambar stimulus yang relevan' },
                                { key: 'lampirkan_file', label: 'Lampirkan File ke AI', desc: 'Prompt akan menyebut bahwa ada file yang sudah di-upload sebagai referensi' },
                                { key: 'format_excel', label: 'Minta Format Excel', desc: 'Prompt akan meminta output dalam format Excel yang ditentukan' },
                            ].map(item => (
                                <label key={item.key} className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${(form as any)[item.key] ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'}`}>
                                    <input type="checkbox" className="mt-0.5 w-4 h-4 text-purple-600 rounded"
                                        checked={(form as any)[item.key]}
                                        onChange={e => setForm(p => ({ ...p, [item.key]: e.target.checked }))} />
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div>
                            <label className={labelClass}>Keterangan Tambahan (opsional)</label>
                            <textarea className={`${inputClass} h-28 resize-none`}
                                placeholder="Contoh: Gunakan konteks sekolah menengah di Indonesia. Hindari soal tentang kekerasan..."
                                value={form.keterangan_tambahan}
                                onChange={e => setForm(p => ({ ...p, keterangan_tambahan: e.target.value }))} />
                        </div>

                        <div className="flex justify-between pt-2">
                            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                                <ChevronLeft className="w-4 h-4" /> Kembali
                            </Button>
                            <Button onClick={handleGenerate} className="bg-purple-600 hover:bg-purple-700 gap-2">
                                <Wand2 className="w-4 h-4" /> Generate Prompt
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Hasil */}
                {step === 4 && (
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-purple-600" /> Prompt Siap Digunakan!
                            </h2>
                            <Button variant="outline" size="sm" onClick={() => setStep(1)}>Buat Baru</Button>
                        </div>

                        <div className="relative bg-gray-900 rounded-xl p-5">
                            <pre className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed font-mono overflow-auto max-h-96">
                                {generatedPrompt}
                            </pre>
                            <button onClick={handleCopy}
                                className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copied ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}>
                                {copied ? <><Check className="w-3.5 h-3.5" /> Tersalin!</> : <><Copy className="w-3.5 h-3.5" /> Salin Prompt</>}
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button onClick={handleCopy} className={`flex-1 gap-2 ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                                {copied ? <><Check className="w-4 h-4" /> Tersalin!</> : <><Copy className="w-4 h-4" /> Salin ke Clipboard</>}
                            </Button>
                            <Button variant="outline" onClick={() => setShowSaveDialog(true)} className="flex-1 gap-2">
                                <Save className="w-4 h-4" /> Simpan Prompt
                            </Button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                            <p className="font-semibold mb-1">💡 Cara Penggunaan:</p>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                <li>Salin prompt di atas</li>
                                <li>Buka ChatGPT, Gemini, atau AI lain pilihan Anda</li>
                                {form.lampirkan_file && <li>Upload file referensi (materi/KD/ATP) ke AI</li>}
                                <li>Tempelkan prompt dan kirim</li>
                            </ol>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Simpan Prompt</h3>
                            <button onClick={() => setShowSaveDialog(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div>
                            <label className={labelClass}>Judul Prompt</label>
                            <input className={inputClass} value={saveTitle} onChange={e => setSaveTitle(e.target.value)} placeholder="Nama untuk prompt ini..." />
                        </div>
                        <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${savePublish ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input type="checkbox" className="mt-0.5 w-4 h-4 text-purple-600 rounded" checked={savePublish} onChange={e => setSavePublish(e.target.checked)} />
                            <div>
                                <p className="font-semibold text-sm flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-purple-600" /> Publish ke Prompt Library</p>
                                <p className="text-xs text-gray-500 mt-0.5">Prompt akan bisa dilihat & disalin oleh sesama member premium</p>
                            </div>
                        </label>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setShowSaveDialog(false)}>Batal</Button>
                            <Button className="flex-1 bg-purple-600 hover:bg-purple-700 gap-2" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
