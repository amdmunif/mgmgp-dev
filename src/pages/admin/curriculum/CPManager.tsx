import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import { curriculumService } from '../../../services/curriculumService';
import { Loader2, Save } from 'lucide-react';
import type { CPData } from '../../../types';

export function CPManager() {
    const [activeTab, setActiveTab] = useState<'Informatika' | 'KKA'>('Informatika');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState('');
    const [currentCP, setCurrentCP] = useState<CPData | null>(null);

    useEffect(() => {
        fetchCP();
    }, [activeTab]);

    const fetchCP = async () => {
        setLoading(true);
        try {
            const data = await curriculumService.getCP(activeTab);
            if (data) {
                setCurrentCP(data);
                setContent(data.content || '');
            } else {
                setCurrentCP(null);
                setContent('');
            }
        } catch (error) {
            console.error(error);
            alert('Gagal mengambil data CP');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (currentCP) {
                await curriculumService.updateCP(currentCP.id, {
                    content: content,
                    mapel: activeTab
                });
            } else {
                await curriculumService.createCP({
                    mapel: activeTab,
                    content: content
                });
            }
            alert('Data CP berhasil disimpan');
            fetchCP(); // Refresh to get ID if created
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan data CP');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Capaian Pembelajaran (CP)</h1>
                    <p className="text-gray-500">Kelola konten Capaian Pembelajaran untuk setiap mata pelajaran.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 inline-flex">
                <button
                    onClick={() => setActiveTab('Informatika')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'Informatika'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    Informatika
                </button>
                <button
                    onClick={() => setActiveTab('KKA')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'KKA'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    Koding dan Kecerdasan Artifisial (KKA)
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="prose max-w-none">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Isi Capaian Pembelajaran ({activeTab})
                            </label>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                placeholder={`Tuliskan isi Capaian Pembelajaran untuk ${activeTab} di sini...`}
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
