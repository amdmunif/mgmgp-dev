import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Loader2, Save, Globe, Building2, UserPen, Upload, Trash2, Image as ImageIcon, CreditCard, Pencil, X } from 'lucide-react';
import { settingsService, type AppSettings, type BankAccount } from '../../services/settingsService';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
// Using simple state might be easier for this large form without complex validation logic yet.

export function AdminWebSettings() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // Bank Accounts State
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [editingAccount, setEditingAccount] = useState<Partial<BankAccount> | null>(null);
    const [savingAccount, setSavingAccount] = useState(false);

    // File states
    const [files, setFiles] = useState<{ [key: string]: File | null }>({});
    const [previews, setPreviews] = useState<{ [key: string]: string | null }>({});

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Pengaturan Sistem',
                description: 'Atur konten, branding, dan fungsionalitas website.',
                icon: <Globe className="w-6 h-6" />
            });
        }
        loadSettings();
    }, [setPageHeader]);

    async function loadSettings() {
        try {
            const settingsData = await settingsService.getSettings();
            setSettings(settingsData);
        } catch (error) {
            console.error('Failed to load settings', error);
            // If main settings fail, we probably can't do much
        }

        try {
            const bankData = await settingsService.getBankAccounts();
            setBankAccounts(bankData);
        } catch (error) {
            console.error('Failed to load bank accounts', error);
            // Bank accounts might fail if table missing, but we shouldn't block settings
        } finally {
            setLoading(false);
        }
    }

    const handleSaveAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAccount) return;
        setSavingAccount(true);
        try {
            if (editingAccount.id) {
                await settingsService.updateBankAccount(editingAccount.id, editingAccount);
            } else {
                await settingsService.createBankAccount(editingAccount);
            }
            // Reload bank accounts
            const data = await settingsService.getBankAccounts();
            setBankAccounts(data);
            setEditingAccount(null);
        } catch (error: any) {
            console.error(error);
            alert('Gagal menyimpan rekening bank: ' + (error.message || 'Unknown error'));
        } finally {
            setSavingAccount(false);
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm('Hapus rekening ini?')) return;
        try {
            await settingsService.deleteBankAccount(id);
            setBankAccounts(prev => prev.filter(acc => acc.id !== id));
        } catch (error) {
            alert('Gagal menghapus rekening');
        }
    };

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
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-end">
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
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-gray-900">Daftar Rekening Bank</h3>
                                    <Button type="button" size="sm" onClick={() => setEditingAccount({} as any)}>
                                        + Tambah Rekening
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {bankAccounts.map(account => (
                                        <div key={account.id} className="p-3 border border-gray-200 rounded-lg flex justify-between items-center bg-gray-50">
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{account.bank_name}</p>
                                                <p className="font-mono text-xs text-gray-600">{account.account_number}</p>
                                                <p className="text-xs text-gray-500">a.n. {account.account_holder}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${account.is_active ? 'bg-green-500' : 'bg-gray-300'}`} title={account.is_active ? 'Aktif' : 'Non-aktif'} />
                                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingAccount(account)}>
                                                    <Pencil className="w-3 h-3 text-gray-600" />
                                                </Button>
                                                <Button type="button" size="sm" variant="ghost" onClick={() => handleDeleteAccount(account.id)}>
                                                    <Trash2 className="w-3 h-3 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {bankAccounts.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center py-4 italic">Belum ada rekening bank yang ditambahkan.</p>
                                    )}
                                </div>
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
            {/* Bank Account Modal */}
            {editingAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-bold text-lg">{editingAccount.id ? 'Edit Rekening' : 'Tambah Rekening'}</h3>
                            <button onClick={() => setEditingAccount(null)}><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                                <input
                                    type="text"
                                    required
                                    value={editingAccount.bank_name || ''}
                                    onChange={e => setEditingAccount({ ...editingAccount, bank_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Contoh: Bank BCA"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
                                <input
                                    type="text"
                                    required
                                    value={editingAccount.account_number || ''}
                                    onChange={e => setEditingAccount({ ...editingAccount, account_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                    placeholder="Contoh: 1234567890"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Atas Nama</label>
                                <input
                                    type="text"
                                    required
                                    value={editingAccount.account_holder || ''}
                                    onChange={e => setEditingAccount({ ...editingAccount, account_holder: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Nama Pemilik Rekening"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={editingAccount.is_active !== false} // Default true
                                    onChange={e => setEditingAccount({ ...editingAccount, is_active: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">Aktifkan Rekening Ini</label>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setEditingAccount(null)}>Batal</Button>
                                <Button type="submit" disabled={savingAccount}>
                                    {savingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
