import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Loader2, Save, Globe, Building2, UserPen, Upload, Trash2, Image as ImageIcon, CreditCard } from 'lucide-react';
import { settingsService, type AppSettings } from '../../services/settingsService';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
// Using simple state might be easier for this large form without complex validation logic yet.

export function AdminWebSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // File states
    const [files, setFiles] = useState<{ [key: string]: File | null }>({});
    const [previews, setPreviews] = useState<{ [key: string]: string | null }>({});

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await settingsService.getSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!settings) return;
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleEditorChange = (fieldName: string, content: string) => {
        if (!settings) return;
        setSettings({ ...settings, [fieldName]: content });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFiles(prev => ({ ...prev, [fieldName]: file }));
            setPreviews(prev => ({ ...prev, [fieldName]: URL.createObjectURL(file) }));
        }
    };

    const removeFile = (fieldName: string) => {
        setFiles(prev => ({ ...prev, [fieldName]: null }));
        setPreviews(prev => ({ ...prev, [fieldName]: null }));
        // Also clear from settings so it effectively removes it? 
        // Or we need a way to signal "delete this" to backend? 
        // For now, simple replacement logic. 
        if (settings) {
            setSettings({ ...settings, [fieldName]: '' });
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        try {
            // Upload changed files first
            const updatedSettings = { ...settings };

            // Map file keys to setting keys
            const fileKeys = Object.keys(files);
            for (const key of fileKeys) {
                const file = files[key];
                if (file) {
                    const url = await settingsService.uploadLogo(file); // Reusing uploadLogo for generic file upload
                    // Update the corresponding setting field
                    (updatedSettings as any)[key] = url;
                }
            }

            await settingsService.updateSettings(updatedSettings);

            // Reload to reflect changes globally if needed
            // window.location.reload(); 
            // Better UX: Just show success
            alert('Pengaturan berhasil disimpan!');
            setFiles({});
            setPreviews({});
            loadSettings();

        } catch (error) {
            console.error('Failed to save settings', error);
            alert('Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
    if (!settings) return <div className="p-8 text-red-500">Error loading settings</div>;

    const ImageUploader = ({ label, fieldName, currentUrl }: { label: string, fieldName: string, currentUrl?: string }) => (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {(previews[fieldName] || currentUrl) ? (
                        <img
                            src={previews[fieldName] || currentUrl}
                            alt={label}
                            className="w-full h-full object-contain p-1"
                        />
                    ) : (
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            Upload
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, fieldName)}
                            />
                        </label>
                        {(previews[fieldName] || currentUrl) && (
                            <button
                                type="button"
                                onClick={() => removeFile(fieldName)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Hapus
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-500">Format: PNG, JPG. Max 2MB.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengaturan Sistem</h1>
                    <p className="text-sm text-gray-500 mt-1">Atur konten, branding, dan fungsionalitas website.</p>
                </div>
                <Button onClick={handleSubmit} disabled={saving} size="lg" className="bg-blue-600 hover:bg-blue-700">
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4 mr-2" /> Simpan Perubahan</>}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Content (2/3) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Halaman Utama */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-600" />
                            <h2 className="font-semibold text-gray-900">Konten Situs Web - Halaman Utama</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Hero</label>
                                <input
                                    type="text"
                                    name="home_hero_title"
                                    value={settings.home_hero_title || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Selamat Datang..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subjudul Hero</label>
                                <textarea
                                    name="home_hero_subtitle"
                                    value={settings.home_hero_subtitle || ''}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Deskripsi singkat..."
                                />
                            </div>
                            <ImageUploader
                                label="Gambar Latar Hero"
                                fieldName="home_hero_image"
                                currentUrl={settings.home_hero_image}
                            />
                        </div>
                    </div>

                    {/* Halaman Profil */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <UserPen className="w-4 h-4 text-purple-600" />
                            <h2 className="font-semibold text-gray-900">Halaman Profil</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <p className="text-xs text-gray-500 flex items-center gap-1 bg-blue-50 p-2 rounded text-blue-700">
                                <span>💡</span> Anda dapat menggunakan tag HTML sederhana seperti <code>&lt;p&gt;</code>, <code>&lt;ul&gt;</code>, <code>&lt;strong&gt;</code> untuk format.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Visi</label>
                                <RichTextEditor
                                    value={settings.profile_visi || ''}
                                    onChange={(val) => handleEditorChange('profile_visi', val)}
                                    height={200}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Misi</label>
                                <RichTextEditor
                                    value={settings.profile_misi || ''}
                                    onChange={(val) => handleEditorChange('profile_misi', val)}
                                    height={250}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sejarah Singkat</label>
                                <RichTextEditor
                                    value={settings.profile_sejarah || ''}
                                    onChange={(val) => handleEditorChange('profile_sejarah', val)}
                                    height={300}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Struktur Organisasi (HTML/Table)</label>
                                <RichTextEditor
                                    value={settings.profile_struktur || ''}
                                    onChange={(val) => handleEditorChange('profile_struktur', val)}
                                    height={400}
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100 mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ketentuan Upgrade Premium</label>
                                <RichTextEditor
                                    value={settings.premium_rules || ''}
                                    onChange={(val) => handleEditorChange('premium_rules', val)}
                                    height={300}
                                    placeholder="Masukkan ketentuan upgrade premium..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Halaman Kontak */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-orange-600" />
                            <h2 className="font-semibold text-gray-900">Halaman Kontak</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                                <textarea
                                    name="contact_address"
                                    value={settings.contact_address || ''}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                                    <input
                                        type="text"
                                        name="contact_phone"
                                        value={settings.contact_phone || ''}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="contact_email"
                                        value={settings.contact_email || ''}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL Google Maps Embed</label>
                                <input
                                    type="text"
                                    name="contact_map_url"
                                    value={settings.contact_map_url || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-xs"
                                    placeholder="https://www.google.com/maps/embed?..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Branding & Signatures (1/3) */}
                <div className="space-y-8">
                    {/* Branding */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Branding & Aset</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <ImageUploader
                                label="Logo Aplikasi"
                                fieldName="logo_url"
                                currentUrl={settings.logo_url || settings.app_logo}
                            />
                            <ImageUploader
                                label="Kop Surat"
                                fieldName="kop_surat"
                                currentUrl={settings.kop_surat}
                            />
                        </div>
                    </div>

                    {/* Pejabat */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Pejabat & Tanda Tangan</h2>
                        </div>
                        <div className="p-6 space-y-8">

                            {/* Ketua */}
                            <div className="space-y-3">
                                <h3 className="font-medium text-gray-900 border-b border-gray-100 pb-2">Ketua MGMP</h3>
                                <input
                                    type="text"
                                    name="ketua_nama"
                                    value={settings.ketua_nama || ''}
                                    onChange={handleChange}
                                    placeholder="Nama Lengkap & Gelar"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                                <input
                                    type="text"
                                    name="ketua_nip"
                                    value={settings.ketua_nip || ''}
                                    onChange={handleChange}
                                    placeholder="NIP"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                                <ImageUploader
                                    label="Tanda Tangan Ketua"
                                    fieldName="ketua_signature_url"
                                    currentUrl={settings.ketua_signature_url}
                                />
                            </div>

                            {/* Sekretaris */}
                            <div className="space-y-3">
                                <h3 className="font-medium text-gray-900 border-b border-gray-100 pb-2">Sekretaris</h3>
                                <input
                                    type="text"
                                    name="sekretaris_nama"
                                    value={settings.sekretaris_nama || ''}
                                    onChange={handleChange}
                                    placeholder="Nama Lengkap & Gelar"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                                <input
                                    type="text"
                                    name="sekretaris_nip"
                                    value={settings.sekretaris_nip || ''}
                                    onChange={handleChange}
                                    placeholder="NIP"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                                <ImageUploader
                                    label="Tanda Tangan Sekretaris"
                                    fieldName="sekretaris_signature_url"
                                    currentUrl={settings.sekretaris_signature_url}
                                />
                            </div>

                            {/* MKKS */}
                            <div className="space-y-3">
                                <h3 className="font-medium text-gray-900 border-b border-gray-100 pb-2">Ketua MKKS</h3>
                                <input
                                    type="text"
                                    name="mkks_nama"
                                    value={settings.mkks_nama || ''}
                                    onChange={handleChange}
                                    placeholder="Nama Lengkap & Gelar"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                                <input
                                    type="text"
                                    name="mkks_nip"
                                    value={settings.mkks_nip || ''}
                                    onChange={handleChange}
                                    placeholder="NIP"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                                <ImageUploader
                                    label="Tanda Tangan Ketua MKKS"
                                    fieldName="mkks_signature_url"
                                    currentUrl={settings.mkks_signature_url}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pembayaran & Premium */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-green-600" />
                            <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Pembayaran & Premium</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                                <input
                                    type="text"
                                    name="bank_name"
                                    value={settings.bank_name || ''}
                                    onChange={handleChange}
                                    placeholder="Contoh: Bank BRI"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
                                <input
                                    type="text"
                                    name="bank_number"
                                    value={settings.bank_number || ''}
                                    onChange={handleChange}
                                    placeholder="Contoh: 1234-5678-90"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Atas Nama</label>
                                <input
                                    type="text"
                                    name="bank_holder"
                                    value={settings.bank_holder || ''}
                                    onChange={handleChange}
                                    placeholder="Nama Pemilik Rekening"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>
                            <div className="pt-2 border-t border-gray-100 mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Premium (Rp)</label>
                                <input
                                    type="number"
                                    name="premium_price"
                                    value={settings.premium_price || 0}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-green-700"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
