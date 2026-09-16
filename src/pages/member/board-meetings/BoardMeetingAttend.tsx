import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

export const BoardMeetingAttend: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        markAttendance();
    }, [id]);

    const markAttendance = async () => {
        try {
            await api.post(`/board-meetings/${id}/attend`, {
                method: 'qr'
            });
            setStatus('success');
            setMessage('Kehadiran Anda berhasil dicatat.');
            toast.success('Kehadiran berhasil dicatat');
            
            // Auto redirect after 3 seconds
            setTimeout(() => {
                navigate('/member/board-meetings');
            }, 3000);
            
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Gagal mencatat kehadiran');
        }
    };

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center space-y-6">
                {status === 'loading' && (
                    <>
                        <div className="flex justify-center">
                            <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-slate-900">Mencatat Kehadiran...</h2>
                            <p className="text-slate-500">Mohon tunggu sebentar, sistem sedang memverifikasi data Anda.</p>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900">Berhasil!</h2>
                            <p className="text-slate-600">{message}</p>
                            <p className="text-sm text-slate-400 mt-2">Mengarahkan kembali dalam 3 detik...</p>
                        </div>
                        <Button 
                            className="w-full mt-4" 
                            onClick={() => navigate('/member/board-meetings')}
                        >
                            Kembali ke Daftar Agenda
                        </Button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                <AlertCircle className="w-10 h-10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900">Oops!</h2>
                            <p className="text-slate-600">{message}</p>
                        </div>
                        <div className="flex flex-col gap-3 mt-6">
                            <Button onClick={markAttendance}>
                                Coba Lagi
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/member/board-meetings')}>
                                Kembali ke Daftar Agenda
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
