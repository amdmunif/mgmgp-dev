import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { letterService } from '../../../services/letterService';
import { Button } from '../../../components/ui/button';
import { LETTER_TEMPLATES } from '../../../lib/templates';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

export function CreateLetter() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (id) {
            fetchLetter();
        }
    }, [id]);

    const fetchLetter = async () => {
        setFetching(true);
        try {
            const data = await letterService.getById(id!);
            setSelectedTemplateId(data.template_id);
            setFormData(data.form_data || {});
        } catch (error) {
            console.error(error);
            alert('Gagal mengambil data surat');
        } finally {
            setFetching(false);
        }
    };

    const selectedTemplate = LETTER_TEMPLATES.find(t => t.id === selectedTemplateId);

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTemplateId(e.target.value);
        setFormData({}); // Reset form
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplate) return;

        setLoading(true);
        try {
            const userData = await authService.getCurrentUser();
            if (!userData?.user) throw new Error('User not logged in');

            const content = JSON.stringify(formData);

            if (id) {
                await letterService.update(id, {
                    template_id: selectedTemplate.id,
                    letter_number: formData.no_surat || 'DRAFT',
                    letter_date: formData.tanggal_surat || new Date().toISOString(),
                    subject: formData.perihal,
                    recipient: formData.kepada,
                    content: content,
                    form_data: formData
                });
            } else {
                await letterService.create({
                    template_id: selectedTemplate.id,
                    letter_number: formData.no_surat || 'DRAFT',
                    letter_date: formData.tanggal_surat || new Date().toISOString(),
                    subject: formData.perihal,
                    recipient: formData.kepada,
                    author_id: userData.user.id,
                    content: content,
                    form_data: formData
                });
            }

            navigate('/admin/letters');
        } catch (error) {
            console.error('Error creating letter:', error);
            alert('Gagal membuat surat');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <Button variant="ghost" className="mb-4 pl-0" onClick={() => navigate('/admin/letters')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Arsip
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit Surat' : 'Buat Surat Baru'}</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {fetching ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>
                ) : (
                    <>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Template Surat</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                value={selectedTemplateId}
                                onChange={handleTemplateChange}
                            >
                                <option value="">-- Pilih Template --</option>
                                {LETTER_TEMPLATES.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            {selectedTemplate && (
                                <p className="mt-2 text-sm text-gray-500">{selectedTemplate.description}</p>
                            )}
                        </div>

                        {selectedTemplate && (
                            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="border-t border-gray-100 pt-6 grid grid-cols-1 gap-6">
                                    {selectedTemplate.fields.map((field) => (
                                        <div key={field.name}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {field.label}
                                            </label>
                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    name={field.name}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 h-24"
                                                    value={formData[field.name] || ''}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    name={field.name}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                                    value={formData[field.name] || ''}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 flex justify-end">
                                    <Button type="submit" disabled={loading}>
                                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4 mr-2" /> Simpan & Generate</>}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
