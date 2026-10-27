import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { api, getFileUrl } from '../../lib/api';
import { formatDate, formatTime } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Calendar, MapPin, ArrowLeft, Clock, Share2, Lock, Loader2, DollarSign, Users, RotateCcw, Eye, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';
import { authService } from '../../services/authService';
import type { Event } from '../../types';

export function EventDetail() {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [participation, setParticipation] = useState<any>(null);
    const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
    const [uploadingProof, setUploadingProof] = useState(false);
    const reUploadInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchEventDetail = async () => {
            try {
                const [eventRes, userRes] = await Promise.all([
                    api.get<Event>(`/events/${id}`),
                    authService.getCurrentUser()
                ]);
                setEvent(eventRes);
                setIsAuthenticated(!!userRes?.user);

                if (userRes?.user) {
                    const part = await api.get<any>(`/events/${id}/participation`);
                    setParticipation(part);
                }
            } catch (error) {
                console.error('Error fetching event detail:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEventDetail();
    }, [id]);

    const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingProof(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'payments');

        try {
            const res = await api.post<{ url: string }>('/upload', formData);
            setPaymentProofUrl(res.url);
        } catch (error) {
            console.error('Failed to upload proof:', error);
            alert('Gagal mengunggah bukti pembayaran');
        } finally {
            setUploadingProof(false);
        }
    };

    const handleReUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !event) return;

        if (!file.type.startsWith('image/')) {
            alert('File bukti harus berupa gambar (JPG, PNG, WebP)');
            if (e.target) e.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Ukuran file maksimal 5MB');
            if (e.target) e.target.value = '';
            return;
        }

        setUploadingProof(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'payments');

        try {
            const res = await api.post<{ url: string }>('/upload', formData);
            if (res.url) {
                await api.post(`/events/${event.id}/upload-payment`, { proof_url: res.url });
                alert('Konfirmasi pembayaran berhasil dikirim ulang! Mohon menunggu verifikasi dari admin.');
                const part = await api.get<any>(`/events/${event.id}/participation`);
                setParticipation(part);
            }
        } catch (error: any) {
            console.error('Failed to upload proof:', error);
            alert('Gagal mengunggah bukti pembayaran: ' + (error?.response?.data?.message || error?.message || 'Terjadi kesalahan'));
        } finally {
            setUploadingProof(false);
            if (e.target) {
                e.target.value = '';
            }
        }
    };

    const handleJoin = async () => {
        if (!event) return;
        
        const isPaid = Number(event.is_paid) === 1;
        if (isPaid && !paymentProofUrl) {
            alert('Silakan unggah bukti pembayaran terlebih dahulu.');
            return;
        }

        setIsJoining(true);
        try {
            await api.post(`/events/${event.id}/join`, { payment_proof_url: paymentProofUrl });
            const part = await api.get<any>(`/events/${event.id}/participation`);
            setParticipation(part);
        } catch (error: any) {
            console.error('Failed to join event:', error);
            alert(error.response?.data?.message || 'Gagal mendaftar kegiatan');
        } finally {
            setIsJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Event tidak ditemukan</h2>
                <Link to="/events">
                    <Button>Kembali ke Agenda</Button>
                </Link>
            </div>
        );
    }

    const startTime = formatTime(event.date);
    const endTime = "Selesai WIB";

    return (
        <div className="bg-gray-50 min-h-screen pb-16">
            {/* Header Image */}
            <div className="h-64 md:h-96 w-full relative">
                <img
                    src={getFileUrl(event.image_url)}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="max-w-4xl w-full px-4 text-white">
                        <Link to="/events" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Agenda
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-bold mb-4">{event.title}</h1>
                        <div className="flex flex-wrap gap-6 text-lg">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-accent-400" />
                                <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-accent-400" />
                                <span>{event.location}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {Number(event.is_premium) === 1 && (
                                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Premium
                                </span>
                            )}
                            {Number(event.is_paid) === 1 && (
                                <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> Berbayar
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tentang Kegiatan</h2>
                        <div
                            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-600 prose-img:rounded-xl prose-img:shadow-sm"
                            dangerouslySetInnerHTML={{
                                __html: event.description.replace(/src="uploads\//g, `src="${getFileUrl('/uploads/')}`)
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-primary-600 sticky top-24">
                        <h3 className="font-bold text-gray-900 text-lg mb-4">Informasi Pendaftaran</h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Waktu Pelaksanaan</p>
                                    <p className="font-medium text-gray-900">{startTime} - {endTime}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Lokasi Detail</p>
                                    <p className="font-medium text-gray-900">{event.location}</p>
                                </div>
                            </div>
                            {event.quota ? (
                                <div className="flex items-start gap-3">
                                    <Users className="w-5 h-5 text-blue-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Kuota Peserta</p>
                                        <p className="font-medium text-gray-900">
                                            {event.participants_count || 0} / {event.quota} terdaftar
                                            {(Number(event.quota) - Number(event.participants_count || 0)) <= 0 && (
                                                <span className="text-red-600 ml-2">(Penuh)</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                            {event.registration_deadline && (
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-red-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Batas Pendaftaran</p>
                                        <p className="font-medium text-red-600">{formatDate(event.registration_deadline)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {participation ? (
                            <div className="space-y-3">
                                <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center font-bold text-sm">
                                    {Number(event.is_paid) === 1 && participation.payment_status === 'confirmed' ? 'Anda Sudah Terdaftar & Pembayaran Lunas' :
                                     Number(event.is_paid) === 1 && participation.payment_status === 'waiting_confirmation' ? 'Pendaftaran Tercatat - Menunggu Konfirmasi' :
                                     Number(event.is_paid) === 1 && participation.payment_status === 'rejected' ? 'Pendaftaran Tercatat - Pembayaran Ditolak' :
                                     'Anda sudah terdaftar di kegiatan ini'}
                                </div>
                                {Number(event.is_paid) === 1 && (
                                    <div className="p-4 text-sm rounded-lg border bg-white space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 font-medium">Status Pembayaran:</span>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                participation.payment_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                participation.payment_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                participation.payment_status === 'waiting_confirmation' ? 'bg-amber-100 text-amber-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {participation.payment_status === 'confirmed' ? 'Lunas' :
                                                 participation.payment_status === 'rejected' ? 'Ditolak' :
                                                 participation.payment_status === 'waiting_confirmation' ? 'Menunggu Konfirmasi' : 'Belum Bayar'}
                                            </span>
                                        </div>

                                        {/* Hidden File Input for re-uploading / repeating confirmation */}
                                        <input 
                                            type="file" 
                                            ref={reUploadInputRef}
                                            accept="image/*"
                                            onChange={handleReUploadProof}
                                            className="hidden"
                                        />

                                        {/* Confirmed */}
                                        {participation.payment_status === 'confirmed' && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center space-y-1">
                                                <div className="flex items-center justify-center gap-1.5 text-green-800 font-semibold text-xs">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    <span>Pembayaran Telah Dikonfirmasi</span>
                                                </div>
                                                <p className="text-xs text-green-700">
                                                    Terima kasih, keikutsertaan Anda telah diverifikasi oleh panitia.
                                                </p>
                                                {participation.payment_proof_url && (
                                                    <div className="pt-1">
                                                        <a
                                                            href={participation.payment_proof_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium hover:underline bg-white px-3 py-1.5 rounded-lg border border-green-200 shadow-sm"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Lihat Bukti Pembayaran
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Waiting Confirmation */}
                                        {participation.payment_status === 'waiting_confirmation' && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center space-y-3">
                                                <div className="flex items-center justify-center gap-2 text-amber-800 font-semibold text-sm">
                                                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                                    <span>Menunggu Konfirmasi Admin</span>
                                                </div>
                                                <p className="text-xs text-amber-700 leading-relaxed">
                                                    Bukti transfer Anda telah diterima dan sedang dalam antrean verifikasi oleh panitia.
                                                </p>
                                                {participation.payment_proof_url && (
                                                    <div>
                                                        <a
                                                            href={participation.payment_proof_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Lihat Bukti yang Terkirim
                                                        </a>
                                                    </div>
                                                )}
                                                <div className="pt-2 border-t border-amber-200/60">
                                                    <Button
                                                        onClick={() => reUploadInputRef.current?.click()}
                                                        disabled={uploadingProof}
                                                        variant="outline"
                                                        className="w-full bg-white hover:bg-amber-100 text-amber-900 border-amber-300 font-medium text-xs py-2 shadow-sm flex items-center justify-center gap-2"
                                                    >
                                                        {uploadingProof ? (
                                                            <><Loader2 className="w-4 h-4 animate-spin text-amber-600" /> Mengirim Ulang Bukti...</>
                                                        ) : (
                                                            <><RotateCcw className="w-3.5 h-3.5 text-amber-700" /> Ulangi Konfirmasi / Kirim Ulang Bukti</>
                                                        )}
                                                    </Button>
                                                    <p className="text-[11px] text-amber-600/90 mt-1.5 text-center">
                                                        Ada kesalahan transfer atau bukti gagal dibaca? Klik tombol di atas untuk mengirim ulang bukti pembayaran.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Rejected */}
                                        {participation.payment_status === 'rejected' && (
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-3">
                                                <div className="flex items-center justify-center gap-2 text-red-800 font-semibold text-sm">
                                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                                    <span>Konfirmasi Pembayaran Ditolak</span>
                                                </div>
                                                <p className="text-xs text-red-700 leading-relaxed">
                                                    Bukti pembayaran sebelumnya ditolak oleh admin. Silakan periksa kembali dan kirim ulang bukti yang valid.
                                                </p>
                                                {participation.payment_proof_url && (
                                                    <div>
                                                        <a
                                                            href={participation.payment_proof_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-medium hover:underline bg-white px-3 py-1.5 rounded-lg border border-red-100 shadow-sm"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Lihat Bukti Sebelumnya
                                                        </a>
                                                    </div>
                                                )}
                                                <div className="pt-2 border-t border-red-200/60">
                                                    <Button
                                                        onClick={() => reUploadInputRef.current?.click()}
                                                        disabled={uploadingProof}
                                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium text-xs py-2 shadow-sm flex items-center justify-center gap-2"
                                                    >
                                                        {uploadingProof ? (
                                                            <><Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...</>
                                                        ) : (
                                                            <><RotateCcw className="w-3.5 h-3.5" /> Ulangi Konfirmasi / Unggah Ulang Bukti</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Pending / Not yet uploaded */}
                                        {(participation.payment_status === 'pending' || !participation.payment_status) && (
                                            <div className="pt-2 border-t border-gray-100 space-y-2">
                                                <p className="text-xs text-gray-600">
                                                    Anda belum mengunggah bukti pembayaran. Silakan transfer dan unggah bukti transfer:
                                                </p>
                                                <Button
                                                    onClick={() => reUploadInputRef.current?.click()}
                                                    disabled={uploadingProof}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2 shadow-sm flex items-center justify-center gap-2"
                                                >
                                                    {uploadingProof ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin" /> Mengunggah Bukti...</>
                                                    ) : (
                                                        <><UploadCloud className="w-3.5 h-3.5" /> Unggah Bukti Transfer</>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (Number(event.is_registration_open) !== 1 || (event.registration_deadline && new Date(event.registration_deadline.includes(' ') ? event.registration_deadline.replace(' ', 'T') : event.registration_deadline) < new Date()) || (event.quota && Number(event.participants_count || 0) >= Number(event.quota))) ? (
                            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center font-medium">
                                {(event.quota && Number(event.participants_count || 0) >= Number(event.quota)) ? 'Kuota Pendaftaran Penuh' : 'Pendaftaran Telah Ditutup'}
                            </div>
                        ) : isAuthenticated ? (
                            (() => {
                                const isPremiumEvent = event.is_premium === 1;
                                const userStr = localStorage.getItem('user_data');
                                const user = userStr ? JSON.parse(userStr) : {};
                                const isPremiumUser = user.premium_until && new Date(user.premium_until) > new Date();
                                const isActive = Number(user.is_active) === 1 || user.is_active === true;
                                const isProfileComplete = user.is_profile_complete === true || user.is_profile_complete === 1 || user.is_profile_complete === "1";

                                if (!isActive) {
                                    return (
                                        <div className="space-y-3">
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                                <Lock className="w-8 h-8 text-red-500 mx-auto mb-2" />
                                                <h4 className="font-bold text-red-800">Menunggu Konfirmasi</h4>
                                                <p className="text-sm text-red-700 mb-3">
                                                    Akun Anda belum diverifikasi oleh admin. Silakan tunggu konfirmasi untuk mendaftar kegiatan.
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }

                                if (!isProfileComplete) {
                                    return (
                                        <div className="space-y-3">
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                                <Users className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                                <h4 className="font-bold text-yellow-800">Lengkapi Profil</h4>
                                                <p className="text-sm text-yellow-700 mb-3">
                                                    Silakan lengkapi data profil Anda (Asal Sekolah, No HP, dll) terlebih dahulu sebelum mendaftar.
                                                </p>
                                                <Link to="/member/profile">
                                                    <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                                                        Lengkapi Profil Sekarang
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                }

                                if (isPremiumEvent && !isPremiumUser) {
                                    return (
                                        <div className="space-y-3">
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                                                <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                                <h4 className="font-bold text-amber-800">Konten Premium</h4>
                                                <p className="text-sm text-amber-700 mb-3">
                                                    Event ini khusus untuk anggota Premium. Upgrade akun Anda untuk mendaftar.
                                                </p>
                                                <Link to="/member/upgrade">
                                                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                                                        Upgrade ke Premium
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-4">
                                        {Number(event.is_paid) === 1 && (
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm">
                                                <h4 className="font-bold text-blue-900 mb-2">Informasi Pembayaran</h4>
                                                <p className="text-blue-800 mb-1">Harga: <strong>Rp {event.price?.toLocaleString('id-ID')}</strong></p>
                                                <p className="text-blue-800 mb-1">Bank/E-Wallet: <strong>{event.bank_name}</strong></p>
                                                <p className="text-blue-800 mb-1">No. Rekening: <strong>{event.bank_account_number}</strong></p>
                                                <p className="text-blue-800 mb-3">Atas Nama: <strong>{event.bank_account_holder}</strong></p>
                                                
                                                <div className="mt-3">
                                                    <label className="block text-blue-900 font-medium mb-1">Upload Bukti Transfer</label>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*"
                                                        onChange={handleUploadProof}
                                                        className="w-full text-xs"
                                                    />
                                                    {uploadingProof && <span className="text-xs text-blue-600 mt-1 block animate-pulse">Mengunggah...</span>}
                                                    {paymentProofUrl && <span className="text-xs text-green-600 mt-1 block font-medium">✓ Bukti berhasil diunggah</span>}
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            className="w-full text-lg h-12 shadow-primary-500/20 hover:shadow-primary-500/40"
                                            onClick={handleJoin}
                                            disabled={isJoining || uploadingProof || (Number(event.is_paid) === 1 && !paymentProofUrl)}
                                        >
                                            {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Daftar Sekarang'}
                                        </Button>
                                        <p className="text-xs text-center text-gray-500">
                                            Kuota terbatas. Pendaftaran ditutup H-1 kegiatan.
                                        </p>
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="space-y-3">
                                <Link to="/login">
                                    <Button variant="outline" className="w-full text-lg h-12 border-primary-600 text-primary-600 hover:bg-primary-50">
                                        <Lock className="w-4 h-4 mr-2" /> Login untuk Mendaftar
                                    </Button>
                                </Link>
                                <p className="text-xs text-center text-gray-500">
                                    Silakan login atau daftar akun untuk mengikuti event ini.
                                </p>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center">
                            <Button variant="ghost" className="text-gray-500 w-full">
                                <Share2 className="w-4 h-4 mr-2" /> Bagikan Event
                            </Button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-xl p-6 text-white">
                        <h3 className="font-bold text-lg mb-2">Butuh Bantuan?</h3>
                        <p className="text-primary-100 text-sm mb-4">Jika Anda memiliki pertanyaan seputar event ini, silakan hubungi panitia.</p>
                        <Button variant="outline" className="w-full border-white text-white hover:bg-white/10 hover:text-white bg-transparent">
                            Hubungi Panitia
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
