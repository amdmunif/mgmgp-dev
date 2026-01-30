import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Loader2, Save, Globe, Building2, CreditCard } from 'lucide-react';
import { settingsService, type AppSettings } from '../../services/settingsService';

export function AdminWebSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await settingsService.getSettings();
            setSettings(data);
            setPreviewUrl(data.logo_url || null);
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        try {
            let logo_url = settings.logo_url;

            if (logoFile) {
                logo_url = await settingsService.uploadLogo(logoFile);
            }

            await settingsService.updateSettings({
                ...settings,
                logo_url
            });

            // Force reload to update favicon immediately if changed
            if (logoFile) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to save settings', error);
            alert('Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!settings) return;
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!settings) return <div className="p-8">Error loading settings</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan Website</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Identity Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Globe className="w-4 h-4" /> Identitas Website
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Website</label>
                                <input
                                    type="text"
                                    name="site_title"
                                    value={settings.site_title || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Singkat</label>
                                <input
                                    type="text"
                                    name="site_description"
                                    value={settings.site_description || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Logo Website (Favicon)</label>
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-xs text-gray-400">No Logo</span>
                                    )}
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="mb-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                    />
                                    <p className="text-xs text-gray-500">Format: PNG, JPG, ICO. Max 2MB.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> Kontak & Alamat
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={settings.email || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">No. HP / WhatsApp</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={settings.phone || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Lengkap</label>
                                <textarea
                                    name="address"
                                    value={settings.address || ''}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Section (Preparation for Premium) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Info Pembayaran (Premium)
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Bank</label>
                                <input
                                    type="text"
                                    name="bank_name"
                                    value={settings.bank_name || ''}
                                    onChange={handleChange}
                                    placeholder="ex: Bank Jatim"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">No. Rekening</label>
                                <input
                                    type="text"
                                    name="bank_number"
                                    value={settings.bank_number || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Atas Nama</label>
                                <input
                                    type="text"
                                    name="bank_holder"
                                    value={settings.bank_holder || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Harga Premium (per Tahun)</label>
                            <input
                                type="number"
                                name="premium_price"
                                value={settings.premium_price || 0}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving} size="lg">
                        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4 mr-2" /> Simpan Pengaturan</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}
