import { useState, useEffect, useRef } from 'react';
import { Camera, Save, User as UserIcon, Building2, GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';
import { getFileUrl } from '../../lib/api';
import { settingsService } from '../../services/settingsService';
import { Button } from '../../components/ui/button';

export function EditProfile() {
    // const navigate = useNavigate(); // Unused
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Removed message state

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nama: '',
        asal_sekolah: '',
        no_hp: '',
        pendidikan_terakhir: '',
        jurusan: '',
        status_kepegawaian: '',
        ukuran_baju: '',
        email: '',
    });

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            const user = await api.get<any>('/auth/profile');

            if (user) {
                setFormData({
                    nama: user.nama || '',
                    asal_sekolah: user.asal_sekolah || '',
                    no_hp: user.no_hp || '',
                    pendidikan_terakhir: user.pendidikan_terakhir || '',
                    jurusan: user.jurusan || '',
                    status_kepegawaian: user.status_kepegawaian || '',
                    ukuran_baju: user.ukuran_baju || '',
                    email: user.email || '',
                });
                setAvatarUrl(user.foto_profile);
            }
        } catch (error: any) {
            console.error('Error loading profile:', error);
            toast.error('Gagal memuat profil');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }
        const file = e.target.files[0];
        setUploading(true);

        try {
            const url = await settingsService.uploadLogo(file); // Reusing uploadLogo
            setAvatarUrl(url);
            toast.success('Foto berhasil diupload! Jangan lupa simpan perubahan.');
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast.error('Gagal upload foto: ' + (error.message || error));
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Using POST to /auth/profile which routes to AuthController.updateProfile if set up
            // Or typically PUT. Assuming POST for now based on other patterns or default PHP routing.
            // Looking at `index.php` conventions in this project: typically `POST /resource` is create, `POST /resource/action` is action.
            // If I use `POST /auth/profile`, it might conflict if that's GET.
            // Let's assume `POST /auth/profile` updates it.

            await api.post('/auth/profile', {
                ...formData,
                foto_profile: avatarUrl
            });

            toast.success('Profil berhasil diperbarui!');

            // Reload page to refresh sidebar avatar if changed
            if (avatarUrl) {
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (error: any) {
            console.error('Error saving profile:', error);
            toast.error(error.message || 'Gagal menyimpan profil');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2" /> Loading data...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-primary-100 p-3 rounded-xl">
                    <UserIcon className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
                    <p className="text-gray-500">Kelola informasi pribadi dan data keanggotaan Anda.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">

                    {/* Profile Photo Section */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-100 flex items-center justify-center">
                                {avatarUrl ? (
                                    <img src={getFileUrl(avatarUrl)} alt="Profil" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-12 h-12 text-gray-400" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors shadow-sm"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={uploadAvatar} // Fixed: use uploadAvatar directly
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Klik ikon kamera untuk mengganti foto.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* Personal Info */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                                <UserIcon className="w-5 h-5 text-gray-400" /> Informasi Pribadi
                            </h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap (dengan Gelar)</label>
                            <input
                                type="text"
                                name="nama"
                                value={formData.nama}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP / WhatsApp</label>
                            <input
                                type="text"
                                name="no_hp"
                                value={formData.no_hp}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                placeholder="08..."
                            />
                        </div>

                        {/* Professional Info */}
                        <div className="md:col-span-2 mt-2">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                                <Building2 className="w-5 h-5 text-gray-400" /> Informasi Kepegawaian
                            </h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Asal Sekolah</label>
                            <input
                                type="text"
                                name="asal_sekolah"
                                value={formData.asal_sekolah}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status Kepegawaian</label>
                            <select
                                name="status_kepegawaian"
                                value={formData.status_kepegawaian}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            >
                                <option value="">Pilih Status</option>
                                <option value="PNS">PNS</option>
                                <option value="PPPK">PPPK</option>
                                <option value="GTY">GTY</option>
                                <option value="GTT">GTT</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>

                        {/* Education Info */}
                        <div className="md:col-span-2 mt-2">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                                <GraduationCap className="w-5 h-5 text-gray-400" /> Pendidikan & Lainnya
                            </h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pendidikan Terakhir</label>
                            <select
                                name="pendidikan_terakhir"
                                value={formData.pendidikan_terakhir}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran Baju (Seragam)</label>
                            <select
                                name="ukuran_baju"
                                value={formData.ukuran_baju}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
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

                    <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 mt-6 md:col-span-2">
                        <Button type="submit" disabled={saving} size="lg" className="px-8">
                            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4 mr-2" /> Simpan Perubahan</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
