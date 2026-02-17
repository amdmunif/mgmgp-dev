import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Loader2, Save, User as UserIcon } from 'lucide-react';

export function AdminSettings() {
    const { setPageHeader } = useOutletContext<any>() || {};
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        nama: '',
        asal_sekolah: '',
        no_hp: '',
        pendidikan_terakhir: '',
        jurusan: '',
        status_kepegawaian: '',
        ukuran_baju: '',
    });

    useEffect(() => {
        if (setPageHeader) {
            setPageHeader({
                title: 'Pengaturan Profil',
                description: 'Informasi ini akan digunakan untuk sertifikat dan database anggota.',
                icon: <UserIcon className="w-6 h-6" />
            });
        }
        getProfile();
    }, [setPageHeader]);

    const getProfile = async () => {
        try {
            const data = await api.get<any>('/auth/profile');
            if (data) {
                setFormData({
                    nama: data.nama || '',
                    asal_sekolah: data.asal_sekolah || '',
                    no_hp: data.no_hp || '',
                    pendidikan_terakhir: data.pendidikan_terakhir || '',
                    jurusan: data.jurusan || '',
                    status_kepegawaian: data.status_kepegawaian || '',
                    ukuran_baju: data.ukuran_baju || '',
                });
            }
        } catch (error: any) {
            console.error('Error loading profile:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await api.post('/auth/profile', formData);
            setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });

            // Reload window to update header name if needed or use context
            // window.location.reload(); 
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Gagal menyimpan profil' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /> Loading profil...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="font-semibold text-gray-900">Biodata Diri</h2>
                    <p className="text-sm text-gray-500">Lengkapi data diri Anda untuk keperluan administrasi.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {message && (
                        <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap (dengan Gelar)</label>
                            <input
                                type="text"
                                name="nama"
                                value={formData.nama}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Asal Sekolah</label>
                            <input
                                type="text"
                                name="asal_sekolah"
                                value={formData.asal_sekolah}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP / WA</label>
                            <input
                                type="text"
                                name="no_hp"
                                value={formData.no_hp}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Contoh: 081234567890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pendidikan Terakhir</label>
                            <select
                                name="pendidikan_terakhir"
                                value={formData.pendidikan_terakhir}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Pilih Pendidikan</option>
                                <option value="D3">D3</option>
                                <option value="S1/D4">S1/D4</option>
                                <option value="S2">S2</option>
                                <option value="S3">S3</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jurusan</label>
                            <input
                                type="text"
                                name="jurusan"
                                value={formData.jurusan}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status Kepegawaian</label>
                            <select
                                name="status_kepegawaian"
                                value={formData.status_kepegawaian}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Pilih Status</option>
                                <option value="PNS">PNS</option>
                                <option value="PPPK">PPPK</option>
                                <option value="GTY">GTY</option>
                                <option value="GTT">GTT</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran Baju</label>
                            <select
                                name="ukuran_baju"
                                value={formData.ukuran_baju}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Pilih Ukuran</option>
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="XXL">XXL</option>
                                <option value="XXXL">XXXL</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4 mr-2" /> Simpan Perubahan</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
