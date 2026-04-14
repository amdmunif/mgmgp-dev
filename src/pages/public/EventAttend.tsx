import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentManagementService } from '../../services/contentManagementService';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';

export function EventAttend() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthorized'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setStatus('unauthorized');
            return;
        }

        if (id) {
            markAttendance(id);
        }
    }, [id]);

    const markAttendance = async (eventId: string) => {
        try {
            await contentManagementService.markSelfAttendance(eventId);
            setStatus('success');
            setMessage('Absensi berhasil! Terima kasih atas kehadiran Anda.');
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Gagal melakukan absensi. Pastikan Anda sudah terdaftar di acara ini.');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl text-center">
                
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-gray-900">Memproses Absensi...</h2>
                        <p className="text-gray-500 mt-2">Mohon tunggu sebentar.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900">Berhasil!</h2>
                        <p className="text-gray-600 mt-2">{message}</p>
                        <Button
                            onClick={() => navigate('/member/events')}
                            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white w-full"
                        >
                            Ke Dashboard Member
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="w-20 h-20 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900">Gagal Absensi</h2>
                        <p className="text-gray-600 mt-2">{message}</p>
                        <Button
                            onClick={() => navigate('/member/events')}
                            variant="outline"
                            className="mt-8 w-full border-gray-300"
                        >
                            Kembali ke Dashboard
                        </Button>
                    </div>
                )}

                {status === 'unauthorized' && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Login Diperlukan</h2>
                        <p className="text-gray-600 mt-2">Silakan login terlebih dahulu untuk melakukan absensi.</p>
                        <Button
                            onClick={() => navigate('/login', { state: { returnUrl: `/events/${id}/attend` } })}
                            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white w-full"
                        >
                            Ayo Login
                        </Button>
                    </div>
                )}

            </div>
        </div>
    );
}
