import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Plus, Save, GripVertical, CheckCircle2 } from 'lucide-react';
import { questionService } from '../../../services/questionService';
import type { Question } from '../../../services/questionService';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';
import { Editor } from '@tinymce/tinymce-react';

interface QuestionBuilderProps {
    basePath?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export function QuestionBuilder({ basePath = '/admin/questions' }: QuestionBuilderProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

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

    const handleSave = async () => {
        if (!q.content || !q.mapel || !q.kelas) {
            toast.error('Mohon lengkapi Konten, Mapel, dan Kelas');
            return;
        }

        // Validate Options
        if (q.type !== 'essay' && (!q.options || q.options.length < 2)) {
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
            await questionService.create(q);
            toast.success('Pertanyaan berhasil dibuat!');
            navigate(basePath);
        } catch (error) {
            console.error(error);
            toast.error('Gagal menyimpan');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateOption = (id: string, updates: any) => {
        let newOptions = q.options?.map((o: any) =>
            o.id === id ? { ...o, ...updates } : o
        );

        // Single Choice Logic
        if (q.type === 'single_choice' && updates.is_correct) {
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
                    <h1 className="text-2xl font-bold">Buat Pertanyaan Baru</h1>
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
                                onChange={e => setQ({ ...q, type: e.target.value as any })}
                            >
                                <option value="single_choice">Pilihan Ganda (1 Jawaban)</option>
                                <option value="multiple_choice">Pilihan Ganda Kompleks</option>
                                <option value="true_false">Benar / Salah</option>
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
                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key'}
                                value={q.content}
                                onEditorChange={(content) => setQ({ ...q, content })}
                                init={{
                                    height: 500,
                                    menubar: true,
                                    plugins: [
                                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                    ],
                                    toolbar: 'undo redo | blocks | ' +
                                        'bold italic forecolor | alignleft aligncenter ' +
                                        'alignright alignjustify | bullist numlist outdent indent | ' +
                                        'removeformat | help',
                                    content_style: 'body { font-family:Inter,system-ui,sans-serif; font-size:16px; line-height:1.6 }'
                                }}
                            />
                        </div>
                    </div>

                    {q.type !== 'essay' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-sm font-bold text-gray-900">Pilihan Jawaban</label>
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
                                                    opt.is_correct ? "border-green-500 bg-green-50" : "border-gray-200"
                                                )}
                                                placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                                                value={opt.text}
                                                onChange={e => handleUpdateOption(opt.id, { text: e.target.value })}
                                            />
                                        </div>
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
