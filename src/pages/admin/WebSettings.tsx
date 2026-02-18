import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Loader2, Save, Globe, Building2, UserPen, Upload, Trash2, Image as ImageIcon, CreditCard, Pencil, X, PenTool } from 'lucide-react';
import { settingsService, type AppSettings, type BankAccount } from '../../services/settingsService';
import { RichTextEditor } from '../../components/ui/RichTextEditor';

export function AdminWebSettings() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // Bank Accounts State
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [editingAccount, setEditingAccount] = useState<Partial<BankAccount> | null>(null);
    const [savingAccount, setSavingAccount] = useState(false);

    // File states
    const [files, setFiles] = useState<{ [key: string]: File | null }>({});
    const [previews, setPreviews] = useState<{ [key: string]: string | null }>({});

    // Tab State
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'Umum', icon: Globe },
        { id: 'home', label: 'Konten Beranda', icon: ImageIcon },
        { id: 'profile', label: 'Profil & Organisasi', icon: UserPen },
        { id: 'officials', label: 'Pejabat & Tanda Tangan', icon: PenTool },
        { id: 'contact', label: 'Kontak', icon: Building2 },
        { id: 'payment', label: 'Pembayaran & Premium', icon: CreditCard },
    ];

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
        setLoading(true);
        try {
            const [settingsData, accountsData] = await Promise.all([
                settingsService.getSettings(),
                settingsService.getBankAccounts()
            ]);
            setSettings(settingsData);
            setBankAccounts(accountsData);
            setError(null);
        } catch (error: any) {
            console.error('Failed to load settings:', error);
            setError(error.message || 'Gagal memuat pengaturan. Periksa koneksi atau database.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveAccount(e: React.FormEvent) {
        e.preventDefault();
        if (!editingAccount) return;

        setSavingAccount(true);
        try {
            if (editingAccount.id) {
                await settingsService.updateBankAccount(editingAccount.id, editingAccount);
            } else {
                await settingsService.createBankAccount(editingAccount);
            }
            const accounts = await settingsService.getBankAccounts();
            setBankAccounts(accounts);
            setEditingAccount(null);
        } catch (error) {
            console.error('Failed to save bank account:', error);
            alert('Gagal menyimpan rekening bank');
        } finally {
            setSavingAccount(false);
        }
    }

    async function handleDeleteAccount(id: string) {
        if (!confirm('Apakah Anda yakin ingin menghapus rekening ini?')) return;

        try {
            await settingsService.deleteBankAccount(id);
            const accounts = await settingsService.getBankAccounts();
            setBankAccounts(accounts);
        } catch (error) {
            console.error('Failed to delete bank account:', error);
            alert('Gagal menghapus rekening bank');
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleEditorChange = (name: string, value: string) => {
        setSettings(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFiles(prev => ({ ...prev, [fieldName]: file }));

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [fieldName]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeFile = (fieldName: string) => {
        setFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[fieldName];
            return newFiles;
        });
        setPreviews(prev => {
            const newPreviews = { ...prev };
            delete newPreviews[fieldName];
            return newPreviews;
        });
    };

    const handleSubmit = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const updates = { ...settings };

            // Upload files if any
            for (const [fieldName, file] of Object.entries(files)) {
                if (file) {
                    try {
                        const url = await settingsService.uploadLogo(file);
                        // @ts-ignore - dynamic key access
                        updates[fieldName] = url;
                    } catch (uploadError) {
                        console.error(`Failed to upload ${fieldName}:`, uploadError);
                    }
                }
            }

            await settingsService.updateSettings(updates);

            // Refresh settings to get clean state
            await loadSettings();
            setFiles({});
            setPreviews({});

            alert('Pengaturan berhasil disimpan');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    };

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg max-w-md">
                    <h3 className="font-bold mb-2">Terjadi Kesalahan</h3>
                    <p>{error}</p>
                    <Button onClick={() => loadSettings()} className="mt-4 bg-red-600 hover:bg-red-700">
                        Coba Lagi
                    </Button>
                </div>
            </div>
        );
    }

    if (!settings) return null;

    const TabButton = ({ tab }: { tab: typeof tabs[0] }) => (
        <button
            onClick={() => setActiveTab(tab.id)}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-bold transition-colors relative
                ${activeTab === tab.id
                    ? 'text-primary-600 bg-white border-x border-t border-gray-200 -mb-px z-10'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
            `}
        >
            <tab.icon className="w-4 h-4" />
            {tab.label}
        </button>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Horizontal Tabs & Save Button */}
            <div className="flex flex-wrap items-center justify-between border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                    {tabs.map(tab => (
                        <TabButton key={tab.id} tab={tab} />
                    ))}
                </div>
                <div className="mb-2">
                    <Button onClick={handleSubmit} disabled={saving} size="sm" className="bg-blue-600 hover:bg-blue-700">
                        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4 mr-2" /> Simpan Perubahan</>}
                    </Button>
                </div>
            </div>

            <div className="bg-white/50 min-h-[500px]">
                {/* General Tab */}
                {activeTab === 'general' && (
                    <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-600" />
                            <h2 className="font-semibold text-gray-900">Identitas & Branding</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Situs</label>
                                <input
                                    type="text"
                                    name="site_title"
                                    value={settings.site_title || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    placeholder="Nama Website"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>
                )}

                {/* Home Content Tab */}
                {activeTab === 'home' && (
                    <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-purple-600" />
                            <h2 className="font-semibold text-gray-900">Konten Halaman Utama</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Hero</label>
                                <input
                                    type="text"
                                    name="home_hero_title"
                                    value={settings.home_hero_title || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
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
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
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
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <UserPen className="w-4 h-4 text-purple-600" />
                            <h2 className="font-semibold text-gray-900">Konten Profil</h2>
                        </div>
                        <div className="p-6 space-y-6">
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
                        </div>
                    </div>
                )}

                {/* Officials Tab */}
                {activeTab === 'officials' && (
                    <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <PenTool className="w-4 h-4 text-blue-600" />
                            <h2 className="font-semibold text-gray-900">Pejabat & Tanda Tangan</h2>
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
                )}

                {/* Contact Tab */}
                {activeTab === 'contact' && (
                    <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
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
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
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
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="contact_email"
                                        value={settings.contact_email || ''}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
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
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-xs"
                                    placeholder="https://www.google.com/maps/embed?..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment & Premium Tab */}
                {activeTab === 'payment' && (
                    <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-green-600" />
                            <h2 className="font-semibold text-gray-900">Pembayaran & Premium</h2>
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
                )}
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
