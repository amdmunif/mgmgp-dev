import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Plus, Save, GripVertical, CheckCircle2, Check, ChevronsUpDown } from 'lucide-react';
import { questionService } from '../../../services/questionService';
import type { Question } from '../../../services/questionService';
import { learningService } from '../../../services/learningService';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';
import { Editor } from '@tinymce/tinymce-react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../../../components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../../components/ui/popover";

interface QuestionBuilderProps {
    basePath?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export function QuestionBuilder({ basePath = '/admin/questions' }: QuestionBuilderProps) {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [tpList, setTpList] = useState<any[]>([]);

    // Question State
    const [q, setQ] = useState<Partial<Question>>({
        content: '',
        type: 'single_choice',
        level: 'Sedang',
        mapel: '',
        kelas: '',
        options: [
            { id: generateId(), text: '', is_correct: false },
            { id: generateId(), text: '', is_correct: false }
        ],
        answer_key: '',
        explanation: ''
    });

    useEffect(() => {
        if (id) {
            loadQuestion(id);
        }
    }, [id]);

    useEffect(() => {
        if (q.mapel && q.kelas) {
            learningService.getAll('tp').then(tps => {
                const filtered = tps.filter(t => t.mapel === q.mapel && t.kelas === q.kelas);
                setTpList(filtered);
            });
        }
    }, [q.mapel, q.kelas]);

    async function loadQuestion(qId: string) {
        setFetching(true);
        try {
            const data = await questionService.getById(qId);
            setQ(data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat soal');
            navigate(basePath);
        } finally {
            setFetching(false);
        }
    }

    const handleSave = async () => {
        if (!q.content || !q.mapel || !q.kelas) {
            toast.error('Mohon lengkapi Konten, Mapel, dan Kelas');
            return;
        }

        // Validate Options
        if (q.type !== 'essay' && q.type !== 'short_answer' && (!q.options || q.options.length < 2)) {
            toast.error('Minimal 2 opsi jawaban diperlukan');
            return;
        }

        // Validate Correct Answer
        if ((q.type === 'single_choice' || q.type === 'true_false') && !q.options?.some((o: any) => o.is_correct)) {
            toast.error('Pilih satu jawaban benar');
            return;
        }

        setLoading(true);
        try {
            if (id) {
                await questionService.update(id, q);
                toast.success('Pertanyaan berhasil diperbarui!');
            } else {
                const res = await questionService.create(q);
                // @ts-ignore
                const msg = res.debug_role ? `Pertanyaan dibuat! (${res.debug_role} -> ${res.debug_status})` : 'Pertanyaan berhasil dibuat!';
                toast.success(msg);
            }
            navigate(basePath);
        } catch (error) {
            console.error(error);
            toast.error('Gagal menyimpan');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-center text-gray-500">Memuat data soal...</div>;

    const handleUpdateOption = (id: string, updates: any) => {
        let newOptions = q.options?.map((o: any) =>
            o.id === id ? { ...o, ...updates } : o
        );

        // Single Choice & True/False Logic (Mutually Exclusive)
        if ((q.type === 'single_choice' || q.type === 'true_false') && updates.is_correct) {
            newOptions = newOptions?.map((o: any) =>
                o.id === id ? o : { ...o, is_correct: false }
            );
        }

        setQ({ ...q, options: newOptions });
    };

    return (
        <div className="w-full p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(basePath)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                    </Button>
                    <h1 className="text-2xl font-bold">{id ? 'Edit Pertanyaan' : 'Buat Pertanyaan Baru'}</h1>
                </div>
                <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="w-4 h-4 mr-2" /> Simpan
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Meta Sidebar (1 Col) */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 border-b pb-2">Metadata</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg bg-white"
                                value={q.mapel}
                                onChange={e => setQ({ ...q, mapel: e.target.value })}
                            >
                                <option value="">Pilih Mapel</option>
                                <option value="Informatika">Informatika</option>
                                <option value="KKA">KKA</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg bg-white"
                                value={q.kelas}
                                onChange={e => setQ({ ...q, kelas: e.target.value })}
                            >
                                <option value="">Pilih Kelas</option>
                                <option value="7">Kelas 7</option>
                                <option value="8">Kelas 8</option>
                                <option value="9">Kelas 9</option>
                            </select>
                        </div>

                        {/* TP Selector (Combobox) */}
                        {q.mapel && q.kelas && (
                            <div className="flex flex-col gap-1">
                                <label className="block text-sm font-medium text-gray-700">Tujuan Pembelajaran (TP)</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between font-normal text-left h-auto min-h-[40px] px-3 py-2",
                                                !q.tp_code && "text-muted-foreground"
                                            )}
                                        >
                                            {q.tp_code
                                                ? (() => {
                                                    const selected = tpList.find((tp) => (tp.code || tp.id) === String(q.tp_code));
                                                    return selected
                                                        ? `${selected.code ? `[${selected.code}] ` : ''}${selected.title}`
                                                        : q.tp_code; // Fallback if not found in list but exists
                                                })()
                                                : "Pilih Tujuan Pembelajaran..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari kode atau deskripsi TP..." />
                                            <CommandList>
                                                <CommandEmpty>TP tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {tpList.map((tp) => (
                                                        <CommandItem
                                                            value={`${tp.code || ''} ${tp.title}`}
                                                            key={tp.id}
                                                            onSelect={() => {
                                                                setQ({
                                                                    ...q,
                                                                    tp_code: (tp.code || tp.id) as any, // Use code if available, else ID
                                                                    tp_id: tp.id
                                                                });
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    q.tp_code === (tp.code || tp.id)
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-xs text-gray-500 font-mono">
                                                                    {tp.code || '-'}
                                                                </span>
                                                                <span className="text-sm line-clamp-2">
                                                                    {tp.title}
                                                                </span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat Kesulitan</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg bg-white"
                                value={q.level}
                                onChange={e => setQ({ ...q, level: e.target.value as any })}
                            >
                                <option value="Mudah">Mudah</option>
                                <option value="Sedang">Sedang</option>
                                <option value="Sukar">Sukar</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Soal</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg bg-white"
                                value={q.type}
                                onChange={e => {
                                    const type = e.target.value as any;
                                    let updates: any = { type };

                                    if (type === 'true_false') {
                                        updates.options = [
                                            { id: generateId(), text: 'Benar', is_correct: false },
                                            { id: generateId(), text: 'Salah', is_correct: false }
                                        ];
                                    }
                                    setQ({ ...q, ...updates });
                                }}
                            >
                                <option value="single_choice">Pilihan Ganda (1 Jawaban)</option>
                                <option value="multiple_choice">Pilihan Ganda Kompleks</option>
                                <option value="true_false">Benar / Salah</option>
                                <option value="short_answer">Isian Singkat</option>
                                <option value="essay">Uraian / Essay</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Editor Content (3 Cols) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <label className="block text-sm font-bold text-gray-900 mb-4">Konten Pertanyaan</label>
                        <div className="prose-editor">
                            <Editor
                                apiKey="v0pr5r6jas8tgvj6z52hcgoxpr0xn8rdhay23qjclny6tc5e"
                                value={q.content}
                                onEditorChange={(content) => setQ({ ...q, content })}
                                init={{
                                    height: 500,
                                    menubar: true,
                                    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                                    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                                    content_style: 'body { font-family:Inter,system-ui,sans-serif; font-size:16px; line-height:1.6 }',
                                    branding: false,
                                    promotion: false
                                }}
                            />
                        </div>
                    </div>

                    {/* Answer Key for Essay/Short Answer */}
                    {(q.type === 'essay' || q.type === 'short_answer') && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <label className="block text-sm font-bold text-gray-900 mb-2">Kunci Jawaban</label>
                            <textarea
                                className="w-full px-4 py-3 border rounded-lg"
                                rows={4}
                                placeholder="Masukkan kunci jawaban atau poin-poin penting..."
                                value={q.answer_key || ''}
                                onChange={e => setQ({ ...q, answer_key: e.target.value })}
                            />
                        </div>
                    )}

                    {/* Options for Choices */}
                    {(q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'true_false') && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-sm font-bold text-gray-900">Pilihan Jawaban</label>
                                {q.type !== 'true_false' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setQ({
                                            ...q,
                                            options: [...(q.options || []), { id: generateId(), text: '', is_correct: false }]
                                        })}
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Tambah Opsi
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {q.options?.map((opt: any, idx) => (
                                    <div key={opt.id} className="flex items-center gap-3">
                                        <div className="cursor-move text-gray-300">
                                            <GripVertical className="w-5 h-5" />
                                        </div>

                                        <button
                                            onClick={() => handleUpdateOption(opt.id, { is_correct: !opt.is_correct })}
                                            className={cn(
                                                "w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                                opt.is_correct
                                                    ? "bg-green-500 border-green-500 text-white"
                                                    : "border-gray-200 hover:border-green-400 text-transparent hover:text-green-200"
                                            )}
                                            title="Tandai Jawaban Benar"
                                        >
                                            <CheckCircle2 className="w-6 h-6" />
                                        </button>

                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                className={cn(
                                                    "w-full px-4 py-3 border rounded-lg transition-colors text-base",
                                                    opt.is_correct ? "border-green-500 bg-green-50" : "border-gray-200",
                                                    q.type === 'true_false' && "bg-gray-50 text-gray-500 cursor-not-allowed"
                                                )}
                                                placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                                                value={opt.text}
                                                readOnly={q.type === 'true_false'}
                                                onChange={e => handleUpdateOption(opt.id, { text: e.target.value })}
                                            />
                                        </div>

                                        {q.type !== 'true_false' && (
                                            <button
                                                onClick={() => {
                                                    const newOptions = q.options?.filter((o: any) => o.id !== opt.id);
                                                    setQ({ ...q, options: newOptions });
                                                }}
                                                className="text-gray-400 hover:text-red-500 p-2"
                                                title="Hapus Opsi"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
