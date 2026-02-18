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

    // Tab State
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'Umum', icon: Globe },
        { id: 'home', label: 'Konten Beranda', icon: ImageIcon },
        { id: 'profile', label: 'Profil & Organisasi', icon: UserPen },
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

    // ... (keep loadSettings and handlers)

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={saving} size="lg" className="bg-blue-600 hover:bg-blue-700">
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4 mr-2" /> Simpan Perubahan</>}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Navigation (3/12) */}
                <div className="lg:col-span-3 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Right Column: Content (9/12) */}
                <div className="lg:col-span-9 space-y-6">


                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                    <UserPen className="w-4 h-4 text-blue-600" />
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
                        </div>
                    )}

                    {/* Contact Tab */}
                    {activeTab === 'contact' && (
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
