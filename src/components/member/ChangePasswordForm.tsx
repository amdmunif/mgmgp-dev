import { useState } from 'react';
import { KeyRound, Loader2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';
import { Button } from '../ui/button';

export function ChangePasswordForm() {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.new_password !== formData.confirm_password) {
            toast.error('Password baru dan konfirmasi tidak cocok.');
            return;
        }

        if (formData.new_password.length < 6) {
            toast.error('Password baru minimal 6 karakter.');
            return;
        }

        setSaving(true);
        try {
            await api.post('/auth/change-password', {
                old_password: formData.old_password,
                new_password: formData.new_password
            });
            toast.success('Password berhasil diubah!');
            setFormData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (error: any) {
            toast.error(error.message || 'Gagal mengubah password');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white shadow-sm border-b border-gray-200 mt-6">
            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6">
                <div className="md:col-span-2">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                        <KeyRound className="w-5 h-5 text-gray-400" /> Ganti Password
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
                        <input
                            type="password"
                            name="old_password"
                            value={formData.old_password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        />
                    </div>
                    <div className="hidden md:block"></div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                        <input
                            type="password"
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleChange}
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
                        <input
                            type="password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        />
                    </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 mt-6 md:col-span-2">
                    <Button type="submit" disabled={saving || !formData.old_password || !formData.new_password} size="lg" className="px-8">
                        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4 mr-2" /> Ganti Password</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}
